import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, createPublicKey, timingSafeEqual, verify as verifySignature } from "node:crypto";
import type { JsonWebKey } from "node:crypto";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { ExternalAuthUser } from "../../domain/entities/external-auth-user.entity";
import type { AuthProvider } from "../../domain/ports/auth-provider.port";

interface SupabaseJwtHeader {
  readonly alg?: string;
  readonly kid?: string;
  readonly typ?: string;
}

interface SupabaseJwtPayload {
  readonly sub?: string;
  readonly email?: string;
  readonly exp?: number;
  readonly nbf?: number;
  readonly user_metadata?: Record<string, unknown> | null;
  readonly email_verified?: boolean;
  readonly email_confirmed_at?: string | null;
  readonly confirmed_at?: string | null;
}

interface JsonWebKeySet {
  readonly keys?: JsonWebKey[];
}

@Injectable()
export class SupabaseAuthProvider implements AuthProvider {
  private static readonly jwksCacheTtlMs = 10 * 60 * 1000;
  private static readonly jwksFetchTimeoutMs = 10_000;

  private readonly client: SupabaseClient;
  private readonly realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;
  private readonly jwksUrl: string;
  private readonly jwtSecret: string;
  private jwksCache?: {
    readonly expiresAt: number;
    readonly keys: JsonWebKey[];
  };

  constructor(config: ConfigService) {
    const supabaseUrl = config.getOrThrow<string>("supabase.url").replace(/\/$/, "");
    this.jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
    this.jwtSecret = config.getOrThrow<string>("supabase.jwtSecret");
    this.client = createClient(
      supabaseUrl,
      config.getOrThrow<string>("supabase.serviceRoleKey"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        realtime: {
          transport: this.realtimeTransport
        }
      }
    );
  }

  verifyAccessToken = async (token: string): Promise<ExternalAuthUser> => {
    const payload = await this.verifyJwt(token);

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }

    return {
      provider: "supabase",
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified: this.isEmailVerified(payload),
      name: this.resolveName(payload.user_metadata ?? null)
    };
  };

  getExternalUser = async (providerUserId: string): Promise<ExternalAuthUser | null> => {
    const { data, error } = await this.client.auth.admin.getUserById(providerUserId);

    if (error || !data.user?.email) {
      return null;
    }

    return {
      provider: "supabase",
      providerUserId: data.user.id,
      email: data.user.email,
      emailVerified: this.isEmailVerified(data.user),
      name: this.resolveName(data.user.user_metadata)
    };
  };

  inviteUser = async (email: string, _tenantId: string): Promise<void> => {
    const { error } = await this.client.auth.admin.inviteUserByEmail(email);

    if (error) {
      throw new Error(error.message);
    }
  };

  disableUser = async (providerUserId: string): Promise<void> => {
    const { error } = await this.client.auth.admin.updateUserById(providerUserId, {
      ban_duration: "876000h"
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  private resolveName = (metadata: Record<string, unknown> | null): string | undefined => {
    if (!metadata) {
      return undefined;
    }

    const name = metadata.name ?? metadata.full_name;
    return typeof name === "string" ? name : undefined;
  };

  private isEmailVerified = (user: {
    email_verified?: boolean | null;
    email_confirmed_at?: string | null;
    confirmed_at?: string | null;
    user_metadata?: Record<string, unknown> | null;
  }): boolean =>
    user.email_verified === true ||
    user.user_metadata?.email_verified === true ||
    Boolean(user.email_confirmed_at ?? user.confirmed_at);

  private verifyJwt = async (token: string): Promise<SupabaseJwtPayload> => {
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }

    const [encodedHeader, encodedPayload, signature] = parts as [string, string, string];
    const header = this.decodeJwtPart<SupabaseJwtHeader>(encodedHeader);

    if (header.alg === "HS256") {
      this.verifyHs256Signature(encodedHeader, encodedPayload, signature);
    } else if (header.alg === "ES256" || header.alg === "RS256") {
      await this.verifyJwksSignature(header, encodedHeader, encodedPayload, signature);
    } else {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }

    const payload = this.decodeJwtPart<SupabaseJwtPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number" && payload.exp <= now) {
      throw new UnauthorizedException("Supabase access token expired.");
    }

    if (typeof payload.nbf === "number" && payload.nbf > now) {
      throw new UnauthorizedException("Supabase access token is not active yet.");
    }

    return payload;
  };

  private verifyHs256Signature = (
    encodedHeader: string,
    encodedPayload: string,
    signature: string
  ): void => {
    const expectedSignature = this.base64UrlEncode(
      createHmac("sha256", this.jwtSecret).update(`${encodedHeader}.${encodedPayload}`).digest()
    );

    if (!this.signaturesMatch(signature, expectedSignature)) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }
  };

  private verifyJwksSignature = async (
    header: SupabaseJwtHeader,
    encodedHeader: string,
    encodedPayload: string,
    signature: string
  ): Promise<void> => {
    if (!header.kid) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }

    const jwk = await this.findJwk(header.kid);

    if (!jwk || jwk.alg !== header.alg) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }

    const publicKey = createPublicKey({ key: jwk, format: "jwk" });
    const isValid = verifySignature(
      "sha256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      header.alg === "ES256" ? { key: publicKey, dsaEncoding: "ieee-p1363" } : publicKey,
      Buffer.from(signature, "base64url")
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }
  };

  private findJwk = async (kid: string): Promise<JsonWebKey | undefined> => {
    const keys = await this.getJwks();
    const cachedKey = keys.find((key) => key.kid === kid);

    if (cachedKey) {
      return cachedKey;
    }

    const refreshedKeys = await this.getJwks({ forceRefresh: true });
    return refreshedKeys.find((key) => key.kid === kid);
  };

  private getJwks = async (options: { readonly forceRefresh?: boolean } = {}): Promise<JsonWebKey[]> => {
    const now = Date.now();

    if (!options.forceRefresh && this.jwksCache && this.jwksCache.expiresAt > now) {
      return this.jwksCache.keys;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SupabaseAuthProvider.jwksFetchTimeoutMs);

    try {
      const response = await fetch(this.jwksUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new UnauthorizedException("Could not verify Supabase access token.");
      }

      const body = (await response.json()) as JsonWebKeySet;
      const keys = body.keys ?? [];
      this.jwksCache = {
        expiresAt: now + SupabaseAuthProvider.jwksCacheTtlMs,
        keys
      };

      return keys;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Could not verify Supabase access token.");
    } finally {
      clearTimeout(timeout);
    }
  };

  private decodeJwtPart = <TValue>(value: string): TValue => {
    try {
      return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as TValue;
    } catch {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }
  };

  private base64UrlEncode = (value: Buffer): string => value.toString("base64url");

  private signaturesMatch = (actual: string, expected: string): boolean => {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  };
}

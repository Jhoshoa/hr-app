import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, generateKeyPairSync, sign } from "node:crypto";
import type { JsonWebKey } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "../../infrastructure/providers/supabase-auth.provider";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        getUserById: jest.fn(),
        inviteUserByEmail: jest.fn(),
        updateUserById: jest.fn()
      }
    }
  }))
}));

const jwtSecret = "local-jwt-secret";

const createConfig = (): ConfigService =>
  ({
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        "supabase.url": "https://example.supabase.co",
        "supabase.serviceRoleKey": "service-role-key",
        "supabase.jwtSecret": jwtSecret
      };

      return values[key];
    })
  }) as unknown as ConfigService;

const signToken = (
  payload: Record<string, unknown>,
  secret = jwtSecret,
  header: Record<string, unknown> = { alg: "HS256", typ: "JWT" }
): string => {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const signEs256Token = (
  payload: Record<string, unknown>,
  kid = "test-key-id"
): { readonly token: string; readonly jwk: JsonWebKey } => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256"
  });
  const encodedHeader = Buffer.from(JSON.stringify({ alg: "ES256", kid, typ: "JWT" })).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign("sha256", Buffer.from(`${encodedHeader}.${encodedPayload}`), {
    key: privateKey,
    dsaEncoding: "ieee-p1363"
  }).toString("base64url");
  const jwk = publicKey.export({ format: "jwk" });

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    jwk: {
      ...jwk,
      alg: "ES256",
      kid,
      key_ops: ["verify"],
      use: "sig"
    }
  };
};

describe("SupabaseAuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("verifies access tokens locally without calling Supabase Auth", async () => {
    const provider = new SupabaseAuthProvider(createConfig());
    const token = signToken({
      sub: "external-user-1",
      email: "owner@example.test",
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 60,
      user_metadata: {
        full_name: "Owner User"
      }
    });

    await expect(provider.verifyAccessToken(token)).resolves.toEqual({
      provider: "supabase",
      providerUserId: "external-user-1",
      email: "owner@example.test",
      emailVerified: true,
      name: "Owner User"
    });
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("rejects expired access tokens", async () => {
    const provider = new SupabaseAuthProvider(createConfig());
    const token = signToken({
      sub: "external-user-1",
      email: "owner@example.test",
      exp: Math.floor(Date.now() / 1000) - 1
    });

    await expect(provider.verifyAccessToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects access tokens with invalid signatures", async () => {
    const provider = new SupabaseAuthProvider(createConfig());
    const token = signToken({
      sub: "external-user-1",
      email: "owner@example.test",
      exp: Math.floor(Date.now() / 1000) + 60
    }, "wrong-secret");

    await expect(provider.verifyAccessToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("verifies ES256 access tokens with the Supabase JWKS endpoint", async () => {
    const { token, jwk } = signEs256Token({
      sub: "external-user-2",
      email: "jwks@example.test",
      exp: Math.floor(Date.now() / 1000) + 60,
      user_metadata: {
        email_verified: true,
        name: "JWKS User"
      }
    });
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [jwk] })
    } as Response);
    const provider = new SupabaseAuthProvider(createConfig());

    await expect(provider.verifyAccessToken(token)).resolves.toEqual({
      provider: "supabase",
      providerUserId: "external-user-2",
      email: "jwks@example.test",
      emailVerified: true,
      name: "JWKS User"
    });
    expect(globalThis.fetch).toHaveBeenCalledWith("https://example.supabase.co/auth/v1/.well-known/jwks.json");
  });
});

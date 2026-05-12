import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ExternalAuthUser } from "../../domain/entities/external-auth-user.entity";
import type { AuthProvider } from "../../domain/ports/auth-provider.port";

@Injectable()
export class SupabaseAuthProvider implements AuthProvider {
  private readonly client: SupabaseClient;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>("supabase.url"),
      config.getOrThrow<string>("supabase.serviceRoleKey"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  verifyAccessToken = async (token: string): Promise<ExternalAuthUser> => {
    const { data, error } = await this.client.auth.getUser(token);

    if (error || !data.user?.email) {
      throw new UnauthorizedException("Invalid Supabase access token.");
    }

    return {
      provider: "supabase",
      providerUserId: data.user.id,
      email: data.user.email,
      name: this.resolveName(data.user.user_metadata)
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
}

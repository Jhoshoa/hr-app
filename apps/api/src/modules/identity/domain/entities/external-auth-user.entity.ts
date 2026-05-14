export interface ExternalAuthUser {
  readonly provider: string;
  readonly providerUserId: string;
  readonly email: string;
  readonly emailVerified?: boolean;
  readonly name?: string;
}

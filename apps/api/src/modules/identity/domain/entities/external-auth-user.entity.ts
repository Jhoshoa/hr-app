export interface ExternalAuthUser {
  readonly provider: string;
  readonly providerUserId: string;
  readonly email: string;
  readonly name?: string;
}

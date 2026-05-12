export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly externalAuthProvider: string;
  readonly externalAuthUserId: string;
}

export const ApiErrorCode = {
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  ValidationFailed: "VALIDATION_FAILED",
  Conflict: "CONFLICT",
  InternalServerError: "INTERNAL_SERVER_ERROR"
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

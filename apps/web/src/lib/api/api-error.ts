export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export const normalizeApiError = (error: unknown): ApiError => {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { error?: ApiError } }).data;

    if (data?.error) {
      return data.error;
    }
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "The request could not be completed."
  };
};

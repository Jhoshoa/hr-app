import { normalizeApiError } from "@/lib/api/api-error";

interface CompanySignupErrorMessage {
  readonly title: string;
  readonly description: string;
}

export const getCompanySignupErrorMessage = (error: unknown): CompanySignupErrorMessage => {
  const apiError = normalizeApiError(error);
  const normalizedMessage = apiError.message.toLowerCase();

  if (apiError.code === "VALIDATION_FAILED") {
    return {
      title: "Review the form",
      description: "Some fields need a valid value before the request can be submitted."
    };
  }

  if (apiError.code === "CONFLICT" && normalizedMessage.includes("admin email")) {
    return {
      title: "Signup request already pending",
      description: "A signup request already exists for this email and is pending approval."
    };
  }

  if (apiError.code === "CONFLICT" && normalizedMessage.includes("tenant slug")) {
    return {
      title: "Workspace unavailable",
      description: "This workspace is already registered or has a pending request."
    };
  }

  if (apiError.code === "CONFLICT") {
    return {
      title: "Signup request already exists",
      description: "A matching request already exists or is pending approval."
    };
  }

  return {
    title: "Signup request could not be sent",
    description: "Try again or contact support if the problem continues."
  };
};

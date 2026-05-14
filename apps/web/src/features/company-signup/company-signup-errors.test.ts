import { describe, expect, it } from "vitest";
import { getCompanySignupErrorMessage } from "./company-signup-errors";

const apiError = (code: string, message: string) => ({
  data: {
    error: {
      code,
      message
    }
  }
});

describe("getCompanySignupErrorMessage", () => {
  it("maps validation errors", () => {
    expect(getCompanySignupErrorMessage(apiError("VALIDATION_FAILED", "Bad request"))).toEqual({
      title: "Review the form",
      description: "Some fields need a valid value before the request can be submitted."
    });
  });

  it("maps pending admin email conflicts", () => {
    expect(
      getCompanySignupErrorMessage(
        apiError("CONFLICT", "A signup request is already pending for this admin email.")
      )
    ).toEqual({
      title: "Signup request already pending",
      description: "A signup request already exists for this email and is pending approval."
    });
  });

  it("maps pending tenant slug conflicts", () => {
    expect(
      getCompanySignupErrorMessage(
        apiError("CONFLICT", "A signup request is already pending for this tenant slug.")
      )
    ).toEqual({
      title: "Workspace unavailable",
      description: "This workspace is already registered or has a pending request."
    });
  });
});

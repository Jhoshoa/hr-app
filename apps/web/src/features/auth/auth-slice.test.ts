import { describe, expect, it } from "vitest";
import { authSlice, clearCurrentUser, setCurrentUser, setPlatformRoles } from "./auth-slice";

describe("authSlice", () => {
  it("stores the current user and platform roles", () => {
    const withUser = authSlice.reducer(
      undefined,
      setCurrentUser({
        email: "owner@example.com",
        id: "user-1",
        name: "Owner"
      })
    );

    const withPlatformRoles = authSlice.reducer(withUser, setPlatformRoles(["PLATFORM_OWNER"]));

    expect(withPlatformRoles).toEqual({
      platformRoles: ["PLATFORM_OWNER"],
      user: {
        email: "owner@example.com",
        id: "user-1",
        name: "Owner"
      }
    });
  });

  it("clears platform roles with the user session", () => {
    const state = authSlice.reducer(
      {
        platformRoles: ["PLATFORM_OWNER"],
        user: {
          email: "owner@example.com",
          id: "user-1"
        }
      },
      clearCurrentUser()
    );

    expect(state).toEqual({
      platformRoles: [],
      user: null
    });
  });
});

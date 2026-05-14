import "reflect-metadata";
import { PlatformRoles, REQUIRED_PLATFORM_ROLES_KEY } from "./platform-roles.decorator";

describe("PlatformRoles decorator", () => {
  it("stores required platform roles metadata", () => {
    class TestController {
      @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
      handle() {
        return undefined;
      }
    }

    const metadata = Reflect.getMetadata(
      REQUIRED_PLATFORM_ROLES_KEY,
      TestController.prototype.handle
    );

    expect(metadata).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);
  });
});

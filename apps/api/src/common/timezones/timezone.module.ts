import { Module } from "@nestjs/common";
import { TimezonePolicyService } from "./timezone-policy.service";
import { TimezoneResolutionService } from "./timezone-resolution.service";

@Module({
  providers: [TimezonePolicyService, TimezoneResolutionService],
  exports: [TimezonePolicyService, TimezoneResolutionService]
})
export class TimezoneModule {}

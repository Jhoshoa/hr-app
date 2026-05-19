import { Module } from "@nestjs/common";
import { TimezoneResolutionService } from "./timezone-resolution.service";

@Module({
  providers: [TimezoneResolutionService],
  exports: [TimezoneResolutionService]
})
export class TimezoneModule {}

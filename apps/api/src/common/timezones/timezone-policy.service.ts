import { BadRequestException, Injectable } from "@nestjs/common";
import { DEFAULT_TIME_ZONE, normalizeTimeZone, type IanaTimeZone } from "@hr-app/timezones";

@Injectable()
export class TimezonePolicyService {
  normalize = (value: string | null | undefined): IanaTimeZone | null => normalizeTimeZone(value);

  assertSupported = (value: string | null | undefined): IanaTimeZone => {
    const timeZone = this.normalize(value);

    if (!timeZone) {
      throw new BadRequestException("Timezone must be a supported IANA timezone.");
    }

    return timeZone;
  };

  getDefault = (): IanaTimeZone => DEFAULT_TIME_ZONE;
}

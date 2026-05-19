import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";

export class CreateCompanySignupRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  companyName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,61}[a-zA-Z0-9])$/)
  desiredTenantSlug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  adminFirstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  adminLastName!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  adminEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyWebsite?: string;

  @ApiProperty({ enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] })
  @IsString()
  @IsIn(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
  companySize!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{2}$/)
  @MaxLength(2)
  country?: string;

  @ApiProperty()
  @IsString()
  @IsTimeZone()
  @MaxLength(80)
  timezone!: string;

  @ApiProperty({ default: "es", enum: ["es", "en"] })
  @IsString()
  @IsIn(["es", "en"])
  preferredLanguage!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

export class AvailabilityQueryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  value!: string;
}

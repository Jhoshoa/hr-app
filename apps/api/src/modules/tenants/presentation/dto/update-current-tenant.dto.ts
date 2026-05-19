import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested
} from "class-validator";

export class UpdateTenantProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string | null;

  @ApiPropertyOptional({ enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] })
  @IsOptional()
  @IsString()
  @IsIn(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
  companySize?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{2}$/)
  @MaxLength(2)
  country?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;
}

export class UpdateCurrentTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: ["es", "en"] })
  @IsOptional()
  @IsIn(["es", "en"])
  defaultLanguage?: string;

  @ApiPropertyOptional({ enum: ["BOB", "USD"] })
  @IsOptional()
  @IsIn(["BOB", "USD"])
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: "America/New_York" })
  @IsOptional()
  @IsString()
  @IsTimeZone()
  @MaxLength(80)
  timezone?: string;

  @ApiPropertyOptional({ type: UpdateTenantProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTenantProfileDto)
  profile?: UpdateTenantProfileDto;
}

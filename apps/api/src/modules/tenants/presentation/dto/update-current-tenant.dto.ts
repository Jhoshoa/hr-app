import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsTimeZone, MaxLength, MinLength } from "class-validator";

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

  @ApiPropertyOptional({ example: "America/La_Paz" })
  @IsOptional()
  @IsString()
  @IsTimeZone()
  @MaxLength(80)
  timezone?: string;
}

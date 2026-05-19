import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsInt,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const normalizeKey = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class CreateOrganizationUnitTypeDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z][a-z0-9_]*$/)
  @Transform(normalizeKey)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(trimString)
  name!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateOrganizationUnitTypeDto extends PartialType(CreateOrganizationUnitTypeDto) {}

export class ReorderOrganizationUnitTypesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  typeIds!: string[];
}

export class CreateOrganizationUnitDto {
  @ApiProperty()
  @IsUUID()
  typeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentOrganizationUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z][a-z0-9_]*$/)
  @Transform(normalizeKey)
  key?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(trimString)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Transform(trimString)
  legalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimString)
  code?: string;
}

export class UpdateOrganizationUnitDto extends PartialType(CreateOrganizationUnitDto) {}

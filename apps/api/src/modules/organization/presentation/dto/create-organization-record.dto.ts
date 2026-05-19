import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString, IsTimeZone, IsUUID, Matches, MaxLength, MinLength } from "class-validator";

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentDepartmentId?: string;
}

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ default: "BO" })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{2}$/)
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ default: "America/La_Paz" })
  @IsOptional()
  @IsString()
  @IsTimeZone()
  @MaxLength(80)
  timezone?: string;
}

export class CreateJobTitleDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  level?: string;
}

export class CreateEmploymentTypeDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}

export class CreateWorkModeDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  type!: string;
}

export class CreateClientProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}

export class UpdateJobTitleDto extends PartialType(CreateJobTitleDto) {}

export class UpdateEmploymentTypeDto extends PartialType(CreateEmploymentTypeDto) {}

export class UpdateWorkModeDto extends PartialType(CreateWorkModeDto) {}

export class UpdateClientProjectDto extends PartialType(CreateClientProjectDto) {}

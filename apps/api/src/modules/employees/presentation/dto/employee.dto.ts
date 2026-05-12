import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CompensationFrequency,
  CompensationVisibility,
  CustomFieldType,
  CustomFieldVisibility,
  EmployeeStatus
} from "@prisma/client";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength
} from "class-validator";

export class EmployeeProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  emergencyContactPhone?: string;
}

export class CreateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  employeeNumber!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(160)
  workEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  personalEmail?: string;

  @ApiProperty()
  @IsISO8601()
  startDate!: string;

  @ApiPropertyOptional({ type: EmployeeProfileDto })
  @IsOptional()
  @IsObject()
  profile?: EmployeeProfileDto;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  workEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  personalEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  terminationDate?: string;

  @ApiPropertyOptional({ type: EmployeeProfileDto })
  @IsOptional()
  @IsObject()
  profile?: EmployeeProfileDto;
}

export class AddEmployeeJobAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobTitleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employmentTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workModeId?: string;

  @ApiProperty()
  @IsISO8601()
  effectiveFrom!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;
}

export class AddManagerRelationshipDto {
  @ApiProperty()
  @IsUUID()
  managerEmployeeId!: string;

  @ApiProperty()
  @IsISO8601()
  effectiveFrom!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;
}

export class AddCompensationRecordDto {
  @ApiProperty()
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ default: "BOB" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: CompensationFrequency, default: CompensationFrequency.MONTHLY })
  @IsOptional()
  @IsEnum(CompensationFrequency)
  frequency?: CompensationFrequency;

  @ApiPropertyOptional({ enum: CompensationVisibility, default: CompensationVisibility.HR_ONLY })
  @IsOptional()
  @IsEnum(CompensationVisibility)
  visibility?: CompensationVisibility;

  @ApiProperty()
  @IsISO8601()
  effectiveFrom!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;
}

export class CreateEmployeeCustomFieldDefinitionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label!: string;

  @ApiProperty({ enum: CustomFieldType })
  @IsEnum(CustomFieldType)
  type!: CustomFieldType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ enum: CustomFieldVisibility, default: CustomFieldVisibility.HR_ONLY })
  @IsOptional()
  @IsEnum(CustomFieldVisibility)
  visibility?: CustomFieldVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  options?: unknown;
}

export class SetEmployeeCustomFieldValueDto {
  @ApiProperty()
  value!: unknown;
}

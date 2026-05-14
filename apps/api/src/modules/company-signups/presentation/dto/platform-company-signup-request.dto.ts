import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class ListCompanySignupRequestsQueryDto {
  @ApiPropertyOptional({ enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] })
  @IsOptional()
  @IsIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ApproveCompanySignupRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,61}[a-zA-Z0-9])$/)
  finalTenantSlug?: string;

  @ApiPropertyOptional({ default: "owner", enum: ["owner"] })
  @IsOptional()
  @IsIn(["owner"])
  initialAdminRoleKey?: "owner";
}

export class RejectCompanySignupRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  rejectionReason!: string;
}

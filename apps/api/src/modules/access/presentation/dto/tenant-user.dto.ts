import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsUUID } from "class-validator";

export class UpdateTenantUserRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  roleIds!: string[];
}


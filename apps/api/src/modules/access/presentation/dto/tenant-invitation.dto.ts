import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsEmail, IsString, IsUUID, MinLength } from "class-validator";

export class CreateTenantInvitationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  roleIds!: string[];
}

export class AcceptTenantInvitationDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token!: string;
}


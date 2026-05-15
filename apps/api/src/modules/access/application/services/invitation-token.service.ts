import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InvitationTokenService {
  createToken = (): string => randomBytes(32).toString("base64url");

  hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
}


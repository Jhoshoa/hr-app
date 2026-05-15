import { BadRequestException } from "@nestjs/common";

const roleKeyPattern = /^[a-z][a-z0-9_]{1,62}[a-z0-9]$/;

export const normalizeRoleKey = (key: string): string =>
  key.trim().toLowerCase().replace(/[\s-]+/g, "_");

export const assertRoleKeyIsValid = (key: string): void => {
  if (!roleKeyPattern.test(key)) {
    throw new BadRequestException(
      "Role key must be lowercase letters, numbers, or underscores and be 3-64 characters."
    );
  }
};


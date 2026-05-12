import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestWithContext } from "../types/request-context";

export const CurrentTenant = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithContext>();
  return request.tenant;
});

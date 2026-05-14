import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { RequestWithContext } from "../types/request-context";
import { AUTH_PROVIDER } from "../../modules/identity/domain/ports/auth-provider.port";
import type { AuthProvider } from "../../modules/identity/domain/ports/auth-provider.port";
import { ResolveAuthenticatedUserUseCase } from "../../modules/identity/application/use-cases/resolve-authenticated-user.use-case";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_PROVIDER) private readonly authProvider: AuthProvider,
    private readonly resolveAuthenticatedUserUseCase: ResolveAuthenticatedUserUseCase
  ) {}

  canActivate = async (context: ExecutionContext): Promise<boolean> => {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const externalUser = await this.authProvider.verifyAccessToken(token);
    const user = await this.resolveAuthenticatedUserUseCase.execute(externalUser);
    request.user = user;

    return true;
  };

  private extractBearerToken = (request: RequestWithContext): string | undefined => {
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    return scheme === "Bearer" ? token : undefined;
  };
}

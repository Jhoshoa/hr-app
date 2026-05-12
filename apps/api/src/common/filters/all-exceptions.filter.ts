import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Response } from "express";
import { ApiErrorCode } from "../errors/api-error-code";

interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildBody(exception, status);
    response.status(status).json(body);
  }

  private buildBody = (exception: unknown, status: number): ApiErrorResponse => {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message = typeof response === "string"
        ? response
        : this.extractMessage(response);

      return {
        error: {
          code: this.codeFromStatus(status),
          message,
          details: typeof response === "object" ? response : undefined
        }
      };
    }

    return {
      error: {
        code: ApiErrorCode.InternalServerError,
        message: "Unexpected server error."
      }
    };
  };

  private extractMessage = (response: object): string => {
    const maybeMessage = "message" in response ? response.message : undefined;

    if (Array.isArray(maybeMessage)) {
      return maybeMessage.join(", ");
    }

    if (typeof maybeMessage === "string") {
      return maybeMessage;
    }

    return "Request failed.";
  };

  private codeFromStatus = (status: number): ApiErrorCode => {
    if (status === HttpStatus.UNAUTHORIZED) {
      return ApiErrorCode.Unauthorized;
    }

    if (status === HttpStatus.FORBIDDEN) {
      return ApiErrorCode.Forbidden;
    }

    if (status === HttpStatus.NOT_FOUND) {
      return ApiErrorCode.NotFound;
    }

    if (status === HttpStatus.CONFLICT) {
      return ApiErrorCode.Conflict;
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return ApiErrorCode.ValidationFailed;
    }

    return ApiErrorCode.InternalServerError;
  };
}

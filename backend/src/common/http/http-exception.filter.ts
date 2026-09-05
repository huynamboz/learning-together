import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiError } from './api-error';
import { getRequestId } from './request-context';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const requestId = getRequestId() ?? request.header('x-request-id');
    const isApiError = exception instanceof ApiError;
    const isHttpError = exception instanceof HttpException;
    const status = isApiError ? exception.statusCode : isHttpError ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isApiError
      ? { code: exception.code, message: exception.message, details: exception.details }
      : isHttpError
        ? { code: 'HTTP_ERROR', message: exception.message, details: exception.getResponse() }
        : { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi máy chủ.', details: {} };
    response.status(status).json({ error: { ...payload, requestId } });
  }
}

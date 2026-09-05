import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ApiError } from './api-error';

describe('HttpExceptionFilter', () => {
  it('returns the stable error envelope for ApiError', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ header: () => 'req-1' }) })
    } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch(new ApiError('BAD_INPUT', 'Invalid', { field: 'email' }, HttpStatus.BAD_REQUEST), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: { code: 'BAD_INPUT', message: 'Invalid', details: { field: 'email' }, requestId: 'req-1' } });
  });
});

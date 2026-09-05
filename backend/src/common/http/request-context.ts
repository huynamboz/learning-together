import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextValue {
  requestId: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextValue>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export class ApiError extends Error {
  constructor({ status = 0, message = 'Something went wrong', errors = null, requestId = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.requestId = requestId;
  }
}

export const OFFLINE_MESSAGE = "Can't reach the server";

// Turns any axios failure into an ApiError. Envelope errors come from { message, errors, requestId }.
export const toApiError = (error) => {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  const body = response?.data && typeof response.data === 'object' ? response.data : {};
  return new ApiError({
    status: response?.status ?? 0,
    message: body.message ?? (response ? error.message : OFFLINE_MESSAGE),
    errors: body.errors ?? null,
    requestId: body.requestId ?? response?.headers?.['x-request-id'] ?? null,
  });
};

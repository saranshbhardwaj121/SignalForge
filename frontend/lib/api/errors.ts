export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    const message =
      typeof body.detail === "string"
        ? body.detail
        : Array.isArray(body.detail)
          ? body.detail.map((d: { msg?: string }) => d.msg).join(", ")
          : "An error occurred";
    return new ApiError(response.status, message, body);
  } catch {
    return new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }
}

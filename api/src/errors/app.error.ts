export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number = 500, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

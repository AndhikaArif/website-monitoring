export class AppError extends Error {
  public statusCode: number;
  public errors?: any;

  constructor(statusCode: number = 500, message: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

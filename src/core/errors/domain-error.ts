export type DomainErrorFields = Record<string, string[]>;
export type DomainErrorDetails = Record<string, unknown>;

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly fields?: DomainErrorFields;
  public readonly details?: DomainErrorDetails;

  constructor(params: {
    code: string;
    message: string;
    statusCode: number;
    fields?: DomainErrorFields;
    details?: DomainErrorDetails;
  }) {
    super(params.message);
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.fields = params.fields;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

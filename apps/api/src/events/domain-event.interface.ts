export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly name: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}

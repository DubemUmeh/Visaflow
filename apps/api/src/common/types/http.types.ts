export interface RequestLike {
  ip?: string;
  socket: {
    remoteAddress?: string;
  };
  body?: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
}

export interface ResponseLike {
  status(code: number): this;
  json(body: unknown): this;
}

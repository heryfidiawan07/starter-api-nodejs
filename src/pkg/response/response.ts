import { Response } from 'express';

export interface Meta {
  page: number;
  per_page: number;
  total: number;
  total_page: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
  meta?: Meta;
  errors?: unknown;
}

const send = (res: Response, status: number, body: ApiResponse): void => {
  res.status(status).json(body);
};

export const ok = (res: Response, message: string, data?: unknown): void =>
  send(res, 200, { success: true, message, data });

export const okWithMeta = (res: Response, message: string, data: unknown, meta: Meta): void =>
  send(res, 200, { success: true, message, data, meta });

export const created = (res: Response, message: string, data?: unknown): void =>
  send(res, 201, { success: true, message, data });

export const badRequest = (res: Response, message: string, errors?: unknown): void =>
  send(res, 400, { success: false, message, errors });

export const unauthorized = (res: Response, message: string): void =>
  send(res, 401, { success: false, message });

export const forbidden = (res: Response, message: string): void =>
  send(res, 403, { success: false, message });

export const notFound = (res: Response, message: string): void =>
  send(res, 404, { success: false, message });

export const unprocessable = (res: Response, message: string, errors: unknown): void =>
  send(res, 422, { success: false, message, errors });

export const serverError = (res: Response, message: string): void =>
  send(res, 500, { success: false, message });

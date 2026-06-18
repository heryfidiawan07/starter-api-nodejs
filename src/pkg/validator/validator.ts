import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export const validate = <T extends z.ZodTypeAny>(schema: T, data: unknown): { data?: z.output<T>; errors?: ValidationError[] } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data as z.output<T> };
  }

  const errors: ValidationError[] = result.error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return { errors };
};

// Shared schemas
export const uuidSchema = z.string().uuid('must be a valid UUID');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(''),
});

// src/lib/schemas/textile.ts
import { z } from 'zod';

const textileFiberCompositionSchema = z.object({
  name: z.string().min(1, 'Fiber name is required.'),
  percentage: z.coerce.number().min(0, 'Percentage cannot be negative.').max(100, 'Percentage cannot exceed 100.'),
});

export const textileDataSchema = z.object({
  fiberComposition: z.array(textileFiberCompositionSchema).optional(),
  dyeProcess: z.string().optional(),
  weaveType: z.string().optional(),
});

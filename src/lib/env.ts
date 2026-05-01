import 'server-only';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().default('file:./prisma/dev.db'),
  TURSO_AUTH_TOKEN: z.string().optional(),
  TRIPADVISOR_API_KEY: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().default(''),
  DEMO_ROW_LIMIT: z.coerce.number().default(5),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const env = parsed.data;

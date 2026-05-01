import 'server-only';
import { z } from 'zod';
import { env } from '@/lib/env';
import {
  LocationMapperResponse,
  LocationSearchResponse,
  LocationDetailsResponse,
} from './types';

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 200; // 5 req/sec ceiling

async function rateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export class TripadvisorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'TripadvisorError';
  }
}

async function call<T extends z.ZodTypeAny>(
  endpoint: string,
  params: Record<string, string | number>,
  schema: T,
  apiKey: string = env.TRIPADVISOR_API_KEY,
): Promise<z.infer<T>> {
  await rateLimit();

  const url = new URL(`https://api.content.tripadvisor.com${endpoint}`);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (err) {
    throw new TripadvisorError('network', String(err));
  }

  if (res.status === 429) {
    throw new TripadvisorError('rate_limited', 'Tripadvisor rate limit exceeded', 429);
  }
  if (res.status === 401) {
    throw new TripadvisorError('invalid_key', 'API key rejected by Tripadvisor', 401);
  }
  if (!res.ok) {
    throw new TripadvisorError('http_error', `${res.status} ${res.statusText}`, res.status);
  }

  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new TripadvisorError(
      'invalid_response',
      `Schema mismatch on ${endpoint}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export const tripadvisor = {
  locationMapper: (
    input: {
      query: string;
      latitude?: number;
      longitude?: number;
      phone?: string;
      address?: string;
    },
    apiKey?: string,
  ) =>
    call(
      '/api/partner/2.0/location_mapper',
      {
        searchQuery: input.query,
        ...(input.latitude !== undefined && input.longitude !== undefined
          ? { latLong: `${input.latitude},${input.longitude}` }
          : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.address ? { address: input.address } : {}),
        category: 'hotels',
      },
      LocationMapperResponse,
      apiKey ?? env.TRIPADVISOR_API_KEY,
    ),

  locationSearch: (
    input: { query: string; latLong?: string },
    apiKey?: string,
  ) =>
    call(
      '/api/partner/2.0/location/search',
      {
        searchQuery: input.query,
        ...(input.latLong ? { latLong: input.latLong } : {}),
        category: 'hotels',
      },
      LocationSearchResponse,
      apiKey ?? env.TRIPADVISOR_API_KEY,
    ),

  locationDetails: (locationId: string, apiKey?: string) =>
    call(
      `/api/partner/2.0/location/${locationId}/details`,
      {},
      LocationDetailsResponse,
      apiKey ?? env.TRIPADVISOR_API_KEY,
    ),
};

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({ _data: data, _status: init?.status ?? 200 }),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { POST } from './route';
import { createClient } from '@supabase/supabase-js';

const mockCreateClient = vi.mocked(createClient);

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/check-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeSupabaseMock(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return { from: vi.fn().mockReturnValue(chain) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = { _data: unknown; _status: number };

describe('POST /api/check-email', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  afterEach(() => {
    Object.keys(process.env).forEach((k) => {
      if (!(k in originalEnv)) delete process.env[k];
    });
    Object.assign(process.env, originalEnv);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns 400 for missing email', async () => {
    const res = (await POST(makeRequest({}))) as unknown as MockResponse;
    expect(res._data).toEqual({ error: 'Invalid email' });
    expect(res._status).toBe(400);
  });

  it('returns no-service-key when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'no-service-key' });
  });

  it('returns no-service-key when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'no-service-key' });
  });

  it('returns not-invited when email is absent from approved_emails', async () => {
    mockCreateClient.mockReturnValue(makeSupabaseMock({ data: null, error: null }) as unknown as ReturnType<typeof createClient>);
    const res = (await POST(makeRequest({ email: 'unknown@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'not-invited' });
  });

  it('returns error when approved_emails query fails', async () => {
    mockCreateClient.mockReturnValue(
      makeSupabaseMock({ data: null, error: { message: 'DB error' } }) as unknown as ReturnType<typeof createClient>,
    );
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'error' });
  });

  it('returns invited when auth admin API is unavailable', async () => {
    mockCreateClient.mockReturnValue(
      makeSupabaseMock({ data: { email: 'test@example.com' }, error: null }) as unknown as ReturnType<typeof createClient>,
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'invited' });
  });

  it('returns invited when user is approved but has no auth account', async () => {
    mockCreateClient.mockReturnValue(
      makeSupabaseMock({ data: { email: 'test@example.com' }, error: null }) as unknown as ReturnType<typeof createClient>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ users: [] }) }),
    );
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'invited' });
  });

  it('returns google when user has only a Google identity', async () => {
    mockCreateClient.mockReturnValue(
      makeSupabaseMock({ data: { email: 'test@example.com' }, error: null }) as unknown as ReturnType<typeof createClient>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [{ email: 'test@example.com', identities: [{ provider: 'google' }] }],
        }),
      }),
    );
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'google' });
  });

  it('returns existing when user has a password identity', async () => {
    mockCreateClient.mockReturnValue(
      makeSupabaseMock({ data: { email: 'test@example.com' }, error: null }) as unknown as ReturnType<typeof createClient>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [{ email: 'test@example.com', identities: [{ provider: 'email' }] }],
        }),
      }),
    );
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'existing' });
  });

  it('returns existing when user has both Google and password identities', async () => {
    mockCreateClient.mockReturnValue(
      makeSupabaseMock({ data: { email: 'test@example.com' }, error: null }) as unknown as ReturnType<typeof createClient>,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            { email: 'test@example.com', identities: [{ provider: 'google' }, { provider: 'email' }] },
          ],
        }),
      }),
    );
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'existing' });
  });

  it('returns 500 error on unexpected exception', async () => {
    mockCreateClient.mockImplementation(() => {
      throw new Error('Unexpected');
    });
    const res = (await POST(makeRequest({ email: 'test@example.com' }))) as unknown as MockResponse;
    expect(res._data).toEqual({ status: 'error' });
    expect(res._status).toBe(500);
  });
});

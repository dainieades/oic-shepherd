import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/context', () => ({ useApp: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: vi.fn().mockResolvedValue({}) } }),
}));

import AccessGate from './AccessGate';
import { useApp } from '@/lib/context';

const mockUseApp = vi.mocked(useApp);

describe('AccessGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when accessDenied is false', () => {
    mockUseApp.mockReturnValue({ accessDenied: false } as unknown as ReturnType<typeof useApp>);
    const { container } = render(<AccessGate />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the access-denied overlay when accessDenied is true', () => {
    mockUseApp.mockReturnValue({ accessDenied: true } as unknown as ReturnType<typeof useApp>);
    const { getByText } = render(<AccessGate />);
    expect(getByText('Access Restricted')).toBeTruthy();
    expect(getByText('Back to Sign In')).toBeTruthy();
  });

  it('shows the contact-your-pastor message', () => {
    mockUseApp.mockReturnValue({ accessDenied: true } as unknown as ReturnType<typeof useApp>);
    const { getByText } = render(<AccessGate />);
    expect(getByText(/Contact your pastor/i)).toBeTruthy();
  });
});

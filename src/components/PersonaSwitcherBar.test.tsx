import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/context', () => ({ useApp: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

import PersonaSwitcherBar from './PersonaSwitcherBar';
import { useApp } from '@/lib/context';

const mockUseApp = vi.mocked(useApp);

const personas = [
  { id: 'admin', name: 'Admin User', role: 'admin' as const, assignedPeopleIds: [] },
  { id: 'shepherd-1', name: 'John Shepherd', role: 'shepherd' as const, assignedPeopleIds: [] },
];

describe('PersonaSwitcherBar', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    mockUseApp.mockReturnValue({
      data: { personas },
      currentPersona: personas[0],
      switchPersona: vi.fn(),
    } as unknown as ReturnType<typeof useApp>);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('renders nothing outside development mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { container } = render(<PersonaSwitcherBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a button for each persona in development mode', () => {
    const { getByText } = render(<PersonaSwitcherBar />);
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('Shepherd 1')).toBeTruthy();
  });

  it('calls switchPersona with the correct id when a persona button is clicked', async () => {
    const switchPersona = vi.fn();
    mockUseApp.mockReturnValue({
      data: { personas },
      currentPersona: personas[0],
      switchPersona,
    } as unknown as ReturnType<typeof useApp>);

    const { getByText } = render(<PersonaSwitcherBar />);
    await act(async () => {
      getByText('Shepherd 1').click();
    });
    expect(switchPersona).toHaveBeenCalledWith('shepherd-1');
  });

  it('highlights the active persona button', () => {
    const { getByText } = render(<PersonaSwitcherBar />);
    const activeBtn = getByText('Admin').closest('button') as HTMLButtonElement;
    expect(activeBtn.style.fontWeight).toBe('600');
  });
});

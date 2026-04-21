import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/context', () => ({ useApp: vi.fn() }));

import AddPersonModal from './AddPersonModal';
import { useApp } from '@/lib/context';
import { ToastProvider } from './Toast';

const mockUseApp = vi.mocked(useApp);

const emptyData = { personas: [], people: [], groups: [], families: [] };

function buildContext(overrides: Record<string, unknown> = {}) {
  return {
    data: emptyData,
    addPerson: vi.fn().mockResolvedValue('new-person-id'),
    assignGroupsToPerson: vi.fn().mockResolvedValue(undefined),
    assignShepherds: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useApp>;
}

function renderModal(onClose = vi.fn()) {
  mockUseApp.mockReturnValue(buildContext());
  return render(
    <ToastProvider>
      <AddPersonModal onClose={onClose} />
    </ToastProvider>,
  );
}

describe('AddPersonModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with a disabled Save button when no name is entered', () => {
    const { getByRole } = renderModal();
    const saveBtn = getByRole('button', { name: 'Save' });
    expect(saveBtn).toBeTruthy();
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables the Save button once a preferred name is typed', () => {
    const { getByRole, getByPlaceholderText } = renderModal();
    const input = getByPlaceholderText('Preferred name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'John' } });
    const saveBtn = getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('calls addPerson with the entered name on Save', async () => {
    const addPerson = vi.fn().mockResolvedValue('new-person-id');
    mockUseApp.mockReturnValue(buildContext({ addPerson }));

    const { getByRole, getByPlaceholderText } = render(
      <ToastProvider>
        <AddPersonModal onClose={vi.fn()} />
      </ToastProvider>,
    );

    fireEvent.change(getByPlaceholderText('Preferred name'), { target: { value: 'Jane' } });
    fireEvent.click(getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(addPerson).toHaveBeenCalledOnce();
      expect(addPerson).toHaveBeenCalledWith(
        expect.objectContaining({ englishName: 'Jane' }),
      );
    });
  });

  it('does not call addPerson when Save is clicked with an empty name', () => {
    const addPerson = vi.fn().mockResolvedValue('id');
    mockUseApp.mockReturnValue(buildContext({ addPerson }));

    const { getByRole } = render(
      <ToastProvider>
        <AddPersonModal onClose={vi.fn()} />
      </ToastProvider>,
    );

    fireEvent.click(getByRole('button', { name: 'Save' }));
    expect(addPerson).not.toHaveBeenCalled();
  });

  it('includes last name in the englishName when both are provided', async () => {
    const addPerson = vi.fn().mockResolvedValue('id');
    mockUseApp.mockReturnValue(buildContext({ addPerson }));

    const { getByRole, getByPlaceholderText } = render(
      <ToastProvider>
        <AddPersonModal onClose={vi.fn()} />
      </ToastProvider>,
    );

    fireEvent.change(getByPlaceholderText('Preferred name'), { target: { value: 'Jane' } });
    fireEvent.change(getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.click(getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(addPerson).toHaveBeenCalledWith(
        expect.objectContaining({ englishName: 'Jane Doe' }),
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/context', () => ({ useApp: vi.fn() }));

vi.mock('./PickerMenu', () => ({
  default: ({
    options,
    onSelect,
    onClose,
  }: {
    options: Array<{ value: string; label: string }>;
    onSelect: (v: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="picker-menu">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            onSelect(opt.value);
            onClose();
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./DatePickerSheet', () => ({
  default: ({
    onConfirm,
    onClose,
  }: {
    onConfirm: (date: string, time: string, includeTime: boolean) => void;
    onClose: () => void;
  }) => (
    <div data-testid="date-picker-sheet">
      <button
        onClick={() => {
          onConfirm('2026-06-15', '00:00', false);
          onClose();
        }}
      >
        Pick 2026-06-15
      </button>
    </div>
  ),
}));

vi.mock('./PersonFamilyPicker', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="person-family-picker">
      <button onClick={onClose}>Done</button>
    </div>
  ),
}));

import AddTodoModal from './AddTodoModal';
import { useApp } from '@/lib/context';
import { ToastProvider } from './Toast';

const mockUseApp = vi.mocked(useApp);

const emptyData = { families: [], people: [], personas: [] };

function buildContext(overrides: Record<string, unknown> = {}) {
  return {
    data: emptyData,
    addTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useApp>;
}

function renderModal(onClose = vi.fn()) {
  mockUseApp.mockReturnValue(buildContext());
  return render(
    <ToastProvider>
      <AddTodoModal onClose={onClose} />
    </ToastProvider>,
  );
}

describe('AddTodoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with a disabled Save button when title is empty', () => {
    const { getByRole } = renderModal();
    const saveBtn = getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('enables the Save button once a title is typed', () => {
    const { getByRole, getByPlaceholderText } = renderModal();
    const textarea = getByPlaceholderText(/To-dos are upcoming/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Call John' } });
    const saveBtn = getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('calls addTodo with the title when Save is clicked', async () => {
    const addTodo = vi.fn();
    mockUseApp.mockReturnValue(buildContext({ addTodo }));

    const { getByRole, getByPlaceholderText } = render(
      <ToastProvider>
        <AddTodoModal onClose={vi.fn()} />
      </ToastProvider>,
    );

    fireEvent.change(getByPlaceholderText(/To-dos are upcoming/i), {
      target: { value: 'Call John' },
    });
    fireEvent.click(getByRole('button', { name: 'Save' }));

    expect(addTodo).toHaveBeenCalledWith(expect.objectContaining({ title: 'Call John' }));
  });

  it('date picker integration — opens DatePickerSheet and updates the date on confirm', async () => {
    const { getByRole, getByTestId, queryByTestId, getByText } = renderModal();

    expect(queryByTestId('date-picker-sheet')).toBeNull();

    // Click the Date field row to open the picker
    fireEvent.click(getByRole('button', { name: /date/i }));
    expect(getByTestId('date-picker-sheet')).toBeTruthy();

    // Confirm a specific date
    fireEvent.click(getByText('Pick 2026-06-15'));
    expect(queryByTestId('date-picker-sheet')).toBeNull();

    // The Date field row should now reflect the chosen date
    await waitFor(() => {
      expect(getByRole('button', { name: /jun 15/i })).toBeTruthy();
    });
  });

  it('repeat setting persists — selecting a repeat option updates the label', async () => {
    const { getByRole, getByText } = renderModal();

    // Initially shows "Never"
    expect(getByRole('button', { name: /repeat/i }).textContent).toContain('Never');

    // Open the repeat picker
    fireEvent.click(getByRole('button', { name: /repeat/i }));

    // Select "Every week" from the mocked PickerMenu
    fireEvent.click(getByText('Every week'));

    // The Repeat field row now shows the selected label
    await waitFor(() => {
      expect(getByRole('button', { name: /repeat/i }).textContent).toContain('Every week');
    });
  });

  it('repeat setting is included in addTodo when a repeat is selected', async () => {
    const addTodo = vi.fn();
    mockUseApp.mockReturnValue(buildContext({ addTodo }));

    const { getByRole, getByPlaceholderText, getByText } = render(
      <ToastProvider>
        <AddTodoModal onClose={vi.fn()} />
      </ToastProvider>,
    );

    fireEvent.change(getByPlaceholderText(/To-dos are upcoming/i), {
      target: { value: 'Weekly check-in' },
    });
    // Open repeat picker and select "Every week"
    fireEvent.click(getByRole('button', { name: /repeat/i }));
    fireEvent.click(getByText('Every week'));

    fireEvent.click(getByRole('button', { name: 'Save' }));
    expect(addTodo).toHaveBeenCalledWith(expect.objectContaining({ repeat: 'weekly' }));
  });
});

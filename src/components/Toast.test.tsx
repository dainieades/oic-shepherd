import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from './Toast';

function Trigger({ message, type }: { message: string; type?: 'success' | 'error' }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>Show</button>;
}

describe('ToastProvider / useToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays a toast after showToast is called', async () => {
    const { getByText, queryByText } = render(
      <ToastProvider>
        <Trigger message="Saved!" />
      </ToastProvider>,
    );
    expect(queryByText('Saved!')).toBeNull();
    await act(async () => {
      getByText('Show').click();
    });
    expect(getByText('Saved!')).toBeTruthy();
  });

  it('displays an error toast with the correct message', async () => {
    const { getByText } = render(
      <ToastProvider>
        <Trigger message="Something went wrong" type="error" />
      </ToastProvider>,
    );
    await act(async () => {
      getByText('Show').click();
    });
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('removes the toast after the dismiss timeout', async () => {
    vi.useFakeTimers();
    const { getByText, queryByText } = render(
      <ToastProvider>
        <Trigger message="Done!" />
      </ToastProvider>,
    );
    await act(async () => {
      getByText('Show').click();
    });
    expect(queryByText('Done!')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(2600);
    });
    expect(queryByText('Done!')).toBeNull();
  });

  it('can show multiple toasts concurrently', async () => {
    const { getAllByText, getByText } = render(
      <ToastProvider>
        <Trigger message="First" />
        <Trigger message="Second" />
      </ToastProvider>,
    );
    await act(async () => {
      getAllByText('Show').forEach((btn) => btn.click());
    });
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('throws when useToast is used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger message="test" />)).toThrow(
      'useToast must be used within ToastProvider',
    );
    consoleError.mockRestore();
  });
});

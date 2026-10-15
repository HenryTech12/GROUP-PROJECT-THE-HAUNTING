import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

const seen = () => localStorage.setItem('gpth:v1', JSON.stringify({ openingSeen: true }));

async function toWorkspace(user: ReturnType<typeof userEvent.setup>, option: 'A' | 'B' | 'C' = 'B') {
  await user.click(screen.getByTestId('start'));
  await user.click(screen.getByRole('button', { name: /skip intro/i }));
  await user.click(document.querySelector(`[data-option="${option}"]`) as HTMLElement);
  await user.click(screen.getByTestId('begin'));
}

describe('game flow (UI)', () => {
  it('shows the title screen with the required copy', () => {
    render(<App />);
    expect(screen.getByText('START SURVIVAL')).toBeInTheDocument();
    expect(screen.getByText(/One assignment\. Four teammates\. One hour\./)).toBeInTheDocument();
  });

  it('opening cannot be skipped on first play', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('start'));
    expect(screen.queryByRole('button', { name: /skip intro/i })).not.toBeInTheDocument();
    expect(screen.getByText(/EEE 204 — Academic Avengers/)).toBeInTheDocument();
  });

  it('skip → first choice changes state → actions update HUD and history', async () => {
    seen();
    const user = userEvent.setup();
    render(<App />);
    await toWorkspace(user, 'B');
    expect(screen.getByLabelText('Progress')).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByLabelText('Sanity')).toHaveAttribute('aria-valuenow', '70');
    await user.click(document.querySelector('[data-action="break"]') as HTMLElement);
    expect(screen.getByLabelText('Sanity').getAttribute('aria-valuenow')).not.toBe('70');
    expect(within(screen.getByTestId('outcome')).getByText('Take a break')).toBeInTheDocument();
  });

  it('pausing freezes actions', async () => {
    seen();
    const user = userEvent.setup();
    render(<App />);
    await toWorkspace(user, 'A');
    await user.click(screen.getByLabelText('Pause game'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(screen.queryByRole('dialog', { name: 'Paused' })).not.toBeInTheDocument();
  });
});

describe('real-time limit', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('resolves to an ending when the session clock expires, and restart works', async () => {
    seen();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await toWorkspace(user, 'B');
    expect(screen.getByTestId('session-clock')).toHaveTextContent('4:0');
    for (let i = 0; i < 260; i++) await act(async () => void vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('ending-title')).toBeInTheDocument();
    await user.click(screen.getByTestId('restart'));
    expect(document.querySelector('[data-option="A"]')).toBeInTheDocument();
  });
});

describe('opening timing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('plays itself in roughly 45–75s of chat+title time, then shows the brief', async () => {
    render(<App />);
    await act(async () => screen.getByTestId('start').click());
    const total = (await import('../src/components/Opening')).CHAT_WAITS.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(40000);
    expect(total).toBeLessThanOrEqual(60000);
    const run = async (ms: number) => {
      for (let elapsed = 0; elapsed < ms; elapsed += 250) await act(async () => void vi.advanceTimersByTime(250));
    };
    await run(total + 6000);
    expect(screen.queryByText(/EEE 204 — Academic Avengers/)).not.toBeInTheDocument(); // chat scene is over
    await run(25000);
    expect(screen.getByText('Open the group chat')).toBeInTheDocument();
    expect(screen.getByText('EEE 204 — Group Assignment')).toBeInTheDocument();
  });
});

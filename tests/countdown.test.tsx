import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from '../src/hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('counts down only while running and fires onExpire once', () => {
    const onExpire = vi.fn();
    const { result, rerender } = renderHook(({ running }) => useCountdown({ seconds: 10, running, onExpire }), { initialProps: { running: false } });
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current).toBe(10);
    rerender({ running: true });
    act(() => void vi.advanceTimersByTime(3000));
    expect(result.current).toBe(7);
    rerender({ running: false });
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current).toBe(7);
    rerender({ running: true });
    act(() => void vi.advanceTimersByTime(20000));
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('never goes negative and clears its interval on unmount', () => {
    const onExpire = vi.fn();
    const { unmount } = renderHook(() => useCountdown({ seconds: 2, running: true, onExpire }));
    unmount();
    act(() => void vi.advanceTimersByTime(10000));
    expect(onExpire).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not create duplicate timers across re-renders', () => {
    const { rerender } = renderHook(() => useCountdown({ seconds: 30, running: true, onExpire: () => {} }));
    rerender();
    rerender();
    rerender();
    expect(vi.getTimerCount()).toBe(1);
  });

  it('resets when resetKey changes', () => {
    const { result, rerender } = renderHook(({ k }) => useCountdown({ seconds: 10, running: true, resetKey: k, onExpire: () => {} }), { initialProps: { k: 0 } });
    act(() => void vi.advanceTimersByTime(4000));
    expect(result.current).toBe(6);
    rerender({ k: 1 });
    expect(result.current).toBe(10);
  });
});

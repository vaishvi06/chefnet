import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../hooks/useCountdown';

describe('useCountdown Hook (Reservation Cutoff Timer)', () => {
  it('returns isExpired: true and "Cutoff passed" when cutoff date is in the past', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(pastDate));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe('Cutoff passed');
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it('calculates remaining hours and minutes for future cutoff time', () => {
    // 2 hours and 30 minutes in the future
    const futureDate = new Date(Date.now() + (2 * 3600 + 30 * 60) * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(futureDate));

    expect(result.current.isExpired).toBe(false);
    expect(result.current.hours).toBe(2);
    expect(result.current.minutes).toBe(29); // or 30 depending on subsecond difference
    expect(result.current.formatted).toMatch(/\d{2}h \d{2}m \d{2}s/);
  });

  it('handles null or missing cutoff safely', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe('00:00:00');
  });
});


import { useState, useEffect } from 'react';

/**
 * Hook to countdown to a target cutoff time
 * @param {string|Date} cutoffTime
 * @returns {{ hours: number, minutes: number, seconds: number, isExpired: boolean, formatted: string }}
 */
export const useCountdown = (cutoffTime) => {
  const calculateTimeLeft = () => {
    if (!cutoffTime) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' };
    }

    const difference = new Date(cutoffTime).getTime() - new Date().getTime();

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: 'Cutoff passed' };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const pad = (n) => n.toString().padStart(2, '0');
    const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

    return { hours, minutes, seconds, isExpired: false, formatted };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [cutoffTime]);

  return timeLeft;
};


'use client';
import { useEffect, useState } from 'react';
import { displayDate } from '../lib/displayDate';

export function useCountdown(time: number) {
  const [elapsed, setElapsed] = useState(0);

  const cooldown = Math.max(time - elapsed, 0);
  const { minutes, seconds, hours } = displayDate(cooldown);

  useEffect(() => {
    setElapsed(0); // Reset on time change
  }, [time]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  return {
    cooldown,
    minutes: minutes < 10 ? `0${minutes}` : minutes,
    seconds: seconds < 10 ? `0${seconds}` : seconds,
    hours: hours < 10 ? `0${hours}` : hours,
  };
}

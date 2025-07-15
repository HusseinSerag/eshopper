export function displayDate(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;
  return {
    minutes,
    seconds: secondsLeft,
    hours,
  };
}

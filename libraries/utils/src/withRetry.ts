export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on certain types of errors
      if (
        error.message?.includes('already exists') ||
        error.message?.includes('validation') ||
        error.code === 'resource_missing'
      ) {
        break;
      }

      // Exponential backoff with jitter
      const delay = delayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

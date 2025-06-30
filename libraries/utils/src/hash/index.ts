import * as argon2 from 'argon2';

export async function hashString(str: string) {
  return await argon2.hash(str, {
    type: argon2.argon2id, // Best for most use-cases
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 5, // Number of iterations
    parallelism: 2, // Number of threads
  });
}

export async function compareString(hash: string, plain: string) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

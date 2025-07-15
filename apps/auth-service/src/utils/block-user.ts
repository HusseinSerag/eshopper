import { config, redisProvider } from '../provider';

export async function blockUser(userId: string) {
  await redisProvider.setTTL(
    `blocked:${userId}`,
    (Date.now() + config.get('BLOCKED_TIME') * 1000).toString(),
    config.get('BLOCKED_TIME') * 1000
  );
}

export function unblockUser(userId: string) {
  redisProvider.delete(`blocked:${userId}`);
}

export async function isUserBlocked(userId: string) {
  const blockedTime = await redisProvider.getTTLTimeLeft(`blocked:${userId}`);

  return blockedTime;
}

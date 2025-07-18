import { OAuthModes } from '@eshopper/shared-types';

import z from 'zod';
import { AuthenticateHttpClient } from './client-auth';

const replySchema = z.object({
  data: z.string(),
});
export async function getGoogleLink(
  client: AuthenticateHttpClient,
  mode: OAuthModes
) {
  // mode:signup
  const params = new URLSearchParams();
  params.set('mode', mode);

  const res = await client.request({
    url: '/auth/oauth/google?' + params.toString(),
    method: 'get',
  });
  const reply = replySchema.parse(res);

  return reply.data;
}

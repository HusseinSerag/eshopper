import { AuthenticateHttpClient } from '@eshopper/client-auth';
import { OAuthModes } from '@eshopper/shared-types';

import z from 'zod';

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

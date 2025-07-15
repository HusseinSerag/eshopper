import { redirect } from 'next/navigation';

interface Props {
  link: string;
}

export function RedirectionComponent({ link }: Props) {
  redirect(link);

  return null;
}

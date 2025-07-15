import { Card } from '@eshopper/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex px-4 py-8 min-h-svh items-center justify-center">
      <Card className="max-w-md border-2 w-full">{children}</Card>
    </div>
  );
}

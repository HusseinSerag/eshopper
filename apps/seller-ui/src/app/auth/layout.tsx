import { Card } from '@eshopper/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex px-4 py-8 min-h-svh items-center justify-center">
      <div className="flex items-center gap-2 flex-col justify-center w-full h-full">
        <h1 className="font-semibold text-2xl">
          You are currently on the seller website
        </h1>
        <Card className="max-w-md border-2 w-full">{children}</Card>
      </div>
    </div>
  );
}

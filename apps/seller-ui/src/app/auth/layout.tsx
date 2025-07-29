import { Card, ModeToggle } from '@eshopper/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex relative w-full px-4 py-8 min-h-svh items-center justify-center">
      <div className="absolute right-2 top-2 sm:top-8 sm:left-8">
        <ModeToggle />
      </div>
      <div className="flex pt-8 sm:pt-0 items-center gap-2 flex-col justify-center w-full h-full">
        <Card className="max-w-md border-2 w-full">{children}</Card>
        <h1 className="font-semibold text-center">
          You are currently on the seller website
        </h1>
      </div>
    </div>
  );
}

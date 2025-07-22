import {
  DialogContent,
  DialogDescription,
  DialogTitle,
  ScrollArea,
} from '@eshopper/ui';

export function OpeningHoursDialog({
  children,
  shopName,
}: {
  children: React.ReactNode;
  shopName?: string;
}) {
  const title = shopName
    ? `Edit ${shopName}'s working hours`
    : 'Edit your shop working hours';
  return (
    <DialogContent className="w-[90%] max-w-md">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        Check the day to mark it as a working day, uncheck it to mark it as a
        holiday
      </DialogDescription>
      <ScrollArea className="h-72 w-full">{children}</ScrollArea>
    </DialogContent>
  );
}

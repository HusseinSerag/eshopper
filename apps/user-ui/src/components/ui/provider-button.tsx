import { Button, cn } from '@eshopper/ui';

interface ProviderButtonInterface {
  text: string;
  onClick(): void;
  icon: React.ReactNode;
  className?: string;
  disabled: boolean;
}

export function ProviderButton({
  icon,
  onClick,
  text,
  className,
  disabled,
}: ProviderButtonInterface) {
  return (
    <Button
      type="button"
      className="w-full bg-secondary text-foreground hover:text-muted"
      onClick={onClick}
      disabled={disabled}
    >
      <div
        className={cn(
          'w-full justify-center flex gap-2 items-center',
          className
        )}
      >
        <span>{text}</span>
        <span>{icon}</span>
      </div>
    </Button>
  );
}

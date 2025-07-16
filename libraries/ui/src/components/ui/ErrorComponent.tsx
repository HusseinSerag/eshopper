import { Card } from './card';

interface ErrorComponentProps {
  message: string;
  description: string;
}
export function ErrorComponent({ message, description }: ErrorComponentProps) {
  return (
    <Card className="px-2 py-4 w-[90%] max-w-md">
      <div className="flex items-center flex-col justify-center">
        <div className="text-5xl mb-4">⛔</div>
        <h2 className="text-2xl  text-center font-bold mb-2">{message}</h2>
      </div>
      <h2 className="text-muted-foreground">{description}</h2>
    </Card>
  );
}

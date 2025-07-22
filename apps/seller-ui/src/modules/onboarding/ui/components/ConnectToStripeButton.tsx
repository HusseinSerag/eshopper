import { Button } from '@eshopper/ui';
import { FaStripeS } from 'react-icons/fa';

export function ConnectToStripeButton() {
  return (
    <Button className="bg-purple-900 hover:bg-purple-600">
      <FaStripeS className="!size-4" />
      Connect to Stripe
    </Button>
  );
}

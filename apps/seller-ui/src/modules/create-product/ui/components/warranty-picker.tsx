import {
  Checkbox,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eshopper/ui';
import { useState } from 'react';

type WarrantyUnit = 'days' | 'weeks' | 'months' | 'years';

interface WarrantyValue {
  hasWarranty: boolean;
  amount: number | null;
  unit: WarrantyUnit | null;
  lifetime: boolean;
}

interface WarrantyInputProps {
  value: WarrantyValue;
  onChange: (value: WarrantyValue) => void;
  className?: string;
  disabled?: boolean;
}

const warrantyUnits: Array<{
  value: WarrantyUnit;
  label: string;
  plural: string;
}> = [
  { value: 'days', label: 'Day', plural: 'Days' },
  { value: 'weeks', label: 'Week', plural: 'Weeks' },
  { value: 'months', label: 'Month', plural: 'Months' },
  { value: 'years', label: 'Year', plural: 'Years' },
];

const WarrantyInput = ({
  value,
  onChange,
  className = '',
  disabled = false,
}: WarrantyInputProps) => {
  // Internal state - always maintains values even when disabled
  const [internalAmount, setInternalAmount] = useState(value.amount || 1);
  const [internalUnit, setInternalUnit] = useState<WarrantyUnit>(
    value.unit || 'years'
  );

  const handleHasWarrantyChange = () => {
    const newHasWarranty = !value.hasWarranty;

    if (newHasWarranty) {
      // Enable warranty - use internal state values
      onChange({
        hasWarranty: true,
        amount: internalAmount,
        unit: internalUnit,
        lifetime: false,
      });
    } else {
      // Disable warranty - set form values to null but keep internal state
      onChange({
        hasWarranty: false,
        amount: null,
        unit: null,
        lifetime: false,
      });
    }
  };

  const handleLifetimeChange = () => {
    const newLifetime = !value.lifetime;

    onChange({
      ...value,
      lifetime: newLifetime,
      amount: newLifetime ? null : internalAmount,
      unit: newLifetime ? null : internalUnit,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseInt(e.target.value) || 1;
    if (newAmount >= 1) {
      setInternalAmount(newAmount);

      // Update form value if warranty is active and not lifetime
      if (value.hasWarranty && !value.lifetime) {
        onChange({
          ...value,
          amount: newAmount,
        });
      }
    }
  };

  const handleUnitChange = (newUnit: WarrantyUnit) => {
    setInternalUnit(newUnit);

    // Update form value if warranty is active and not lifetime
    if (value.hasWarranty && !value.lifetime) {
      onChange({
        ...value,
        unit: newUnit,
      });
    }
  };

  const getUnitLabel = (unit: WarrantyUnit, amount: number) => {
    const unitConfig = warrantyUnits.find((u) => u.value === unit);
    if (!unitConfig) return unit;
    return amount === 1 ? unitConfig.label : unitConfig.plural;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-warranty"
          checked={value.hasWarranty}
          onCheckedChange={handleHasWarrantyChange}
          disabled={disabled}
        />
        <Label
          htmlFor="has-warranty"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          This product has a warranty
        </Label>
      </div>

      {value.hasWarranty && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="lifetime-warranty"
            checked={value.lifetime}
            onCheckedChange={handleLifetimeChange}
            disabled={disabled}
          />
          <Label
            htmlFor="lifetime-warranty"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Lifetime warranty
          </Label>
        </div>
      )}

      {value.hasWarranty && !value.lifetime && (
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              type="number"
              value={internalAmount}
              onChange={handleAmountChange}
              min="1"
              placeholder="Amount"
              disabled={disabled || !value.hasWarranty || value.lifetime}
              className="w-full"
            />
          </div>

          <div className="flex-1">
            <Select
              value={internalUnit}
              onValueChange={handleUnitChange}
              disabled={disabled || !value.hasWarranty || value.lifetime}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warrantyUnits.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {getUnitLabel(unit.value, internalAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {value.hasWarranty && !value.lifetime && value.amount && value.unit && (
        <div className="text-sm text-muted-foreground">
          Warranty period: {value.amount}{' '}
          {getUnitLabel(value.unit, value.amount)}
        </div>
      )}

      {value.hasWarranty && value.lifetime && (
        <div className="text-sm text-muted-foreground">Lifetime warranty</div>
      )}
    </div>
  );
};

export { WarrantyInput };
export type { WarrantyInputProps, WarrantyUnit, WarrantyValue };

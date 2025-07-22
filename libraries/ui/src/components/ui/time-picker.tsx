'use client';

import { ComponentPropsWithoutRef } from 'react';
import { Input } from './input';
import { Label } from './label';

interface Props extends ComponentPropsWithoutRef<'input'> {}
export function TimePicker({ ...rest }: Props) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          <Input
            {...rest}
            type="time"
            id="time-picker"
            step="1"
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </Label>
      </div>
    </div>
  );
}

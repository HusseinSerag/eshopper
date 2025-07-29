'use client';

import { forwardRef, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { Button, ButtonProps } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { cn } from '../../lib/utils';
import { useForwardedRef } from '../../hooks/useForwardedRef';
import { PlusIcon } from 'lucide-react';

interface ColorPickerProps {
  onChange(val: string): void;
  onBlur?: () => void;
  valueChange: 'drag' | 'button';
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> &
    ColorPickerProps &
    ButtonProps
>(
  (
    {
      disabled,

      onBlur,
      name,
      onChange,
      className,
      size,
      ...props
    },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);
    const [internalState, setInternalState] = useState('');

    const parsedValue = useMemo(() => {
      return internalState || '#FFFFFF';
    }, [internalState]);

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <PlusIcon className="w-5 h-5 text-gray-600" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-full">
          <HexColorPicker
            color={parsedValue}
            onChange={(value) => {
              setInternalState(value);
              if (props.valueChange === 'drag') onChange(value);
            }}
          />
          <Input
            maxLength={7}
            onChange={(e) => {
              setInternalState(e.currentTarget.value);
            }}
            ref={ref}
            value={parsedValue}
          />
          {props.valueChange === 'button' && (
            <Button
              onClick={() => {
                onChange(internalState);
              }}
            >
              Choose
            </Button>
          )}
        </PopoverContent>
      </Popover>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };

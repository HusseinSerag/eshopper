import { daysOfTheWeek, OpeningHours } from '@eshopper/shared-types';
import { Checkbox, cn, FormControl, Separator, TimePicker } from '@eshopper/ui';
import { useState } from 'react';

import * as React from 'react';

interface Props {
  value: OpeningHours[];
  onChange: (value: OpeningHours[]) => void;
  name: string;
  onBlur?: () => void;
  disabled?: boolean;
  errors?: Array<{ message: string; close: string; open: string }>;
}

export function SelectOpeningHours({ errors, ...props }: Props) {
  return (
    <div className="grid gap-y-2">
      {daysOfTheWeek.map((day, index) => {
        return (
          <React.Fragment key={day}>
            <DayChoice error={errors?.[index]} day={day} {...props} />
            {index < daysOfTheWeek.length - 1 && (
              <Separator orientation="horizontal" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface DayChoiceProps {
  day: OpeningHours['day'];
  onChange: (value: OpeningHours[]) => void;
  value: OpeningHours[];
  name: string;
  onBlur?: () => void;
  disabled?: boolean;
  error?: { close: string; open: string; message: string };
}
function DayChoice({ day, onChange, value, error, ...props }: DayChoiceProps) {
  const [activated, setActivated] = useState(() =>
    day === 'Sunday' || day === 'Saturday' ? false : true
  );
  const currentDayValue = value.find((item) => item.day === day);
  const [openTime, setOpenTime] = useState(currentDayValue?.open || '');
  const [closeTime, setCloseTime] = useState(currentDayValue?.close || '');

  const onPickerChange = (newValue: string, timing: 'open' | 'close') => {
    if (timing === 'open') {
      setOpenTime(newValue);
    } else {
      setCloseTime(newValue);
    }
    const values = value.map((value) =>
      value.day === day
        ? {
            ...value,
            ...(timing === 'open'
              ? {
                  open: newValue,
                  close: value.close,
                }
              : {
                  close: newValue,
                  open: value.open,
                }),
          }
        : value
    );
    onChange(values);
  };

  const onCheckChange = () => {
    const newState = !activated;
    let values: OpeningHours[];
    if (newState) {
      values = value.map((value) =>
        value.day === day
          ? {
              ...value,
              open: openTime.length > 0 ? openTime : null,
              close: closeTime.length > 0 ? closeTime : null,
            }
          : value
      );
    } else {
      values = value.map((value) =>
        value.day === day
          ? {
              ...value,
              open: null,
              close: null,
            }
          : value
      );
    }
    onChange(values);
    setActivated(newState);
  };
  return (
    <div className="grid items-center gap-y-2" key={day}>
      <div className="flex flex-col  sm:grid sm:items-center sm:grid-cols-3 gap-2">
        <div className="flex gap-2 items-center">
          <Checkbox checked={activated} onCheckedChange={onCheckChange} />
          <h2 className="font-semibold text-sm">{day}</h2>
        </div>

        <div className="col-span-2 flex-wrap flex-row flex sm:items-center gap-2">
          <div className="flex flex-col gap-y-2">
            <div
              className={cn(
                'sm:hidden block text-sm',
                !activated && 'opacity-50'
              )}
            >
              Opening
            </div>
            <FormControl>
              <TimePicker
                onChange={(e) => onPickerChange(e.target.value, 'open')}
                {...props}
                value={openTime}
                name={`${props.name}.${day}.open`}
                disabled={!activated || props.disabled}
              />
            </FormControl>
          </div>
          <div className="flex flex-col gap-y-2">
            <div
              className={cn(
                'sm:hidden block text-sm',
                !activated && 'opacity-50'
              )}
            >
              Closing
            </div>
            <FormControl>
              <TimePicker
                onChange={(e) => onPickerChange(e.target.value, 'close')}
                {...props}
                value={closeTime}
                disabled={!activated || props.disabled}
                name={`${props.name}.${day}.close`}
              />
            </FormControl>
          </div>
        </div>
      </div>
      <div className="text-sm flex flex-col gap-y-2 font-semibold text-red-600">
        {error?.close && <div>Closing time: {error?.close}</div>}
        {error?.open && <div>Opening time: {error?.open}</div>}
        <div>{error?.message}</div>
      </div>
    </div>
  );
}

import { OpeningHours } from '@eshopper/shared-types';
import { parse, format } from 'date-fns';
import * as React from 'react';
interface Props {
  openingHours: OpeningHours[];
}
export function OpeningHoursSummary({ openingHours }: Props) {
  return (
    <div className="grid grid-cols-[1fr_3fr] gap-y-1 gap-x-4">
      {openingHours.map((value) => {
        const isOff = !value.open && !value.close;
        let formattedOpen = '',
          formattedClose = '';
        if (value.open) {
          const openTime = parse(value.open, 'HH:mm:ss', new Date());
          formattedOpen = format(openTime, 'HH:mm');
        }
        if (value.close) {
          const closeTime = parse(value.close || '', 'HH:mm:ss', new Date());

          formattedClose = format(closeTime, 'HH:mm');
        }

        return (
          <React.Fragment key={value.day}>
            <h2 className="font-medium">{value.day.slice(0, 3)}</h2>
            {isOff ? (
              <div className="">Closed</div>
            ) : (
              <div>
                <span>{formattedOpen}</span>
                <span>-</span>
                <span>{formattedClose}</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

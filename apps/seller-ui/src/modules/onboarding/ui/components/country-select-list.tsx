import { countriesList } from '@eshopper/shared-types';
import Image from 'next/image';
import { FixedSizeList as List } from 'react-window';

const ROW_HEIGHT = 40;

export const CountrySelectList = ({
  onSelect,
}: {
  onSelect: (value: string) => void;
}) => {
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const country = countriesList[index];
    return (
      <div
        style={style}
        onClick={() => {
          onSelect(country.code);
        }}
        className="cursor-pointer flex gap-2 items-center px-2 py-1 hover:bg-muted"
      >
        <Image
          src={country.flag}
          alt={country.name || country.code}
          width={24}
          height={18}
          loading="lazy"
        />
        <span>{country.name}</span>
      </div>
    );
  };

  return (
    <div style={{ height: 300 }}>
      <List
        height={300}
        itemCount={countriesList.length}
        itemSize={ROW_HEIGHT}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};

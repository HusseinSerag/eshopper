import { IFile } from '../../types';
import { useState } from 'react';
import { Edit2, Trash2Icon } from 'lucide-react';
import { Checkbox, SortableList } from '@eshopper/ui';

interface Props {
  file: IFile;
  onRemove(removedFileId: string): void;
  select: {
    onSelect(id: string): void;
    deSelect(id: string): void;
    selectOpen: boolean;
    isSelected: boolean;
  };
}

export function SingleImageEdit({ file, onRemove, select }: Props) {
  const src = URL.createObjectURL(file.file);
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {select.selectOpen && (
        <div className="absolute  z-[40] flex items-center justify-center p-2 -right-1 top-0">
          <Checkbox
            checked={select.isSelected}
            onCheckedChange={() => {
              if (!select.isSelected) {
                select.onSelect(file.id);
              } else {
                select.deSelect(file.id);
              }
            }}
          />
        </div>
      )}
      {hover && (
        <div className="absolute bg-white z-[40] flex items-center justify-center w-5 h-5 rounded-full p-2 -left-1 top-0">
          <SortableList.DragHandle />
        </div>
      )}
      <div className="flex items-center justify-center">
        <div
          className={`
          relative transition-all duration-200 ease-out`}
        >
          {/* Overlay */}
          <div
            className={`
            absolute z-[1] inset-0 bg-black/20 backdrop-blur-[2px] rounded-lg 
            transition-opacity duration-200
            ${hover ? 'opacity-100' : 'opacity-0'}
            `}
          />

          {/* Action Buttons */}
          <div
            className={`
            absolute flex items-center justify-center inset-0 z-10
            transition-all duration-200
            ${hover ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          >
            <div className="bg-black/80 flex gap-2 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Edit2 className="cursor-pointer w-4 h-4 hover:text-blue-300 transition-colors" />
              <Trash2Icon
                onClick={(e) => {
                  e.stopPropagation();
                  if (select.isSelected) select.deSelect(file.id);
                  onRemove(file.id);
                }}
                className="cursor-pointer w-4 h-4 hover:text-red-300 transition-colors"
              />
            </div>
          </div>

          {/* Image */}
          <img
            className={`
            object-cover rounded-lg w-40 h-40 transition-all duration-200
            
            `}
            src={src}
            alt={`Product image ${file.id}`}
          />
        </div>
      </div>
    </div>
  );
}

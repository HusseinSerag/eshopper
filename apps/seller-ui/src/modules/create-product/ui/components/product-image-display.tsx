import { DialogTrigger } from '@eshopper/ui';
import { IFile } from '../../types';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

interface ProductImageDisplayProps {
  file: IFile;
  total: number;
  index: number;
}

export function ProductImageDisplay({
  file,
  index,
  total,
}: ProductImageDisplayProps) {
  const [hover, setHover] = useState(false);

  return (
    <>
      <DialogTrigger asChild>
        <div className="absolute cursor-pointer z-20 top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 group">
          <Pencil className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
        </div>
      </DialogTrigger>
      <div
        onMouseLeave={() => {
          setHover(false);
        }}
        className="w-full relative h-full"
        onMouseEnter={() => {
          setHover(true);
        }}
      >
        {hover && (
          <div className="absolute z-[1] inset-0 bg-black/20 backdrop-blur-[2px] rounded-lg"></div>
        )}
        {hover && (
          <div className="absolute flex items-center justify-center inset-0 z-10">
            <div className="bg-black/80 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium">
                {index + 1} <span className="text-white/60">of</span> {total}
              </span>
            </div>
          </div>
        )}

        <img
          src={URL.createObjectURL(file.file)}
          className="w-full h-full object-contain rounded-lg"
          alt={`Product image ${file.id}`}
        />
      </div>
    </>
  );
}

'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Input } from './input';
import { toast } from 'sonner';

interface ImagePlaceholderProps {
  defaultValue?: string | null;
  className?: React.CSSProperties;
  checkFileType?: (file: File) => boolean;
  onChange(file: File | null): void;
}
/**
 * Component for display images and editing them
 */
const validImageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
];
const typeNames = validImageTypes.map((type) => type.split('/')[1]);
function isValidImageFile(file: File) {
  return validImageTypes.includes(file.type);
}
export function ImagePlaceholder({
  className,
  defaultValue,
  checkFileType = isValidImageFile,
  onChange,
}: ImagePlaceholderProps) {
  // enter default or image
  const [image, setImage] = useState<File>();
  const [imageString, setImageString] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="border flex items-center justify-center block rounded-xl w-[400px] h-[400px]">
        {image && <img className="w-full h-full" src={imageString} />}
        {!image && <h1>Please choose an Image</h1>}

        <Input
          className="hidden"
          type="file"
          ref={ref}
          // accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
              const file = e.target.files[0];
              if (checkFileType(e.target.files[0])) {
                setImageString(URL.createObjectURL(e.target.files[0]));
                setImage(e.target.files[0]);
                onChange(file);
              } else {
                const inputType = file.type.split('/')[1];
                toast.error(
                  `Your input file is in a wrong format ${inputType}, please enter one of these formats: ${typeNames.join(
                    ', '
                  )}`,
                  {
                    closeButton: true,
                    duration: Infinity,
                  }
                );
              }
            }
          }}
        />
      </label>

      {image && (
        <div
          onClick={() => {
            setImage(undefined);
            setImageString('');
            if (ref.current?.value) ref.current.value = '';
            onChange(null);
          }}
        >
          {' '}
          remove
        </div>
      )}
    </div>
  );
}

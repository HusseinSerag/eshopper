'use client';
import { Button, Dialog, DialogTrigger, Input } from '@eshopper/ui';
import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination, Scrollbar } from 'swiper/modules';
import { Pencil, Plus } from 'lucide-react';
import { IFile } from '../../types';
import { ProductImageDisplay } from './product-image-display';
import { ImageEditing } from './ImageEditing';

interface Props {
  onChange(value: { order: number; file: File }[]): void;
  value: { order: number; file: File }[];
}
export function ProductImages({ onChange, value }: Props) {
  const [files, setFiles] = useState<IFile[]>(
    value.map((val) => ({
      file: val.file,
      id: crypto.randomUUID(),
    }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file, index) => ({
        file,
        id: crypto.randomUUID(),
      }));
      const mutatedFile = [...files, ...newFiles];
      setFiles(mutatedFile);
      onChange(
        mutatedFile.map((file, index) => ({
          file: file.file,
          order: index + 1,
        }))
      );
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  function onRemove(removeIdString: string) {
    const newFiles = files.filter((file) => file.id != removeIdString);
    setFiles(newFiles);

    onChange(
      newFiles.map((file, fileIndex) => ({
        file: file.file,
        order: fileIndex + 1,
      }))
    );
    if (files.length - 1 === 0) setOpen(false);
  }

  function onRemoveMultiple(ids: string[]) {
    const newFiles = files.filter((file) => !ids.includes(file.id));
    setFiles(newFiles);
    onChange(
      newFiles.map((file, fileIndex) => ({
        file: file.file,
        order: fileIndex + 1,
      }))
    );
    if (files.length - 1 === 0) setOpen(false);
  }
  function setFile(files: IFile[]) {
    setFiles(files);
  }
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <ImageEditing
          onRemoveMultiple={onRemoveMultiple}
          onDialogOpen={setOpen}
          onChange={onChange}
          setFile={setFile}
          onRemove={onRemove}
          files={files}
        />

        <div className="flex flex-col gap-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <Swiper
            className="!grid relative !m-0 border w-full h-[250px]  sm:h-[300px] rounded-lg"
            modules={[Navigation, Pagination, Scrollbar, A11y]}
            spaceBetween={16}
            slidesPerView={1}
            navigation
            observer
            observeParents
            pagination={{ clickable: true }}
            scrollbar={{ draggable: true }}
            wrapperClass="!min-w-0  !w-full !h-[250px] ! !sm:h-[300px]"
          >
            {files.map((file, index) => (
              <SwiperSlide className="w-full  " key={file.id}>
                <ProductImageDisplay
                  file={file}
                  index={index}
                  total={files.length}
                />
              </SwiperSlide>
            ))}

            <SwiperSlide className="full  h-[250px]  sm:h-[300px]">
              <div
                onClick={triggerFileInput}
                className="full  h-[250px]  sm:h-[300px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Plus className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-500 text-sm font-medium">
                  Add Images
                </span>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </Dialog>
    </>
  );
}

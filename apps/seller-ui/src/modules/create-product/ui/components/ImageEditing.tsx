import {
  Button,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  SortableList,
  SortableWrapper,
  useSelectItems,
} from '@eshopper/ui';
import { IFile } from '../../types';
import { SingleImageEdit } from './single-image-edit';
import { CheckSquare, EllipsisVertical, Square, Trash2 } from 'lucide-react';

interface Props {
  files: IFile[];
  onRemove(removedFileId: string): void;
  setFile(files: IFile[]): void;
  onChange(files: { file: File; order: number }[]): void;
  onRemoveMultiple(ids: string[]): void;
  onDialogOpen(open: boolean): void;
}

export function ImageEditing({
  files,
  onChange,
  onRemove,
  onDialogOpen,
  onRemoveMultiple,
  setFile,
}: Props) {
  const {
    toggleSelect,
    selected,
    selectOpen,
    onSelect,
    deSelect,
    deSelectAll,
    selectAll,
    deSelectMultiple,
  } = useSelectItems();

  function mutateFiles(files: IFile[]) {
    setFile(files);
    onChange(
      files.map((file, index) => ({
        file: file.file,
        order: index + 1,
      }))
    );
  }
  return (
    <SortableWrapper
      items={files}
      onChange={mutateFiles}
      renderItem={(item) => (
        <SortableList.Item id={item.id}>
          <SingleImageEdit
            select={{
              selectOpen,
              onSelect,
              deSelect,
              isSelected: !!selected.find((s) => s === item.id),
            }}
            file={item}
            onRemove={onRemove}
          />
        </SortableList.Item>
      )}
    >
      <DialogContent className="w-[90%] max-w-md">
        <DialogHeader className="flex pt-1 flex-row justify-between">
          <div className="flex flex-col gap-1">
            <DialogTitle>Edit your images</DialogTitle>
            <DialogDescription>
              Reorder, Edit, Delete your images
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => toggleSelect(!selectOpen)}
              variant={'link'}
              type="button"
              className={`${selectOpen ? 'underline' : ''} p-0`}
            >
              Delete Selected {selectOpen ? '(' + selected.length + ')' : ''}
            </Button>
            {selectOpen && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <EllipsisVertical className="h-4 w-4 text-gray-600" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="space-y-1">
                    <button
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => {
                        /* handle select all */
                        selectAll(files.map((file) => file.id));
                      }}
                    >
                      <CheckSquare className="h-4 w-4 mr-3 text-gray-500" />
                      Select All
                    </button>

                    <button
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => {
                        /* handle deselect all */
                        deSelectAll();
                      }}
                    >
                      <Square className="h-4 w-4 mr-3 text-gray-500" />
                      Deselect All
                    </button>

                    <hr className="my-1 border-gray-200" />

                    <button
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      onClick={() => {
                        const currSelected = [...selected];
                        onRemoveMultiple(currSelected);
                        deSelectMultiple(currSelected);

                        if (currSelected.length === files.length) {
                          toggleSelect(false);
                          onDialogOpen(false);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Selected
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-96 pt-4">
          <SortableList
            items={files}
            onChange={mutateFiles}
            renderItem={(item) => (
              <SortableList.Item id={item.id}>
                <SingleImageEdit
                  select={{
                    selectOpen,
                    onSelect,
                    deSelect,
                    isSelected: !!selected.find((s) => s === item.id),
                  }}
                  file={item}
                  onRemove={onRemove}
                />
              </SortableList.Item>
            )}
          />
        </ScrollArea>
      </DialogContent>
    </SortableWrapper>
  );
}

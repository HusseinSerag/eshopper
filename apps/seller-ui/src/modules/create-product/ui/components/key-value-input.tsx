import {
  Button,
  Input,
  SortableItem,
  SortableList,
  SortableWrapper,
} from '@eshopper/ui';
import { Plus, Trash } from 'lucide-react';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';

interface Props {
  onChange(value: { key: string; value: string; order: number }[]): void;
  placeholderKey?: string;
  placeholderValue?: string;
  defaultValue: { key: string; value: string; order: number }[];
}

export function KeyValueInput({
  onChange,
  placeholderKey,
  placeholderValue,
  defaultValue,
}: Props) {
  const [value, setValue] = useState<
    { key: string; value: string; id: string }[]
  >(() =>
    defaultValue.map((v) => ({
      key: v.key,
      value: v.value,
      id: crypto.randomUUID(),
    }))
  );
  const [newVal, setNewVal] = useState<{ key: string; value: string }>({
    key: '',
    value: '',
  });

  // Use useCallback to memoize the transformation and avoid infinite loops
  const transformedValue = useMemo(
    () =>
      value.map((item, i) => ({
        key: item.key,
        order: i + 1,
        value: item.value,
      })),
    [value]
  );

  // Single useEffect to handle all onChange calls
  useEffect(() => {
    onChange(transformedValue);
  }, [transformedValue]); // Remove onChange from dependencies

  function removeDuplicatesByKey(
    items: { key: string; value: string; id: string }[]
  ) {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.key)) {
        return false; // Skip duplicate key
      }
      seen.add(item.key);
      return true;
    });
  }

  function insertValues(values: { key: string; value: string; id: string }[]) {
    const newArray = removeDuplicatesByKey([...value, ...values]);
    if (newArray.length === value.length) return;
    setValue(newArray);
  }

  const inputRef = useRef<HTMLDivElement>(null);

  function insertNewValue() {
    if (newVal.key && newVal.value) {
      const newArray = removeDuplicatesByKey([
        ...value,
        {
          id: crypto.randomUUID(),
          key: newVal.key,
          value: newVal.value,
        },
      ]);

      if (newArray.length !== value.length) {
        setValue(newArray);
        setNewVal({
          key: '',
          value: '',
        });
      }
    }
  }

  function handlePaste(
    e: React.ClipboardEvent<HTMLDivElement | HTMLInputElement>
  ) {
    const pastedText = e.clipboardData.getData('text');

    if (!pastedText.trim()) return;

    // Clear the focused input and update state
    if (e.target instanceof HTMLInputElement) {
      e.target.value = '';

      // Update React state based on which input was cleared
      const inputName = e.target.getAttribute('data-input');
      if (inputName === 'new-key') {
        setNewVal((prev) => ({ ...prev, key: '' }));
      } else if (inputName === 'new-value') {
        setNewVal((prev) => ({ ...prev, value: '' }));
      } else if (inputName?.startsWith('key-')) {
        const id = inputName.replace('key-', '');
        setValue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, key: '' } : item))
        );
      } else if (inputName?.startsWith('value-')) {
        const id = inputName.replace('value-', '');
        setValue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, value: '' } : item))
        );
      }
    }

    try {
      const data = JSON.parse(pastedText);
      const newKVs = Object.entries(data).map((entry) => ({
        key: entry[0],
        value:
          typeof entry[1] === 'string' ? entry[1] : JSON.stringify(entry[1]),
        id: crypto.randomUUID(),
      }));
      insertValues(newKVs);
    } catch (error) {
      // Parse as simple text format
      const lines = pastedText.trim().split('\n');
      const newKVs = lines
        .map((line) => {
          if (!line.trim()) return null;

          // Try different formats: "key: value", "key = value", "key,value", "key	value"
          let key = '';
          let val = '';

          if (line.includes(':')) {
            const [k, ...rest] = line.split(':');
            key = k.trim();
            val = rest.join(':').trim();
          } else if (line.includes('=')) {
            const [k, ...rest] = line.split('=');
            key = k.trim();
            val = rest.join('=').trim();
          } else if (line.includes(',')) {
            const [k, v] = line.split(',');
            key = k.trim();
            val = v?.trim() || '';
          } else if (line.includes('\t')) {
            const [k, v] = line.split('\t');
            key = k.trim();
            val = v?.trim() || '';
          }

          return key && val
            ? {
                key,
                value: val,
                id: crypto.randomUUID(),
              }
            : null;
        })
        .filter(Boolean) as { key: string; value: string; id: string }[];

      if (newKVs.length > 0) {
        insertValues(newKVs);
      }
    }
    e.preventDefault();
  }

  return (
    <div onPaste={handlePaste}>
      <SortableWrapper
        onChange={setValue} // Simply pass setValue directly
        items={value}
        renderItem={(val) => (
          <SortableItem id={val.id}>
            <div className="flex items-center gap-2">
              <Input
                data-input={`key-${val.id}`}
                value={val.key}
                onChange={(e) => {
                  setValue((prev) =>
                    prev.map((item) =>
                      item.id === val.id
                        ? { ...item, key: e.target.value }
                        : item
                    )
                  );
                }}
              />
              <Input
                data-input={`value-${val.id}`}
                onChange={(e) => {
                  setValue((prev) =>
                    prev.map((item) =>
                      item.id === val.id
                        ? { ...item, value: e.target.value }
                        : item
                    )
                  );
                }}
                value={val.value}
              />
              <Trash
                className="size-4 shrink-0 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setValue((prev) => prev.filter((v) => v.id !== val.id));
                }}
              />
              <div className="shrink-0 cursor-pointer">
                <SortableList.DragHandle />
              </div>
            </div>
          </SortableItem>
        )}
      >
        <SortableList
          onChange={setValue} // Simply pass setValue directly
          items={value}
          renderItem={(val) => (
            <SortableItem id={val.id}>
              <div className="flex items-center gap-2">
                <Input
                  data-input={`key-${val.id}`}
                  value={val.key}
                  onChange={(e) => {
                    setValue((prev) =>
                      prev.map((item) =>
                        item.id === val.id
                          ? { ...item, key: e.target.value }
                          : item
                      )
                    );
                  }}
                />
                <Input
                  data-input={`value-${val.id}`}
                  onChange={(e) => {
                    setValue((prev) =>
                      prev.map((item) =>
                        item.id === val.id
                          ? { ...item, value: e.target.value }
                          : item
                      )
                    );
                  }}
                  value={val.value}
                />
                <Trash
                  className="size-4 shrink-0 cursor-pointer hover:text-red-500"
                  onClick={() => {
                    setValue((prev) => prev.filter((v) => v.id !== val.id));
                  }}
                />
                <div className="shrink-0 cursor-pointer">
                  <SortableList.DragHandle />
                </div>
              </div>
            </SortableItem>
          )}
        />
      </SortableWrapper>

      <div ref={inputRef} className="flex items-center mt-2 gap-2">
        <Input
          data-input="new-key"
          value={newVal.key}
          placeholder={placeholderKey}
          onChange={(e) => {
            setNewVal((val) => ({
              key: e.target.value,
              value: val.value,
            }));
          }}
        />
        <Input
          data-input="new-value"
          placeholder={placeholderValue}
          value={newVal.value}
          onChange={(e) => {
            setNewVal((val) => ({
              key: val.key,
              value: e.target.value,
            }));
          }}
        />
        <Button
          onClick={insertNewValue}
          type="button"
          size={'icon'}
          variant={'ghost'}
        >
          <Plus className="size-4 shrink-0 cursor-pointer hover:text-blue-500" />
        </Button>
      </div>
    </div>
  );
}

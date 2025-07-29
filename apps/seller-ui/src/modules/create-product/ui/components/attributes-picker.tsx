import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@eshopper/ui';
import {
  Plus,
  PlusCircleIcon,
  Shirt,
  Palette,
  Ruler,
  Package,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Attribute } from '../../types';
import { AttributeList } from './attribute-list';
import { MaximumVariantWarning } from './maximum_variants';

const predefinedAttributes = [
  {
    name: 'Size',
    icon: Ruler,
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    name: 'Color',
    icon: Palette,
    values: [],
  },
  {
    name: 'Material',
    icon: Package,
    values: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim'],
  },
  {
    name: 'Style',
    icon: Shirt,
    values: ['Casual', 'Formal', 'Sport', 'Vintage', 'Modern'],
  },
  {
    name: 'Brand',
    icon: Package,
    values: [],
  },
  {
    name: 'Weight',
    icon: Package,
    values: ['Light', 'Medium', 'Heavy'],
  },
];

export function AttributePickerComponent({
  value,
  onFormSync,
}: {
  value?: {
    name: string;
    values: {
      value: string;
      order: number;
      id?: string;
      metadata?: Record<string, string>;
    }[];
    order: number;
    id?: string;
  }[];
  onFormSync: (
    value: {
      name: string;
      values: {
        value: string;
        order: number;
        id?: string;
        metadata?: Record<string, string>;
      }[];
      order: number;
      id?: string;
    }[]
  ) => void;
}) {
  const [attributes, setAttributes] = useState<Attribute[]>(
    () =>
      (value &&
        value.map((formAttr) => ({
          id: formAttr.id ?? crypto.randomUUID(), // fallback only if needed
          name: formAttr.name,
          values: formAttr.values.map((formValue) => ({
            id: formValue.id ?? crypto.randomUUID(),
            value: formValue.value,
            metadata: formValue.metadata ?? {},
          })),
        }))) ||
      []
  );
  const [input, setInput] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Sync local state changes to form
  useEffect(() => {
    const formValue = attributes.map((attr, index) => ({
      id: attr.id,
      name: attr.name,
      order: index + 1,
      values: attr.values.map((val, valIndex) => ({
        id: val.id,
        value: val.value,
        order: valIndex + 1,
        metadata: val.metadata,
      })),
    }));

    // Only call onChange if the form value would actually be different
    if (JSON.stringify(formValue) !== JSON.stringify(value || [])) {
      onFormSync(formValue);
    }
  }, [attributes, onFormSync, value]);

  function onChange(attributes: Attribute[]) {
    setAttributes(attributes);
  }

  function addAttribute(name: string, predefinedValues: string[] = []) {
    const seen = new Set<string>();

    const attrs = [
      ...attributes,
      {
        name,
        id: crypto.randomUUID(),
        values: predefinedValues.map((value) => ({
          id: crypto.randomUUID(),
          value,
          metadata: {},
        })),
      },
    ].filter((item) => {
      if (seen.has(item.name.toLowerCase())) {
        return false; // Skip duplicate key (case insensitive)
      }
      seen.add(item.name.toLowerCase());
      return true;
    });

    if (attrs.length !== attributes.length) {
      setAttributes(attrs);
      setInput('');
      setPopoverOpen(false);
    }
  }

  function onAddAttribute() {
    const value = input.trim();
    if (value) {
      addAttribute(value);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddAttribute();
    }
  }

  function isAttributeAlreadyAdded(attributeName: string) {
    return attributes.some(
      (attr) => attr.name.toLowerCase() === attributeName.toLowerCase()
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Product Attributes
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Define attributes like size, color, material, etc.
          </p>
        </div>
        {attributes.length > 0 && (
          <span className="px-2 shrink-0 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {attributes.length} attribute{attributes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <MaximumVariantWarning />

      {/* Attributes List */}
      {attributes.length > 0 ? (
        <div className="space-y-4">
          <AttributeList attributes={attributes} setAttributes={onChange} />
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-500">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No attributes yet</p>
            <p className="text-xs mt-1">
              Add your first attribute below or choose from quick options
            </p>
          </div>
        </div>
      )}

      {/* Add New Attribute */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <label className="text-sm flex gap-2 items-center font-medium text-gray-700 mb-2">
            Add New Attribute
            <PopoverTrigger asChild>
              <button
                title="Quick attributes"
                type="button"
                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                <PlusCircleIcon className="w-4 h-4" />
              </button>
            </PopoverTrigger>
          </label>

          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter attribute name (e.g., size, color, material)"
              className="flex-1"
            />
            <Button
              onClick={onAddAttribute}
              type="button"
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {input.trim() &&
            attributes.some(
              (attr) => attr.name.toLowerCase() === input.trim().toLowerCase()
            ) && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                This attribute already exists
              </p>
            )}
        </div>

        <PopoverContent className=" p-0" align="start">
          <ScrollArea className="h-64 py-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Quick Attributes
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Choose from common product attributes
                </p>
              </div>

              <div className="grid gap-2">
                {predefinedAttributes.map((attr) => {
                  const Icon = attr.icon;
                  const isAdded = isAttributeAlreadyAdded(attr.name);

                  return (
                    <button
                      key={attr.name}
                      onClick={() =>
                        !isAdded && addAttribute(attr.name, attr.values)
                      }
                      disabled={isAdded}
                      className={`flex items-center gap-3 p-3 text-left rounded-lg border transition-colors ${
                        isAdded
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-md ${
                          isAdded ? 'bg-gray-100' : 'bg-blue-100'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isAdded ? 'text-gray-400' : 'text-blue-600'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {attr.name}
                          </span>
                          {isAdded && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              Added
                            </span>
                          )}
                        </div>
                        {attr.values.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1 break-words">
                            Includes: {attr.values.slice(0, 3).join(', ')}
                            {attr.values.length > 3 &&
                              ` +${attr.values.length - 3} more`}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Can't find what you need? Use the custom input above
                </p>
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

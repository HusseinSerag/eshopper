import {
  ColorPicker,
  getColorName,
  SortableList,
  SortableWrapper,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  ScrollBar,
} from '@eshopper/ui';

import { PlusIcon, MoreHorizontal, X } from 'lucide-react';
import { useState } from 'react';

interface Color {
  color: string;
  name: string;
}

const predefinedColors: Color[] = [
  // Basics
  { name: 'Black', color: '#000000' },
  { name: 'White', color: '#FFFFFF' },
  { name: 'Gray', color: '#808080' },

  // Primary
  { name: 'Red', color: '#FF0000' },
  { name: 'Blue', color: '#0000FF' },
  { name: 'Green', color: '#008000' },

  // Popular
  { name: 'Navy', color: '#000080' },
  { name: 'Pink', color: '#FFC0CB' },
  { name: 'Yellow', color: '#FFFF00' },
  { name: 'Orange', color: '#FFA500' },
  { name: 'Purple', color: '#800080' },
  { name: 'Brown', color: '#A52A2A' },
];

interface ColorPickerComponentProps {
  onChange(colors: (Color & { order: number })[]): void;
  value: (Color & { order: number })[];
}

export function ColorPickerComponent({
  onChange,
  value,
}: ColorPickerComponentProps) {
  const [colors, setColors] = useState<
    (Color & {
      id: string;
    })[]
  >(() =>
    value.map((color) => ({
      id: crypto.randomUUID(),
      color: color.color,
      name: color.name,
    }))
  );
  const [popoverOpen, setPopoverOpen] = useState(false);

  const MAX_VISIBLE_COLORS = 4;

  function mutateColors(
    colors: (Color & {
      id: string;
    })[]
  ) {
    onChange([
      ...colors.map((color, index) => ({
        color: color.color,
        name: color.name,
        order: index + 1,
      })),
    ]);
    setColors(colors);
  }

  function addColor(color: string) {
    color = color.toString().toUpperCase();
    const allColors = [...colors.map((c) => c.color)];
    if (allColors.includes(color)) {
      return;
    }

    const newColors = [
      ...colors,
      {
        color,
        name: getColorName(color) ?? '',
        id: crypto.randomUUID(),
      },
    ];
    let index = 0;
    onChange([
      ...colors.map((color) => ({
        color: color.color,
        name: color.name,
        order: ++index,
      })),
      {
        color: color,
        name: getColorName(color) ?? '',
        order: index,
      },
    ]);
    setColors(newColors);
  }

  function removeColor(color: string) {
    const filteredArr = colors.filter((c) => c.color !== color);
    setColors(filteredArr);
    onChange(
      filteredArr.map((color, index) => ({
        color: color.color,
        name: color.name,
        order: index + 1,
      }))
    );
  }

  return (
    <div className="space-y-3">
      {/* Predefined Colors Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Colors</h4>
        <div className="flex flex-wrap gap-2">
          {predefinedColors.map((color) => {
            const isSelected = colors.some((c) => c.color === color.color);
            return (
              <button
                key={color.color}
                onClick={() => addColor(color.color)}
                disabled={isSelected}
                className={`w-6 h-6 rounded border transition-all ${
                  isSelected
                    ? 'border-green-400 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-gray-400 cursor-pointer hover:scale-105'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ backgroundColor: color.color }}
                title={
                  isSelected ? `${color.name} (Already selected)` : color.name
                }
              />
            );
          })}
        </div>
      </div>

      {/* Selected Colors Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            Selected Colors ({colors.length})
          </h4>
          <ColorPicker
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
            valueChange="button"
            onChange={(color) => {
              if (typeof color === 'string') addColor(color);
            }}
          >
            <PlusIcon className="w-3 h-3" />
            Custom
          </ColorPicker>
        </div>

        {colors.length === 0 ? (
          <div className="text-sm text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
            No colors selected. Choose from quick colors above or add a custom
            color.
          </div>
        ) : (
          <div className="flex flex-wrap w-full justify-center items-center gap-2">
            <SortableWrapper<Color & { id: string }>
              renderItem={(item) => (
                <SortableList.Item id={item.id}>
                  <ColorChoice
                    onRemove={removeColor}
                    color={item}
                    key={item.color}
                  />
                </SortableList.Item>
              )}
              onChange={mutateColors}
              items={colors}
            >
              <SortableList
                className="flex flex-wrap gap-2"
                renderItem={(item) => (
                  <SortableList.Item id={item.id}>
                    <ColorChoice
                      onRemove={removeColor}
                      color={item}
                      key={item.color}
                    />
                  </SortableList.Item>
                )}
                onChange={mutateColors}
                items={colors.slice(0, MAX_VISIBLE_COLORS)}
              />
            </SortableWrapper>

            {/* See More Button with Popover */}
            {colors.length > MAX_VISIBLE_COLORS && (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-md flex items-center gap-1 text-xs text-gray-600 transition-colors"
                    title={`See ${
                      colors.length - MAX_VISIBLE_COLORS
                    } more colors`}
                  >
                    <MoreHorizontal className="w-3 h-3" />+
                    {colors.length - MAX_VISIBLE_COLORS}
                  </button>
                </PopoverTrigger>
                <SortableWrapper<Color & { id: string }>
                  renderItem={(item) => (
                    <SortableList.Item id={item.id}>
                      <ColorChoice
                        onRemove={removeColor}
                        color={item}
                        key={item.color}
                      />
                    </SortableList.Item>
                  )}
                  onChange={mutateColors}
                  items={colors}
                >
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">
                        All Selected Colors
                      </h4>
                      <button
                        onClick={() => setPopoverOpen(false)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex">
                      <ScrollArea className="pb-4 w-1 overflow-y-visible flex-1">
                        <div className="flex w-full pt-2 items-center gap-2">
                          <SortableList
                            asChild
                            renderItem={(item) => (
                              <SortableList.Item id={item.id}>
                                <ColorChoice
                                  onRemove={removeColor}
                                  color={item}
                                  key={item.color}
                                />
                              </SortableList.Item>
                            )}
                            onChange={mutateColors}
                            items={colors}
                          />
                          <ScrollBar
                            className="w-full"
                            orientation="horizontal"
                          />
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      {colors.length} colors selected • Drag to reorder
                    </div>
                  </PopoverContent>
                </SortableWrapper>
              </Popover>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorChoice({
  color,
  onRemove,
}: {
  color: Color;
  onRemove(color: string): void;
}) {
  return (
    <div className="group w-full relative inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
      {/* Color indicator - smaller to match text size */}
      <div
        className="w-3 h-3 rounded border border-gray-300 flex-shrink-0"
        style={{ backgroundColor: color.color }}
      />

      {/* Color name - same size as text values */}
      <span className="text-sm text-gray-700 select-none">
        {color.name || 'Custom'}
      </span>

      {/* Controls - only show on hover, same as text values */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <SortableList.DragHandle />
        </div>
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => onRemove(color.color)}
          title="Remove color"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

'use client';
import React, { createContext, useContext, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DragOverlay,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
  rectIntersection,
} from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Active } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

interface Context {
  attributes: Record<string, any>;
  listeners: DraggableSyntheticListeners;
  ref(node: HTMLElement | null): void;
}

const SortableItemContext = createContext<Context>({
  attributes: {},
  listeners: undefined,
  ref() {
    //
  },
});

export function SortableItem({
  children,
  id,
}: {
  id: UniqueIdentifier;
  children: ReactNode;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  const context = useMemo(
    () => ({
      attributes,
      listeners,
      ref: setActivatorNodeRef,
    }),
    [attributes, listeners, setActivatorNodeRef]
  );
  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SortableItemContext.Provider value={context}>
      <div className="relative" ref={setNodeRef} style={style}>
        {children}
      </div>
    </SortableItemContext.Provider>
  );
}

import { MdOutlineDragIndicator } from 'react-icons/md';
import { cn } from '../../lib/utils';
export function DragHandle({ children }: { children?: ReactNode }) {
  const { attributes, listeners, ref } = useContext(SortableItemContext);

  if (children)
    return (
      <div {...attributes} {...listeners} ref={ref}>
        {children}
      </div>
    );
  return (
    <button type="button" {...attributes} {...listeners} ref={ref}>
      <MdOutlineDragIndicator className=" text-black" />
    </button>
  );
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

export function SortableOverlay({ children }: { children: ReactNode }) {
  return (
    <DragOverlay
      dropAnimation={dropAnimationConfig}
      style={{
        transformOrigin: '0 0', // Start from top-left
      }}
    >
      <div style={{ cursor: 'grabbing' }}>
        {' '}
        {/* Add grabbing cursor */}
        {children}
      </div>
    </DragOverlay>
  );
}

interface BaseItem {
  id: UniqueIdentifier;
}

interface SortableListProps<T extends BaseItem> {
  items: T[];
  onChange(items: T[]): void;
  renderItem(item: T, index: number): ReactNode;
  className?: string;
  asChild?: boolean;
}

export function SortableWrapper<T extends BaseItem>({
  items,
  onChange,
  renderItem,
  children,
}: SortableListProps<T> & { children: ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const [activeItem, index] = useMemo(
    () => [
      items.find((item) => item.id === active?.id),
      items.findIndex((item) => item.id === active?.id),
    ],
    [active, items]
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  return (
    <DndContext
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={({ active }) => {
        setActive(active);
      }}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over?.id) {
          const activeIndex = items.findIndex(({ id }) => id === active.id);
          const overIndex = items.findIndex(({ id }) => id === over.id);

          onChange(arrayMove(items, activeIndex, overIndex));
        }
        setActive(null);
      }}
      onDragCancel={() => {
        setActive(null);
      }}
    >
      {children}
      <SortableOverlay>
        {activeItem ? renderItem(activeItem, index) : null}
      </SortableOverlay>
    </DndContext>
  );
}
export function SortableList<T extends BaseItem>({
  items,
  className,
  renderItem,
  asChild = false,
}: SortableListProps<T>) {
  if (asChild)
    return (
      <SortableContext items={items}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </SortableContext>
    );
  return (
    <SortableContext items={items}>
      <div
        className={cn(
          'flex items-center justify-center gap-4 flex-wrap',
          className
        )}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    </SortableContext>
  );
}

SortableList.Item = SortableItem;
SortableList.DragHandle = DragHandle;

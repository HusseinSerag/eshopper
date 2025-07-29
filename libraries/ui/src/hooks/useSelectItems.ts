'use client';
import { useState } from 'react';

export function useSelectItems() {
  const [selectOpen, setSelectOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  function onSelect(id: string) {
    if (selectOpen) setSelected((select) => [...select, id]);
  }
  function deSelect(id: string) {
    if (selectOpen)
      setSelected((select) => select.filter((item) => item !== id));
  }
  function selectAll(ids: string[]) {
    setSelected(Array.from(new Set(ids)));
  }
  function deSelectAll() {
    setSelected([]);
  }
  function deSelectMultiple(ids: string[]) {
    setSelected((select) => select.filter((item) => !ids.includes(item)));
  }
  function toggleSelect(open: boolean) {
    setSelectOpen(open);
  }

  return {
    selected,
    selectAll,
    deSelect,
    toggleSelect,
    deSelectAll,
    onSelect,
    selectOpen,
    deSelectMultiple,
  };
}

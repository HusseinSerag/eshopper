'use client';

import { useProductForm } from '../context/form-contex';

export function VariantsView() {
  const { form } = useProductForm();

  const variants: any[] = [];
  const items = form.getValues('attributes');
  items.forEach((value) => {});
  return <pre>{JSON.stringify(items, null, 2)}</pre>;
}

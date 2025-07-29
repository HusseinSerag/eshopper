'use client';

import * as React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import z from 'zod';
import { createProductSchema } from '../../schema/create-product.schema';
import { zodResolver } from '@hookform/resolvers/zod';

interface FormContextValue {
  form: UseFormReturn<z.infer<typeof createProductSchema>>;
  handleNext(): Promise<void>;
  handleBack(): void;
  canGoNext(): boolean;
  currentStep: number;
  isLastStep: boolean;
  isFirstStep: boolean;
}
const FormContext = React.createContext<FormContextValue>(
  {} as FormContextValue
);

export function FormContextComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [step, setStep] = React.useState(1);
  const form = useForm<z.infer<typeof createProductSchema>>({
    defaultValues: {
      productImage: [],
      name: '',
      description: '',
      tags: [],
      warranty: {
        amount: 1,
        hasWarranty: false,
        lifetime: false,
        unit: 'years',
      },
      slug: '',
      brand: '',
      //   colors: [],
      specifications: [],
      attributes: [],
    },
    resolver: zodResolver(createProductSchema),
  });

  async function handleNext() {
    let fieldsToValidate: (keyof z.infer<typeof createProductSchema>)[] = [];
    switch (step) {
      case 1:
        fieldsToValidate = [
          'name',
          'description',
          'brand',
          'slug',
          'productImage',
          'specifications',
          'tags',
          'warranty',
        ];
        break;
      case 2:
        fieldsToValidate = ['attributes'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setStep((step) => step + 1);
    }
  }
  function handleBack() {
    setStep((step) => step - 1);
  }

  function canGoNext() {
    switch (step) {
      case 1:
        return !!(form.watch('name') && form.watch('brand'));
      case 2:
        return (form.watch('attributes')?.length || 0) > 0;
      default:
        return false;
    }
  }
  const isLastStep = step === 3;
  const isFirstStep = step === 1;

  return (
    <FormContext.Provider
      value={{
        form,
        currentStep: step,
        handleNext,
        handleBack,
        canGoNext,
        isLastStep,
        isFirstStep,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useProductForm() {
  const context = React.useContext(FormContext);
  if (!context)
    throw new Error(
      'Please use useProductForm inside the FormContextComponent'
    );
  return context;
}

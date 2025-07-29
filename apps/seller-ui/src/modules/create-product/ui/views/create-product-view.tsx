'use client';

import { ProductImages } from '../components/product-images';
import z from 'zod';
import { createProductSchema } from '../../schema/create-product.schema';

import { Button, Form } from '@eshopper/ui';

import { useProductForm } from '../context/form-contex';
import { GeneralProductInfoView } from './general-product-info-view';
import { ProductAttributesView } from './attributes-view';
import { VariantsView } from './VariantsView';

export function CreateProductView() {
  const { form, currentStep, isFirstStep, isLastStep, handleBack, handleNext } =
    useProductForm();
  function onSubmit(values: z.infer<typeof createProductSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="w-full py-2 flex justify-between">
          <Button
            variant={'secondary'}
            onClick={handleBack}
            disabled={isFirstStep}
            type="button"
          >
            previous
          </Button>
          <Button
            onClick={async () => {
              return await handleNext();
            }}
            variant={'secondary'}
            disabled={isLastStep}
            type="button"
          >
            Next
          </Button>
        </div>
        {currentStep === 1 && <GeneralProductInfoView />}
        {currentStep === 2 && <ProductAttributesView />}
        {currentStep === 3 && <VariantsView />}
        <Button type="submit">create</Button>
      </form>
    </Form>
  );
}

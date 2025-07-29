import { ProductImages } from '../components/product-images';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  generateSlug,
  Input,
  MultiInputTags,
  Textarea,
} from '@eshopper/ui';
import { MAXIMUM_TAGS } from '../../constants';
import { WarrantyInput } from '../components/warranty-picker';
import { ColorPickerComponent } from '../components/color-picker';

import { KeyValueInput } from '../components/key-value-input';
import { useProductForm } from '../context/form-contex';
export function GeneralProductInfoView() {
  const { form } = useProductForm();

  return (
    <div className="py-2 pr-4 gap-x-4 gap-y-4 flex flex-wrap">
      <div className="flex-1 flex flex-col gap-y-4 shrink-0 min-w-60 max-w-96 w-full">
        <FormField
          control={form.control}
          name="productImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <FormControl>
                <ProductImages onChange={field.onChange} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Apple iPhone 16" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter product description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex-1 flex flex-col gap-y-4 min-w-52 max-w-96 w-full">
        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Specification</FormLabel>
              <FormControl>
                <KeyValueInput
                  defaultValue={field.value}
                  placeholderKey="Screen Size"
                  placeholderValue="6.1 inches"
                  onChange={(items) => {
                    field.onChange(items);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex mt-1 justify-between">
                <span>Tags</span>
                <span>
                  {field.value.length} / {MAXIMUM_TAGS}
                </span>
              </FormLabel>
              <FormControl>
                <MultiInputTags
                  maxTags={MAXIMUM_TAGS}
                  placeholder="Enter some tags for the product"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="warranty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warranty</FormLabel>
              <FormControl>
                <WarrantyInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="apple-iphone-16"
                  {...field}
                  onBlur={(e) => {
                    field.onChange(generateSlug(field.value));
                    field.onBlur();
                  }}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Brand</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Apple, Nike, Samsung" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={form.control}
          name="colors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Colors</FormLabel>
              <FormControl>
                <ColorPickerComponent
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        /> */}
      </div>
    </div>
  );
}

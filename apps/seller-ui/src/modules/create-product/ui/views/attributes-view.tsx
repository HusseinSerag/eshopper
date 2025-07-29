import { FormControl, FormField, FormItem, FormMessage } from '@eshopper/ui';
import { AttributePickerComponent } from '../components/attributes-picker';
import { useProductForm } from '../context/form-contex';

export function ProductAttributesView() {
  const { form } = useProductForm();

  return (
    <div className="">
      <FormField
        control={form.control}
        name="attributes"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <AttributePickerComponent
                onFormSync={field.onChange}
                value={field.value}
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

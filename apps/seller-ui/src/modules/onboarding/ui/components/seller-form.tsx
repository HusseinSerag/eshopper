import { useForm } from 'react-hook-form';
import z from 'zod';
import { CreateSellerSchema } from '../../schema/onboarding.schema';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Dialog,
  DialogTrigger,
  ScrollArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useCountry,
} from '@eshopper/ui';
import { SelectOpeningHours } from './select-opening-hours';
import { Category, countriesList, daysOfTheWeek } from '@eshopper/shared-types';
import { OpeningHoursSummary } from './opening-hours-summary';
import { OpeningHoursDialog } from './opening-hours-dialog';
import { useCustomQuery } from '@eshopper/client-auth/client';
import { useCreateShop } from '../../hooks/useCreateShop';
import { toast } from 'sonner';
import { CreateShop } from '../../types';
import Image from 'next/image';
import { FixedSizeList as List } from 'react-window';
const ITEM_HEIGHT = 40;

interface Props {
  defaultValues?: z.infer<typeof CreateSellerSchema>;
  onSuccess(): void;
  onNext(): void;
}
export function SellerForm({ defaultValues, onNext, ...props }: Props) {
  const { data } = useCustomQuery<{ data: Category[] }>(
    ['categories'],
    '/shop/categories'
  );
  const { countryCode } = useCountry();
  const { mutate, isPending } = useCreateShop();
  const categories = data ? data.data : [];
  const defaultOpeningHours = daysOfTheWeek.map((day) => {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    return {
      day,
      open: isWeekend ? null : '09:00:00',
      close: isWeekend ? null : '17:00:00',
    };
  });
  if (defaultValues)
    defaultValues = {
      ...defaultValues,
      country: defaultValues.country,
      shop: {
        ...defaultValues?.shop,
        category:
          categories.find(
            (category) => category.id === defaultValues?.shop.category
          )?.value || '',
      },
    };
  const form = useForm<z.infer<typeof CreateSellerSchema>>({
    defaultValues: defaultValues
      ? defaultValues
      : {
          shop: {
            opening_hours: defaultOpeningHours,
            address: '',
            bio: '',
            category: '',
            name: '',
            website: '',
            otherCategory: '',
          },
          country: countryCode ? countryCode.toLowerCase() : '',
        },
    resolver: zodResolver(CreateSellerSchema),
  });

  const shopName = form.watch('shop.name');
  const category = form.watch('shop.category');
  const country = form.watch('country').toLowerCase();
  const isEditing = !!defaultValues;
  let isLoading = isPending;
  function onSubmit(values: z.infer<typeof CreateSellerSchema>) {
    if (isLoading) return;
    const categoryId = categories.find(
      (category) => category.value === values.shop.category
    )?.id;
    if (!categoryId) {
      toast.error('Please select a valid category');
      return;
    }
    const {
      shop: { category, ...rest },
    } = values;

    const submitValues: CreateShop = {
      ...values,
      shop: {
        ...rest,
        categoryId,
      },
    };

    mutate(submitValues, {
      onSuccess() {
        toast(`Shop ${isEditing ? 'edited' : 'created'} successfully`);
        props.onSuccess();
      },
    });
  }

  let errors: { message: string; close: string; open: string }[] = [];
  for (let i = 0; i < daysOfTheWeek.length; i++) {
    const error = form.getFieldState(`shop.opening_hours.${i}`);

    errors.push({
      message: error?.error?.message || '',
      close:
        form.getFieldState(`shop.opening_hours.${i}.close`).error?.message ||
        '',

      open:
        form.getFieldState(`shop.opening_hours.${i}.open`).error?.message || '',
    });
  }

  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold mb-4">
          Step 2: {isEditing ? 'Edit' : 'Create'} your Shop
        </h2>
        <Button type="button" variant={'default'} onClick={onNext} size={'sm'}>
          next
        </Button>
      </div>
      <ScrollArea className="h-96">
        <Form {...form}>
          <form
            className="flex flex-col "
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Dialog>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="shop.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Eshopper" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          disabled={field.disabled}
                        >
                          <SelectTrigger>
                            {country ? (
                              <div className="flex items-center gap-2">
                                <Image
                                  src={
                                    countriesList.find(
                                      (c) => c.code === country
                                    )?.flag ?? ''
                                  }
                                  alt={country}
                                  width={24}
                                  height={18}
                                />
                                <span>
                                  {countriesList.find((c) => c.code === country)
                                    ?.name ?? country}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Choose a country
                              </span>
                            )}
                          </SelectTrigger>

                          <SelectContent>
                            <div style={{ height: 300 }}>
                              <List
                                height={300}
                                itemCount={countriesList.length}
                                itemSize={ITEM_HEIGHT}
                                width="100%"
                              >
                                {({ index, style }) => {
                                  const country = countriesList[index];
                                  return (
                                    <div style={style} key={country.code}>
                                      <SelectItem
                                        value={country.code}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Image
                                            src={country.flag}
                                            alt={country.name || country.code}
                                            width={24}
                                            height={18}
                                            loading="lazy"
                                          />
                                          <span>{country.name}</span>
                                        </div>
                                      </SelectItem>
                                    </div>
                                  );
                                }}
                              </List>
                            </div>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shop.bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Bio *</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shop.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="please enter your shop address..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shop.opening_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Hours</FormLabel>
                      <OpeningHoursSummary openingHours={field.value} />
                      <DialogTrigger asChild>
                        <Button size={'sm'} variant={'secondary'} type="button">
                          Edit Working Hours
                        </Button>
                      </DialogTrigger>
                      <OpeningHoursDialog shopName={shopName}>
                        <SelectOpeningHours errors={errors} {...field} />
                      </OpeningHoursDialog>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shop.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Category *</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                className="cursor-pointer"
                                value={category.value}
                                key={category.id}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {category === 'other' && (
                  <FormField
                    control={form.control}
                    name="shop.otherCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Category *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="shop.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Website *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isEditing ? 'Edit' : 'Create'}
                </Button>

                <div className="text-sm font-semibold">
                  Anything with a * is required
                </div>
              </div>
            </Dialog>
          </form>
        </Form>
      </ScrollArea>
    </>
  );
}

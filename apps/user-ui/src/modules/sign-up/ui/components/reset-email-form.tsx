import {
  Button,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@eshopper/ui';

import { useForm } from 'react-hook-form';
import { ResetPasswordSchema } from '../../schemas/reset-password.schema';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
export function ResetPasswordForm() {
  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const disabled = false;
  const router = useRouter();
  function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    console.log(values);
    if (disabled) return;
    // loginMutation.mutate(values, {
    //   onError(error) {
    //     toast.error(error.message);
    //   },
    //   onSuccess() {
    //     router.push('/');
    //   },
    // });
  }
  return (
    <DialogContent className="sm:max-w-lg rounded-lg max-w-[95%]">
      <Form {...form}>
        <form
          className="flex flex-col py-4 px-1"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Click request to request a link to change your password
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 my-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Request Password</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

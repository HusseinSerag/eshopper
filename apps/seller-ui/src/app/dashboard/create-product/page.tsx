import { FormContextComponent } from '@/modules/create-product/ui/context/form-contex';
import { CreateProductView } from '@/modules/create-product/ui/views/create-product-view';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ImagePlaceholder,
  ScrollArea,
  SidebarTrigger,
} from '@eshopper/ui';
import Link from 'next/link';

export default function CreateProductPage() {
  return (
    <ProtectedServerComponent
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      Component={async () => (
        <div className="w-full h-full grid grid-rows-[auto_1fr]">
          <div>
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-2xl py-2 font-semibold">Create Products</h2>
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={'/dashboard'}>Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create Products</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ScrollArea className="pt-1">
            <FormContextComponent>
              <CreateProductView />
            </FormContextComponent>
          </ScrollArea>
        </div>
      )}
    />
  );
}

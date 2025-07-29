import { Skeleton } from '@eshopper/ui';

export const FormSkeleton = () => {
  return (
    <div className="w-full max-w-md mx-auto rounded-lg border p-6 shadow-sm space-y-6">
      {/* Form Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" /> {/* Title */}
        <Skeleton className="h-4 w-2/3" /> {/* Subtitle/description */}
      </div>

      {/* Input Fields */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-1/4" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
        ))}

        {/* Textarea */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-1/4" /> {/* Label */}
          <Skeleton className="h-20 w-full rounded-md" /> {/* Textarea */}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[120px] rounded-md" />
      </div>
    </div>
  );
};

export const PageSkeleton = () => (
  <div className="flex justify-center w-full h-full p-10">
    <FormSkeleton />
  </div>
);

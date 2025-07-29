import { Alert, AlertTitle } from '@eshopper/ui';
import { useProductForm } from '../context/form-contex';

const MAX_VARIANTS = 100;

export function MaximumVariantWarning() {
  const { form } = useProductForm();
  const attributes = form.watch('attributes');

  const totalVariants =
    attributes.length === 0
      ? 0
      : attributes.reduce(
          (prev, curr) =>
            prev * (curr.values.length === 0 ? 1 : curr.values.length),
          1
        );

  // Calculate percentage and determine warning level
  const percentage = (totalVariants / MAX_VARIANTS) * 100;

  const getWarningConfig = () => {
    if (totalVariants === 0) {
      return {
        show: false,
        variant: undefined,
        title: '',
        message: '',
        icon: '',
        color: 'text-gray-600',
      } as const;
    }

    if (totalVariants <= 25) {
      return {
        show: true,
        variant: undefined,
        title: 'Great! Manageable variant count',
        message: `${totalVariants} variants will be created. This is easy to manage.`,
        icon: '✅',
        color: 'text-green-600',
      } as const;
    }

    if (totalVariants <= 50) {
      return {
        show: true,
        variant: undefined,
        title: 'Good variant count',
        message: `${totalVariants} variants will be created. Still manageable but getting complex.`,
        icon: 'ℹ️',
        color: 'text-blue-600',
      } as const;
    }

    if (totalVariants <= 75) {
      return {
        show: true,
        variant: undefined,
        title: 'High variant count - Consider optimization',
        message: `${totalVariants} variants will be created. This might be difficult to manage. Consider reducing attribute values or splitting into separate products.`,
        icon: '⚠️',
        color: 'text-yellow-600',
      } as const;
    }

    if (totalVariants <= MAX_VARIANTS) {
      return {
        show: true,
        variant: undefined,
        title: 'Very high variant count!',
        message: `${totalVariants} variants will be created. This will be very difficult to manage. Strongly consider splitting this into multiple products.`,
        icon: '🚨',
        color: 'text-orange-600',
      } as const;
    }

    // Over 100
    return {
      show: true,
      variant: 'destructive',
      title: 'Too many variants!',
      message: `${totalVariants} variants exceed the maximum limit of ${MAX_VARIANTS}. Please reduce attribute values to continue.`,
      icon: '🚫',
      color: 'text-red-600',
    } as const;
  };

  const config = getWarningConfig();

  if (!config.show) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Alert
        {...(config.variant && { variant: config.variant })}
        className={`border-l-4 ${
          totalVariants <= 25
            ? 'border-green-500 bg-green-50'
            : totalVariants <= 50
            ? 'border-blue-500 bg-blue-50'
            : totalVariants <= 75
            ? 'border-yellow-500 bg-yellow-50'
            : totalVariants <= MAX_VARIANTS
            ? 'border-orange-500 bg-orange-50'
            : ''
        }`}
      >
        <AlertTitle className="flex items-center gap-2 mb-2">
          <span className="text-lg">{config.icon}</span>
          <span>{config.title}</span>
          <span className={`ml-auto text-sm font-mono ${config.color}`}>
            {totalVariants}/{MAX_VARIANTS}
          </span>
        </AlertTitle>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">{config.message}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                percentage <= 25
                  ? 'bg-green-500'
                  : percentage <= 50
                  ? 'bg-blue-500'
                  : percentage <= 75
                  ? 'bg-yellow-500'
                  : percentage <= 100
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Breakdown of attributes */}
          {attributes.some((attr) => attr.values.length > 0) && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Calculation:</span>
                {attributes
                  .filter((attr) => attr.values.length > 0)
                  .map((attr, index, arr) => (
                    <span key={attr.id} className="inline-flex items-center">
                      <span className="font-mono bg-white px-1 rounded border">
                        {attr.values.length}
                      </span>
                      <span className="mx-1 text-gray-400">{attr.name}</span>
                      {index < arr.length - 1 && (
                        <span className="mx-1 text-gray-400">×</span>
                      )}
                    </span>
                  ))}
                <span className="mx-1 text-gray-400">=</span>
                <span className={`font-mono font-bold ${config.color}`}>
                  {totalVariants}
                </span>
              </div>
            </div>
          )}

          {/* Suggestions for high variant counts */}
          {totalVariants > 50 && (
            <div className="text-xs bg-blue-50 p-3 rounded border-l-2 border-blue-200">
              <div className="font-medium text-blue-800 mb-1">
                💡 Suggestions to reduce variants:
              </div>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Remove less popular attribute values</li>
                <li>
                  Split into separate products (e.g., by category, gender, or
                  type)
                </li>
                <li>Use fewer attributes per product</li>
                <li>Consider if all combinations will actually be sold</li>
              </ul>
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}

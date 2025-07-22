import { DatabaseProvider } from './index';

export const shopCategories = [
  { value: 'art', label: 'Art & Craft Supplies' },
  { value: 'music', label: 'Musical Instruments & Stores' },
  { value: 'technology', label: 'Software & Technology Services' },
  { value: 'garden', label: 'Garden & Outdoor Equipment' },
  { value: 'bakery', label: 'Bakery & Confectionery' },
  { value: 'optical', label: 'Optical & Eyewear' },
  { value: 'mobile', label: 'Mobile Phones & Accessories' },
  { value: 'real_estate', label: 'Real Estate & Property Services' },
  { value: 'fitness', label: 'Fitness & Wellness Centers' },
  { value: 'entertainment', label: 'Entertainment & Gaming' },
  { value: 'clothing', label: 'Clothing & Apparel' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'grocery', label: 'Grocery & Supermarkets' },
  { value: 'restaurant', label: 'Restaurants & Cafés' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'furniture', label: 'Furniture & Home Decor' },
  { value: 'automotive', label: 'Automotive & Accessories' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'hardware', label: 'Hardware & Tools' },
  { value: 'pet', label: 'Pet Supplies & Services' },
  { value: 'medical', label: 'Medical & Pharmacy' },
  { value: 'jewelry', label: 'Jewelry & Watches' },
  { value: 'florist', label: 'Florists & Gift Shops' },
  { value: 'baby', label: 'Baby & Kids Store' },
  { value: 'other', label: 'Other' },
];

if (!process.env.DATABASE_URL) {
  throw Error('Please set the database URL');
}
const database = new DatabaseProvider(process.env.DATABASE_URL);
database
  .connect()
  .then(() => {
    console.log('Connected to DB');
    return Promise.all(
      shopCategories.map((category) =>
        database.getPrisma().categories.create({
          data: {
            value: category.value,
            label: category.label,
          },
        })
      )
    );
  })
  .then(() => {
    console.log('Successfully created categories');
    return database.disconnect();
  })
  .then(() => {
    console.log('Successfully disconnected from DB');
  })
  .catch(console.error);

import { Category } from '@eshopper/shared-types';
import { dbProvider } from '../provider';

class CategoryMap {
  categoriesMap = new Map<string, Category>();

  async init() {
    try {
      const categories = await dbProvider.getPrisma().categories.findMany();
      for (const category of categories) {
        this.categoriesMap.set(category.id, category);
      }
    } catch {}
  }
  constructor() {
    this.init();
  }

  get(value: string) {
    return this.categoriesMap.get(value);
  }
  getAll() {
    return Array.from(this.categoriesMap.values());
  }
}
export const categoryMap = new CategoryMap();

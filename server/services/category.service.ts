/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryRepository, Category } from '../repositories/category.repository';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }

  async createCategory(categoryData: Category): Promise<Category> {
    return this.categoryRepository.save(categoryData);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const category = await this.categoryRepository.findById(id);
    if (!category) return null;

    const updated = {
      ...category,
      ...updates,
      id, // Preserve id
    };

    return this.categoryRepository.save(updated);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categoryRepository.delete(id);
  }
}

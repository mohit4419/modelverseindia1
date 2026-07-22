/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PortfolioRepository, PortfolioItem } from '../repositories/portfolio.repository';

export class PortfolioService {
  private portfolioRepository = new PortfolioRepository();

  async getAllPortfolioItems(): Promise<PortfolioItem[]> {
    return this.portfolioRepository.findAll();
  }

  async getPortfolioItemsByModel(modelId: string): Promise<PortfolioItem[]> {
    return this.portfolioRepository.findByModelId(modelId);
  }

  async getPortfolioItemById(id: string): Promise<PortfolioItem | null> {
    return this.portfolioRepository.findById(id);
  }

  async savePortfolioItem(item: PortfolioItem): Promise<PortfolioItem> {
    return this.portfolioRepository.save(item);
  }

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | null> {
    const existing = await this.portfolioRepository.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    return this.portfolioRepository.save(updated);
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    return this.portfolioRepository.delete(id);
  }
}

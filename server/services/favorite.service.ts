/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FavoriteRepository, FavoriteItem } from '../repositories/favorite.repository';

export class FavoriteService {
  private favoriteRepository = new FavoriteRepository();

  async getFavoritesByClient(clientId: string): Promise<FavoriteItem[]> {
    return this.favoriteRepository.findByClientId(clientId);
  }

  async addFavorite(clientId: string, modelId: string): Promise<FavoriteItem> {
    const id = `fav_${clientId}_${modelId}`;
    const favorite: FavoriteItem = {
      id,
      clientId,
      modelId,
      createdAt: new Date().toISOString(),
    };
    return this.favoriteRepository.save(favorite);
  }

  async removeFavorite(id: string): Promise<boolean> {
    return this.favoriteRepository.delete(id);
  }
}

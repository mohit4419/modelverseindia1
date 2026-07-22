export const favoritesApi = {
  async getFavorites(userId: string): Promise<string[]> {
    const local = localStorage.getItem(`favorites_${userId}`);
    return local ? JSON.parse(local) : [];
  },

  async toggleFavorite(userId: string, modelId: string): Promise<string[]> {
    const list = await this.getFavorites(userId);
    const index = list.indexOf(modelId);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(modelId);
    }
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(list));
    return list;
  }
};

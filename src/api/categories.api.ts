export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    // In our app, categories are static or retrieved from models, let's export a clean fetcher
    return [
      { id: '1', name: 'Fashion & High Editorial', slug: 'fashion-editorial' },
      { id: '2', name: 'Commercial & Print Ads', slug: 'commercial-print' },
      { id: '3', name: 'Runway & Haute Couture', slug: 'runway-couture' },
      { id: '4', name: 'Influencer & Digital Media', slug: 'influencer-digital' },
      { id: '5', name: 'Fitness & Swimwear', slug: 'fitness-swimwear' },
    ];
  }
};

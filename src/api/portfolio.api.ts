export interface PortfolioItem {
  id: string;
  url: string;
  title?: string;
  isCover?: boolean;
}

export const portfolioApi = {
  async uploadMedia(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/v2/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload portfolio item');
    }
    return response.json();
  }
};

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);
    return response.json();
  },

  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);
    return response.json();
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);
    return response.json();
  }
};

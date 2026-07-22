export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export const skillsApi = {
  async getSkills(): Promise<Skill[]> {
    return [
      { id: '1', name: 'Catwalk & Runway Walking' },
      { id: '2', name: 'High Fashion Posing' },
      { id: '3', name: 'Commercial Acting' },
      { id: '4', name: 'Athletic Styling & Fitness' },
      { id: '5', name: 'Makeup & Aesthetic Styling' },
    ];
  }
};

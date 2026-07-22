/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface Skill {
  id: string;
  name: string;
  categoryId?: string;
}

const LOCAL_SKILLS_FILE = path.join(process.cwd(), 'local_skills.json');

const DEFAULT_SKILLS: Skill[] = [
  { id: 'skill_ramp', name: 'Ramp Walk / Catwalk', categoryId: 'cat_runway' },
  { id: 'skill_posing', name: 'Artistic Posing', categoryId: 'cat_editorial' },
  { id: 'skill_expression', name: 'Facial Expressions', categoryId: 'cat_commercial' },
  { id: 'skill_fitness', name: 'Athletic Agility', categoryId: 'cat_fitness' },
  { id: 'skill_swimwear', name: 'Swimwear Modeling', categoryId: 'cat_runway' },
];

function getLocalSkills(): Skill[] {
  try {
    if (fs.existsSync(LOCAL_SKILLS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_SKILLS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local skills file:', e);
  }
  return DEFAULT_SKILLS;
}

function saveLocalSkills(skills: Skill[]) {
  try {
    fs.writeFileSync(LOCAL_SKILLS_FILE, JSON.stringify(skills, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local skills file:', e);
  }
}

export class SkillRepository {
  async findAll(): Promise<Skill[]> {
    let dbSkills: Skill[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('skills').select('*'),
          2500
        );
        if (!error && data) {
          dbSkills = data as Skill[];
        }
      } catch (e) {
        console.error('Supabase skills query failed, using local fallback:', e);
      }
    }

    const localSkills = getLocalSkills();
    const mergedMap = new Map<string, Skill>();
    localSkills.forEach((s) => mergedMap.set(s.id, s));
    dbSkills.forEach((s) => mergedMap.set(s.id, s));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<Skill | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('skills').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return data as Skill;
        }
      } catch (e) {
        console.error(`Supabase query for skill ${id} failed:`, e);
      }
    }

    const localSkills = getLocalSkills();
    return localSkills.find((s) => s.id === id) || null;
  }

  async save(skill: Skill): Promise<Skill> {
    const localSkills = getLocalSkills();
    const idx = localSkills.findIndex((s) => s.id === skill.id);
    if (idx >= 0) {
      localSkills[idx] = skill;
    } else {
      localSkills.push(skill);
    }
    saveLocalSkills(localSkills);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('skills').upsert(skill),
          2500
        );
        if (error) throw error;
      } catch (e: any) {
        console.warn(`Supabase upsert failed for skill ${skill.id}:`, e.message || e);
      }
    }

    return skill;
  }

  async delete(id: string): Promise<boolean> {
    const localSkills = getLocalSkills();
    const filtered = localSkills.filter((s) => s.id !== id);
    if (filtered.length !== localSkills.length) {
      saveLocalSkills(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('skills').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for skill ${id}:`, e);
      }
    }

    return filtered.length !== localSkills.length;
  }
}

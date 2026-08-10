import { Router, Request, Response } from 'express';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { evaluateTalent, parsePdfPortfolio } from '../services/gemini.service';
import { staticModels } from '../config/models';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

const router = Router();

const LOCAL_MODELS_FILE = path.join(process.cwd(), 'local_models.json');

function getLocalModels(): any[] {
  try {
    if (fs.existsSync(LOCAL_MODELS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_MODELS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local models file:', e);
  }
  return [];
}

function saveLocalModels(models: any[]) {
  try {
    fs.writeFileSync(LOCAL_MODELS_FILE, JSON.stringify(models, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local models file:', e);
  }
}

// Get all models from backend database
router.get('/models', async (req: Request, res: Response) => {
  try {
    let dbModels: any[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(supabaseAdmin.from('models').select('*'), 5000);
        if (!error && data) {
          dbModels = data;
        }
      } catch (e) {
        console.error('Supabase fetch failed on backend:', e);
      }
    }

    const localModels = getLocalModels();
    
    // Merge them using a map to prevent duplicates, prioritizing Supabase models
    const mergedMap = new Map<string, any>();
    localModels.forEach(m => mergedMap.set(m.id, m));
    dbModels.forEach(m => mergedMap.set(m.id, m));

    const finalModels = Array.from(mergedMap.values());
    return res.json({ success: true, data: finalModels });
  } catch (err: any) {
    console.error('Get models backend endpoint failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Save or Update a model in backend database
router.post('/models', async (req: Request, res: Response) => {
  try {
    const model = req.body;
    if (!model || !model.id) {
      return res.status(400).json({ success: false, error: 'Invalid model data' });
    }

    // Save to local file database
    const localModels = getLocalModels();
    const idx = localModels.findIndex((m: any) => m.id === model.id);
    if (idx >= 0) {
      localModels[idx] = model;
    } else {
      localModels.push(model);
    }
    saveLocalModels(localModels);

    // Save to Supabase if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        // Clean undefined values so Supabase doesn't complain
        const cleanModel = JSON.parse(JSON.stringify(model));
        const { error } = await withTimeout(supabaseAdmin
          .from('models')
          .upsert(cleanModel), 2500);
        if (error) throw error;
        console.log(`Backend successfully upserted model ${model.id} in Supabase`);
      } catch (e: any) {
        console.warn(`Backend Supabase upsert failed for model ${model.id}:`, e.message || e);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Save model backend endpoint failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch image from remote source and encode as base64 for offline SVG resolution
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.warn(`Failed to pre-fetch image ${url}, using default fallback placeholder`, error);
    // Generic fallback visual spacer
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
}

// AI Profile & Portfolio Scoring
router.post('/talent/evaluate', async (req: Request, res: Response) => {
  const { name, category, age, height, city, experience, biography, languages } = req.body;
  try {
    const result = await evaluateTalent({ name, category, age, height, city, experience, biography, languages });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Talent evaluation route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI PDF Parsing and Pre-fill API
router.post('/talent/parse-pdf', async (req: Request, res: Response) => {
  const { pdf, fileName } = req.body;
  try {
    const result = await parsePdfPortfolio(pdf, fileName);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('PDF parsing route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Open Graph Image Card generator
router.get('/og-image/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    // Resolve model or use default fallback Priya Sharma
    const model = staticModels[id] || staticModels['m1'];

    // Resolve base64 image representation
    const base64Image = await fetchImageAsBase64(model.imageUrl);

    // Escape dynamic parameters securely for XML/SVG literal injecting
    const safeName = model.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeCategory = model.category.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeCity = model.city.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeHeight = model.height.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeExperience = model.experience.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Dynamic high-fashion template with double bracket layout matching the vector chevron
    const svgTemplate = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="50%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0c0a09"/>
          <stop offset="100%" stop-color="#1c1917"/>
        </linearGradient>
        <clipPath id="photo-rounded">
          <rect x="680" y="75" width="450" height="480" rx="24" ry="24" />
        </clipPath>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg-grad)"/>

      <!-- Ambient glow circles -->
      <circle cx="200" cy="315" r="350" fill="#f97316" opacity="0.08" />
      <circle cx="1000" cy="315" r="300" fill="#ec4899" opacity="0.06" />

      <!-- Top Branding Rail info -->
      <path d="M75 55L65 65L75 75M68 59L61 65L68 71" stroke="url(#brand-grad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="95" y="72" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="900" font-size="25" fill="#ffffff" letter-spacing="4">CORE CAST</text>
      <text x="315" y="70" font-family="ui-monospace, SFMono-Regular, monospace" font-weight="bold" font-size="12" fill="#f97316" letter-spacing="2">• INDIA'S PREMIUM CASTING ECOSYSTEM</text>
      <line x1="75" y1="95" x2="600" y2="95" stroke="#292524" stroke-width="1.5"/>

      <!-- Left main display cards -->
      <text x="75" y="160" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="20" fill="#a855f7" letter-spacing="2">VERIFIED PORTFOLIO</text>
      <text x="75" y="245" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="900" font-size="64" fill="#ffffff" letter-spacing="-1">${safeName}</text>
      <text x="75" y="305" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="24" fill="#d6d3d1">${safeCategory}</text>

      <!-- Grid layout specs -->
      <!-- Item A -->
      <rect x="75" y="340" width="168" height="90" rx="12" fill="#1c1917" stroke="#292524" stroke-width="1.5"/>
      <text x="95" y="372" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="12" fill="#78716c" letter-spacing="1">LOCATION</text>
      <text x="95" y="405" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${safeCity}</text>

      <!-- Item B -->
      <rect x="258" y="340" width="168" height="90" rx="12" fill="#1c1917" stroke="#292524" stroke-width="1.5"/>
      <text x="278" y="372" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="12" fill="#78716c" letter-spacing="1">HEIGHT</text>
      <text x="278" y="405" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${safeHeight}</text>

      <!-- Item C -->
      <rect x="441" y="340" width="168" height="90" rx="12" fill="#1c1917" stroke="#292524" stroke-width="1.5"/>
      <text x="461" y="372" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="12" fill="#78716c" letter-spacing="1">EXPERIENCE</text>
      <text x="461" y="405" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${safeExperience}</text>

      <!-- Status badges -->
      <!-- Live Ledger Auth -->
      <rect x="75" y="465" width="230" height="42" rx="21" fill="rgba(34, 197, 94, 0.08)" stroke="#22c55e" stroke-width="1"/>
      <circle cx="95" cy="486" r="7" fill="#22c55e"/>
      <path d="M92 486l2 2 4-4" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <text x="115" y="492" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="12" fill="#4ade80" letter-spacing="0.5">SELFIE-VERIFIED LIVE</text>

      <!-- Premium stars rating -->
      <rect x="320" y="465" width="220" height="42" rx="21" fill="rgba(234, 179, 8, 0.08)" stroke="#eab308" stroke-width="1"/>
      <path d="M342 477l2.5 5 5.5.8-4 4 1 5.5-5-2.6-5 2.6 1-5.5-4-4 5.5-.8z" fill="#eab308"/>
      <text x="360" y="491" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="bold" font-size="12" fill="#facc15" letter-spacing="0.5">${model.rating} (${model.reviews} REVIEWS)</text>

      <!-- Trust terms notice -->
      <text x="75" y="555" font-family="ui-monospace, SFMono-Regular, monospace" font-size="11" font-weight="bold" fill="#78716c" letter-spacing="1">TRUST ESCROW PROTECTED • ANTI-INTERMEDIARY LEDGER</text>

      <!-- Right image container with active gradient frame highlights -->
      <rect x="677" y="72" width="456" height="486" rx="27" ry="27" fill="none" stroke="url(#brand-grad)" stroke-width="3" opacity="0.8"/>
      <image href="${base64Image}" x="680" y="75" width="450" height="480" clip-path="url(#photo-rounded)" preserveAspectRatio="xMidYMid slice"/>
    </svg>
    `;

    // Process and compile standard 1200x630 card
    const resvg = new Resvg(svgTemplate, {
      background: '#0c0a09',
      fitTo: { mode: 'width', value: 1200 }
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.send(pngBuffer);

  } catch (error) {
    console.error('Failed to generate Open Graph image card', error);
    return res.status(500).send('Open Graph generation failed');
  }
});

export default router;

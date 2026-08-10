import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { staticModels } from '../config/models';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'modelverse.in';
    const baseUrl = `${protocol}://${host}`;

    // Static pages
    const staticPages = [
      { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/?tab=models`, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/?tab=become-model`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${baseUrl}/?tab=pricing`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/?tab=blog`, changefreq: 'weekly', priority: '0.7' },
    ];

    // Category sub-indices
    const categories = [
      'Fashion Models',
      'Commercial Models',
      'Fitness Models',
      'Influencers',
      'UGC Creators',
      'Actors',
      'Event Hosts',
      'Promotional Models',
      'Brand Ambassadors'
    ];

    const categoryPages = categories.map(cat => ({
      loc: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
      changefreq: 'weekly',
      priority: '0.8'
    }));

    // Dynamic talent profiles list
    const talentPages: Array<{ loc: string; changefreq: string; priority: string }> = [];

    // Read firebase configuration
    const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let firebaseConfig: any = null;
    try {
      if (fs.existsSync(firebaseConfigPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      }
    } catch (e) {
      console.warn('Sitemap generator could not parse firebase-applet-config.json:', e);
    }

    const fetchedModelIds: Set<string> = new Set(Object.keys(staticModels));

    if (firebaseConfig && firebaseConfig.projectId && firebaseConfig.firestoreDatabaseId) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/models`;
        const firestoreRes = await fetch(url);
        if (firestoreRes.ok) {
          const fsData: any = await firestoreRes.json();
          if (fsData && fsData.documents) {
            for (const doc of fsData.documents) {
              const parts = doc.name.split('/');
              const modelId = parts[parts.length - 1];
              if (modelId) {
                fetchedModelIds.add(modelId);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Sitemap dynamic Firestore fetch failed, using default seed model ids:', err);
      }
    }

    // Map all verified profiles to indexable pages
    fetchedModelIds.forEach(id => {
      talentPages.push({
        loc: `${baseUrl}/?model_id=${id}`,
        changefreq: 'weekly',
        priority: '0.9'
      });
    });

    const allPages = [...staticPages, ...categoryPages, ...talentPages];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    allPages.forEach(p => {
      xml += '  <url>\n';
      xml += `    <loc>${p.loc}</loc>\n`;
      xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.send(xml);

  } catch (error: any) {
    console.error('Failed to generate sitemap.xml:', error);
    return res.status(500).send('Internal Server Error generating Sitemap');
  }
});

router.get('/ads.txt', (req: Request, res: Response) => {
  try {
    const adsTxtPath = path.join(process.cwd(), 'public', 'ads.txt');
    if (fs.existsSync(adsTxtPath)) {
      res.header('Content-Type', 'text/plain; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=86400');
      return res.sendFile(adsTxtPath);
    }
  } catch (e) {
    console.warn('Error sending ads.txt file:', e);
  }
  res.header('Content-Type', 'text/plain; charset=utf-8');
  return res.send('google.com, pub-2960926541753229, DIRECT, f08c47fec0942fa0\n');
});

export default router;

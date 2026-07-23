import { Router, Request, Response } from 'express';
import { generateAiImage, editAiImage } from '../services/image.service';
import { triggerVideoGeneration, checkVideoStatus, getVideoUri, getRandomMockVideo } from '../services/video.service';
import { searchGrounding, mapsGrounding, generateCampaignBrief, enhanceBiography, generateFashionKnowledge } from '../services/gemini.service';
import { ai, geminiApiKey } from '../config/gemini';

const router = Router();

// AI Image Generation
router.post('/ai/image-generate', async (req: Request, res: Response) => {
  const { prompt, aspectRatio, imageSize } = req.body;
  try {
    const result = await generateAiImage(prompt, aspectRatio, imageSize);
    return res.json(result);
  } catch (err: any) {
    console.error('Image generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Image Editing
router.post('/ai/image-edit', async (req: Request, res: Response) => {
  const { prompt, image, mimeType } = req.body;
  try {
    const result = await editAiImage(prompt, image, mimeType);
    return res.json(result);
  } catch (err: any) {
    console.error('Image editing error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger Veo Video Generation
router.post('/generate-video', async (req: Request, res: Response) => {
  const { prompt, image, mimeType, aspectRatio } = req.body;
  try {
    const operationName = await triggerVideoGeneration({ prompt, base64Image: image, mimeType, aspectRatio });
    return res.json({ success: true, operationName });
  } catch (err: any) {
    console.error('Trigger video generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Veo Video status poller
router.post('/video-status', async (req: Request, res: Response) => {
  const { operationName } = req.body;
  try {
    const done = await checkVideoStatus(operationName);
    return res.json({ success: true, done });
  } catch (err: any) {
    console.error('Video status check error:', err);
    return res.json({ success: true, done: true });
  }
});

// Veo Video Download Stream
router.post('/video-download', async (req: Request, res: Response) => {
  const { operationName } = req.body;
  const fallbackVideo = getRandomMockVideo();
  try {
    const uri = await getVideoUri(operationName);
    if (!uri) {
      return res.redirect(fallbackVideo);
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': geminiApiKey },
    });

    res.setHeader('Content-Type', 'video/mp4');
    
    // Pipe response stream node compatibility
    if (videoRes.body) {
      (videoRes.body as any).pipeTo(
        new WritableStream({
          write(chunk) { res.write(chunk); },
          close() { res.end(); },
          abort(err) { console.error('Pipe aborted:', err); res.end(); }
        })
      );
    } else {
      const buffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    console.warn('Video download streaming error, redirecting to showcase:', err);
    return res.redirect(fallbackVideo);
  }
});

// Google Search Grounding
router.post('/ai/search-grounding', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const responseText = await searchGrounding(prompt);
    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    console.error('Search grounding route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Google Maps Grounding
router.post('/ai/maps-grounding', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const responseText = await mapsGrounding(prompt);
    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    console.error('Maps grounding route failed:', err);
    return res.status(550).json({ success: false, error: err.message });
  }
});

// Campaign Casting Photo-shoot Planner
router.post('/ai/campaign-planner', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const responseText = await generateCampaignBrief(prompt);
    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    console.error('Campaign planner route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Biography Enhancer
router.post('/ai/bio-enhancer', async (req: Request, res: Response) => {
  const { bio } = req.body;
  try {
    const responseText = await enhanceBiography(bio);
    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    console.error('Bio enhancer route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Fashion Knowledge Assistant & Diagram Generator
router.post('/ai/fashion-assistant', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const responseText = await generateFashionKnowledge(prompt || 'Explain fashion runway lighting and pose diagram');
    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    console.error('Fashion assistant route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

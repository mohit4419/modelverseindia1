import { ai, geminiApiKey } from '../config/gemini';

const mockVideos = [
  'https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40134-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-posing-for-photoshoots-32189-large.mp4'
];

export function getRandomMockVideo(): string {
  return mockVideos[Math.floor(Math.random() * mockVideos.length)];
}

/**
 * Veo Video Generation operation starter
 */
export async function triggerVideoGeneration(params: {
  prompt: string;
  base64Image?: string;
  mimeType?: string;
  aspectRatio?: string;
}): Promise<string> {
  const { prompt, base64Image, mimeType, aspectRatio } = params;
  if (!ai) {
    return 'mock_veo_operation_' + Date.now();
  }
  try {
    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio || '16:9'
    };

    let imagePayload: any = undefined;
    if (base64Image) {
      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      imagePayload = {
        imageBytes: cleanBase64,
        mimeType: mimeType || 'image/png'
      };
    }

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt || 'Casting model walking gracefully on a high-fashion runway, cinematic depth',
      image: imagePayload,
      config
    } as any);

    return operation.name;
  } catch (err: any) {
    console.warn('Veo trigger warning, spawning mock animation operation:', err);
    return 'mock_veo_operation_' + Date.now();
  }
}

/**
 * Veo Video status poller
 */
export async function checkVideoStatus(operationName: string): Promise<boolean> {
  if (operationName && operationName.startsWith('mock_veo_operation_')) {
    return true;
  }
  if (!ai) {
    return true;
  }
  try {
    const op = { name: operationName };
    const updated = await (ai.operations as any).getVideosOperation({ operation: op });
    return !!updated.done;
  } catch (err: any) {
    console.warn('Veo polling error warning, returning done:', err);
    return true;
  }
}

/**
 * Get Veo Video direct uri or redirect fallback
 */
export async function getVideoUri(operationName: string): Promise<string | null> {
  if (operationName && operationName.startsWith('mock_veo_operation_')) {
    return null;
  }
  if (!ai) {
    return null;
  }
  try {
    const op = { name: operationName };
    const updated = await (ai.operations as any).getVideosOperation({ operation: op });
    return updated.response?.generatedVideos?.[0]?.video?.uri || null;
  } catch (err: any) {
    console.warn('Veo get URI error:', err);
    return null;
  }
}

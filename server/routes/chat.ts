import { Router, Request, Response } from 'express';
import { generateChatResponse, generateCoachingAdvice } from '../services/chat.service';

const router = Router();

router.post('/chat/respond', async (req: Request, res: Response) => {
  const { modelName, modelCategory, modelBiography, messages, userMessage, clientId, modelId } = req.body;

  try {
    const replyText = await generateChatResponse({
      modelName,
      modelCategory,
      modelBiography,
      messages,
      userMessage,
      clientId,
      modelId
    });

    return res.json({ reply: replyText });
  } catch (err: any) {
    if (err.message && err.message.includes('Access Denied')) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Chat responder endpoint failed:', err);
    return res.status(500).json({ error: 'Failed to generate chat response', details: err.message });
  }
});

router.post('/chat/coach', async (req: Request, res: Response) => {
  const { modelName, modelCategory, messages, budgetPrice } = req.body;

  try {
    const coachingResult = await generateCoachingAdvice({
      modelName,
      modelCategory,
      messages,
      budgetPrice
    });

    return res.json(coachingResult);
  } catch (err: any) {
    console.error('Coaching service route failed:', err);
    return res.status(500).json({ error: 'Failed to generate coaching suggestions', details: err.message });
  }
});

export default router;

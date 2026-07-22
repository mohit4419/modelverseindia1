import { randomUUID } from 'crypto';
import { ai } from '../config/gemini';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { ChatRepository, ChatRoom, ChatMessage } from '../repositories/chat.repository';

const chatRepository = new ChatRepository();

export async function getAllRooms(): Promise<ChatRoom[]> {
  return chatRepository.findAllRooms();
}

export async function getRoomById(id: string): Promise<ChatRoom | null> {
  return chatRepository.findRoomById(id);
}

export async function createRoom(params: {
  clientId: string;
  clientName: string;
  modelId: string;
  modelName: string;
  modelImage?: string;
}): Promise<ChatRoom> {
  const all = await chatRepository.findAllRooms();
  // Check if a room with the same client and model already exists
  const existing = all.find((r) => r.clientId === params.clientId && r.modelId === params.modelId);
  if (existing) {
    return existing;
  }

  const newRoom: ChatRoom = {
    id: randomUUID(),
    clientId: params.clientId,
    clientName: params.clientName,
    modelId: params.modelId,
    modelName: params.modelName,
    modelImage: params.modelImage || '',
    lastMessage: 'Room created',
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  return chatRepository.saveRoom(newRoom);
}

export async function getMessagesByRoom(roomId: string): Promise<ChatMessage[]> {
  return chatRepository.findMessagesByRoomId(roomId);
}

export async function saveNewMessage(params: {
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
}): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: randomUUID(),
    roomId: params.roomId,
    senderId: params.senderId,
    senderName: params.senderName,
    content: params.content,
    createdAt: new Date().toISOString(),
    messageType: 'text'
  };

  return chatRepository.saveMessage(newMsg);
}

export async function clearAllChats(): Promise<void> {
  await chatRepository.clearAll();
}

// In-memory list for successful Razorpay webhook events waiting to unlock chat sessions
export const pendingWebhookUnlocks: any[] = [];

// Server-side registry of verified unlocks (key: `${clientId}:${modelId}`)
export const verifiedChatAccess = new Set<string>([
  'c1:m4', 'c1:m6', 'client:m4', 'client:m6', 'agency:m4', 'agency:m6'
]);

export interface ChatRespondParams {
  modelName: string;
  modelCategory: string;
  modelBiography: string;
  messages: any[];
  userMessage: string;
  clientId?: string;
  modelId?: string;
}

export async function generateChatResponse(params: ChatRespondParams): Promise<string> {
  const { modelName, modelCategory, modelBiography, messages, userMessage, clientId, modelId } = params;

  // STRICT BACKEND ACCESS CHECK
  if (clientId && modelId) {
    const key = `${clientId}:${modelId}`;
    let isUnlocked = verifiedChatAccess.has(key);
    
    if (!isUnlocked && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: payRecord } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('user_id', clientId)
          .eq('model_id', modelId)
          .eq('status', 'captured')
          .maybeSingle();
        if (payRecord) {
          isUnlocked = true;
          verifiedChatAccess.add(key); // cache it
          console.log(`Verified persistent db payment for client:model ${key}. Cache updated.`);
        }
      } catch (err) {
        console.error('Error checking database for payment verification:', err);
      }
    }

    if (!isUnlocked) {
      console.warn(`Unauthorized chat attempt detected for client key: ${key}`);
      throw new Error('Access Denied: Chat session is locked. Complete Razorpay payment verification first.');
    }
  }

  // Compile prompt guiding Gemini to stay strictly within the persona of the professional Indian model
  const prompt = `You are ${modelName}, a professional model in India registered under ModelVerse India. 
Your details:
- Category: ${modelCategory}
- Biography: ${modelBiography}

You are chatting with a potential fashion brand client, photographer, or event organizer on the ModelVerse India portal.
Maintain high professionalism, politeness, and luxury elegance.
Answer their latest message directly inside this conversation context.

CRITICAL RULE: Direct personal mobile numbers, WhatsApp numbers, email addresses, or any private contact details are SECURE and MUST NOT be shared. Encourage them to book you directly through the secure "Book Now" flow on ModelVerse India.

Conversation history:
${(messages || []).map((m: any) => `${m.senderId === 'client' ? 'Client' : 'You'}: ${m.content}`).join('\n')}
Client latest message: "${userMessage}"

Generate a short, elegant, and context-appropriate reply (maximum 2-3 sentences):`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = response.text || '';
      return text.trim();
    } catch (err: any) {
      console.error('Gemini call failed, executing fallback responder', err);
    }
  }

  // FALLBACK INTELLIGENT RESPONSES if Gemini key is missing
  let fallbackReply = `Thank you for your message! I'm definitely interested in working together on this campaign. Please submit an official booking request through the "Book Now" button on my dashboard so we can secure the dates.`;
  const lowerMsg = userMessage.toLowerCase();
  
  if (lowerMsg.includes('phone') || lowerMsg.includes('whatsapp') || lowerMsg.includes('number') || lowerMsg.includes('email') || lowerMsg.includes('contact')) {
    fallbackReply = `For safety and standard compliance, all our secure chat communication, invoice processing, and scheduling must remain inside ModelVerse India. Let's arrange our shoot dates and logistics right here!`;
  } else if (lowerMsg.includes('budget') || lowerMsg.includes('price') || lowerMsg.includes('rate') || lowerMsg.includes('pay') || lowerMsg.includes('charge')) {
    fallbackReply = `My starting rates are displayed on my profile, but I'm open to discussing project-specific scopes. Feel free to submit a booking proposal with your corporate budget, and my agency manager will review it right away!`;
  } else if (lowerMsg.includes('portfolio') || lowerMsg.includes('photos') || lowerMsg.includes('images')) {
    fallbackReply = `My main high-fashion gallery is curated right here on ModelVerse India! Once you submit a booking request or unlock premium details, you can also view additional measurements and my high-resolution comp card!`;
  } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
    fallbackReply = `Hello! Thank you for reaching out to me via ModelVerse India. I'm excited to hear about your brand and discuss your upcoming creative campaign! What kind of shoot do you have in mind?`;
  }

  // Simulate network latency if falling back
  await new Promise(resolve => setTimeout(resolve, 1000));
  return fallbackReply;
}

export interface CoachingParams {
  modelName: string;
  modelCategory: string;
  messages: any[];
  budgetPrice?: number;
}

export async function generateCoachingAdvice(params: CoachingParams): Promise<{ tactics: string[]; coachVoiceLine: string }> {
  const { modelName, modelCategory, messages = [], budgetPrice } = params;

  const prompt = `You are the Lead Negotiation Coach at ModelVerse India, a premium agency consultant.
An active booking discussion is happening between a Client and Model: ${modelName} (${modelCategory}).
Current Booking Offer Price: ${budgetPrice ? '₹' + budgetPrice.toLocaleString() : 'Not set yet'}.

Here is the chat history:
${messages.map((m: any) => `${m.senderId === 'client' ? 'Client' : 'Model'}: ${m.content}`).join('\n')}

Based on this conversation, provide 3 highly strategic, hyper-targeted negotiation tactics for the CLIENT to secure a premium deal, and a brief, warm 1-sentence vocal coaching tip the AI coach can read aloud to the user.
Format the output strictly as JSON with the following schema:
{
  "tactics": [
    "Tactic 1 (highly customized to the model type, rate discussions, or campaign)",
    "Tactic 2",
    "Tactic 3"
  ],
  "coachVoiceLine": "Short supportive voice tip (e.g. 'Hey, Rohan is a high-fashion model. I suggest locking in digital social usage rights or negotiating a flat 3-day rate instead of hourly.')"
}

Do not include any markdown formatting like \`\`\`json or backticks. Only return raw JSON.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      const rawText = response.text || '';
      let parsed;
      try {
        const firstOpen = rawText.indexOf('{');
        const lastClose = rawText.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          const jsonStr = rawText.substring(firstOpen, lastClose + 1);
          parsed = JSON.parse(jsonStr);
        } else {
          const scrubbed = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(scrubbed);
        }
        if (parsed && Array.isArray(parsed.tactics) && parsed.coachVoiceLine) {
          return parsed;
        }
      } catch (e) {
        console.warn('Coaching JSON parsing failed, using fallback', e);
      }
    } catch (err) {
      console.error('Gemini coaching generator failed:', err);
    }
  }

  // Fallback suggestions based on context if AI fails/not configured
  const tactics = [
    `Request Social Usage rights: Negotiate adding 6 months of social media cross-posting to the core agreement without premium surcharge.`,
    `Optimize Day Rates: Since ${modelName} operates in ${modelCategory}, suggest a flat day rate rather than hourly rates to protect against overruns.`,
    `Leverage Escrow trust: Explicitly assure ${modelName} that 100% of the ₹${budgetPrice ? budgetPrice.toLocaleString() : '50,000'} fund is locked under ModelVerse Escrow Safeguards to demand a 10% premium discount.`
  ];
  const coachVoiceLine = `Since you are negotiating with ${modelName}, I recommend securing multi-day package concessions and locking in social media usage rights under our secure escrow safeguard.`;

  return { tactics, coachVoiceLine };
}

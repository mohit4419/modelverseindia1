import { URL } from 'url';
import WebSocket from 'ws';
import { ai, geminiApiKey } from '../config/gemini';

/**
 * Handle Live Audition session over WebSocket using Gemini Live API
 */
export async function handleLiveAudition(clientWs: any, request: any) {
  console.log('Client connected for live voice audition.');
  
  if (!ai || !geminiApiKey) {
    clientWs.send(JSON.stringify({ error: 'Gemini Live API is not initialized. Key is missing on backend.' }));
    clientWs.close();
    return;
  }

  // Parse voice parameter from query string
  const reqUrl = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  const voiceParam = reqUrl.searchParams.get('voice') || 'riya';

  let voiceName = 'Kore';
  let systemInstruction = 'You are an elegant and helpful casting voice coach at ModelVerse India named Riya. Speak clearly, encouragingly, and elegantly. Recommend models on keeping high confidence, posing, or preparing for high-fashion runway walks.';

  if (voiceParam === 'aarav') {
    voiceName = 'Fenrir';
    systemInstruction = 'You are Aarav, an elite runway coordinator and campaign director with 15+ years of experience directing Lakme and Milan Fashion Weeks. Your advice is sharp, direct, professional, and authoritative. Teach models how to master complex catwalk turns, handle wardrobe malfunctions on the ramp, and negotiate premium casting terms. Keep your answers highly focused and direct.';
  } else if (voiceParam === 'zack') {
    voiceName = 'Puck';
    systemInstruction = 'You are Zack, a flamboyant and high-energy runway stylist and casting vocal coach. Your vibe is super energetic, modern, and inspiring. Use terms like "fabulous", "fierce", and "work it". Guide models on bold self expression, creative posing, runway rhythm, and avant-garde catalogs. Keep your answers energetic and relatively short.';
  } else if (voiceParam === 'diya') {
    voiceName = 'Aoede';
    systemInstruction = 'You are Diya, a compassionate and experienced model mentor. You focus on mental confidence, handling rejection in auditions, speech projection, and natural authenticity. Speak in a soothing, thoughtful, and encouraging tone. Keep your responses short and calming.';
  }

  try {
    const session = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } }
        },
        systemInstruction: systemInstruction
      } as any,
      callbacks: {
        onmessage: (msg: any) => {
          // Send model's PCM audio back to the client
          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            clientWs.send(JSON.stringify({ audio: base64Audio }));
          }
          if (msg.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          clientWs.close();
        },
        onerror: (err: any) => {
          clientWs.send(JSON.stringify({ error: err.message || 'Gemini Live service error' }));
        }
      }
    } as any);

    clientWs.on('message', async (data: WebSocket.RawData) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio) {
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000'
            }
          });
        }
      } catch (err) {
        console.error('Error matching voice PCM streams:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        session.close();
      } catch (e) {}
    });

  } catch (err: any) {
    console.error('Live API connection setup failed:', err);
    clientWs.send(JSON.stringify({ error: `Connection failed: ${err.message}` }));
    clientWs.close();
  }
}

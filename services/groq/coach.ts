import i18n from '../../i18n';
import { fetchGroq, prepareImageData, VISION_MODEL, CHAT_MODEL } from './core';

// ─── Send coach message ───────────────────────────────────────────────────────
export async function sendCoachMessage(
  history: { role: 'user' | 'model'; parts: any[] }[],
  userMessage: string,
  systemPrompt: string,
  base64Image?: string
): Promise<string> {
  // Convert history → OpenAI-style messages
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role === 'model' ? 'assistant' : 'user',
      content: turn.role === 'user' ? `<user_input>\n${turn.parts.map((p: any) => p.text ?? '').join('')}\n</user_input>` : turn.parts.map((p: any) => p.text ?? '').join(''),
    })),
  ];

  // Current user message — with optional image
  if (base64Image) {
    const prepared = prepareImageData(base64Image);
    if (!prepared) {
      throw new Error(i18n.t('groq.imageProcessFailed'));
    }
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: `<user_input>\n${userMessage || 'Analyze this image.'}\n</user_input>` },
        {
          type: 'image_url',
          image_url: { url: prepared.dataUrl },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: `<user_input>\n${userMessage}\n</user_input>` });
  }

  const data = await fetchGroq({
    model: base64Image ? VISION_MODEL : CHAT_MODEL,
    messages,
    max_tokens: 600,
    temperature: 0.7,
  });

  return data.choices[0]?.message?.content ?? '';
}

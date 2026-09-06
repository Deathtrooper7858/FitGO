import i18n from '../../i18n';
import { fetchGroq, prepareImageData, VISION_MODEL, CHAT_MODEL } from './core';

// ─── Send coach message ───────────────────────────────────────────────────────
export async function sendCoachMessage(
  history: { role: 'user' | 'model'; parts: any[] }[],
  userMessage: string,
  systemPrompt: string,
  base64Image?: string
): Promise<string> {
  // Convert history → OpenAI-style messages (compacted to last 8 turns to save tokens)
  const recentHistory = history.slice(-8);
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...recentHistory.map((turn) => {
      let text = turn.parts.map((p: any) => p.text ?? '').join('');
      if (turn.role === 'model') {
        // Strip previous action chips, bullet lists, and disclaimer blocks from history to save tokens
        text = text
          .replace(/###\s*\[?¿?[^\]\n]*\??\]?[\s\n]+(\[[^\]]+\]\s*)+$/gi, '')
          .replace(/\*?(?:Nota|Note|Hinweis|Remarque|Aviso|Nota bene|Disclaimer):[^\n]*\*?/gi, '')
          .trim();
        // Keep only concise context for older assistant turns to conserve input tokens
        if (text.length > 380) {
          text = text.slice(0, 360).trim() + '...';
        }
        return { role: 'assistant', content: text };
      }
      return {
        role: 'user',
        content: `<user_input>\n${text}\n</user_input>`,
      };
    }),
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
    max_tokens: 1024,
    temperature: 0.6,
    reasoning_effort: 'low',
  });

  let content = data.choices[0]?.message?.content ?? '';
  // Sanitize any trailing hanging bullet points (e.g. trailing "•" or "-")
  content = content.replace(/[\r\n]+\s*[•\-\*]\s*$/g, '').trim();
  return content;
}

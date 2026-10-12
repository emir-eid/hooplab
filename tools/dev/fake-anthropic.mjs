// Yerel deneme için sahte Anthropic Messages API (SETUP §9): coach-daily'yi ve coach-ask'ı gerçek API'yi
// çağırmadan, Deno'da uçtan uca çalıştırır. Gerçek anahtar gerekmez, ücret doğmaz.
//   node tools/dev/fake-anthropic.mjs           → port 54398
//   supabase/functions/.env: ANTHROPIC_API_KEY=sk-ant-yerel-sahte, COACH_ANTHROPIC_BASE_URL=http://host.docker.internal:54398
// Her isteğin özeti (model, beta başlığı, belge sayısı) konsola yazılır; içerik yazılmaz.
// Günlük özete yanıt alıntısız tek kısa cümledir. Soru-cevapta sınıflandırma isteğine (yapılandırılmış çıktı)
// `in_scope`, yanıt isteğine ilk kaynağa alıntılı tek cümle döner: denetçiden geçer, soru yanıtlanır.

import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 54398);

function replyContent(request) {
  if (request.output_config?.format) return [{ type: 'text', text: JSON.stringify({ category: 'in_scope' }) }];
  const first = request.messages?.[0]?.content?.[0];
  if (Array.isArray(request.messages?.[0]?.content) && first?.title !== 'Günün sayıları') {
    const citation = { type: 'char_location', document_index: 0, document_title: first?.title ?? null, start_char_index: 0, end_char_index: 1, cited_text: '-', file_id: null };
    return [{ type: 'text', text: 'Yerel deneme yanıtı', citations: [citation] }, { type: 'text', text: '.' }];
  }
  return [{ type: 'text', text: 'Bugünün kısa özeti.' }];
}

createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    let request = {};
    try {
      request = JSON.parse(body || '{}');
    } catch {
      res.writeHead(400).end();
      return;
    }
    const content = request.messages?.[0]?.content ?? [];
    console.log(
      JSON.stringify({
        path: req.url,
        beta: req.headers['anthropic-beta'],
        model: request.model,
        fallbacks: request.fallbacks,
        documents: Array.isArray(content) ? content.filter((c) => c.type === 'document').length : 0,
        numbersBlocks: Array.isArray(content) ? (content.find((c) => c.title === 'Günün sayıları')?.source?.content?.length ?? 0) : 0,
        cacheMarks: Array.isArray(content) ? content.filter((c) => c.cache_control).length : 0,
        bytes: body.length,
      }),
    );
    res.writeHead(200, { 'content-type': 'application/json', 'request-id': 'req_yerel' });
    res.end(
      JSON.stringify({
        id: 'msg_yerel',
        type: 'message',
        role: 'assistant',
        model: request.model,
        content: replyContent(request),
        stop_reason: 'end_turn',
        stop_sequence: null,
        stop_details: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );
  });
}).listen(port, '0.0.0.0', () => console.log(`sahte Anthropic: http://127.0.0.1:${port}`));

// Yerel deneme için sahte Anthropic Messages API (SETUP §9): coach-daily'yi gerçek API'yi çağırmadan,
// Deno'da uçtan uca çalıştırır. Gerçek anahtar gerekmez, ücret doğmaz.
//   node tools/dev/fake-anthropic.mjs           → port 54398
//   supabase/functions/.env: ANTHROPIC_API_KEY=sk-ant-yerel-sahte, COACH_ANTHROPIC_BASE_URL=http://host.docker.internal:54398
// Her isteğin özeti (model, beta başlığı, belge sayısı) konsola yazılır; içerik yazılmaz.
// Yanıt alıntısız tek kısa cümledir: denetçiden geçer, özet kabul edilir.

import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 54398);

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
        documents: content.filter((c) => c.type === 'document').length,
        numbersBlocks: content[0]?.source?.content?.length ?? 0,
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
        content: [{ type: 'text', text: 'Bugünün kısa özeti.' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        stop_details: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );
  });
}).listen(port, '0.0.0.0', () => console.log(`sahte Anthropic: http://127.0.0.1:${port}`));

// Yerel uçtan uca deneme için sahte Google (OAuth + Health API v4), tamamen sentetik veri.
// Yerel Edge Runtime (Docker) buna host.docker.internal üzerinden ulaşır; gerçek Google'a hiç gidilmez.
// Değerler supabase/functions/tests/google-health/fake-google.ts ile aynı (birim testleriyle tek kaynak).
//
// Kullanım: node tools/dev/fake-google-health.ts            (port 54399)
//           node tools/dev/fake-google-health.ts --port 54400
// Sahte izin ekranı: GET /auth → redirect_uri?code=sentetik-kod&state=... (tarayıcıda tıklamasız döner).

import { createServer } from 'node:http';

import { createFakeGoogle } from '../../supabase/functions/tests/google-health/fake-google.ts';

const args = process.argv.slice(2);
const port = Number(args.includes('--port') ? args[args.indexOf('--port') + 1] : '54399');
const google = createFakeGoogle();

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  if (req.method === 'GET' && url.pathname === '/auth') {
    const back = new URL(url.searchParams.get('redirect_uri') ?? '');
    back.searchParams.set('code', 'sentetik-kod');
    back.searchParams.set('state', url.searchParams.get('state') ?? '');
    res.writeHead(302, { Location: back.toString() }).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
  const response = await google.handle(
    new Request(url, { method: req.method ?? 'GET', headers, ...(body && req.method !== 'GET' ? { body } : {}) }),
  );
  console.log(`[sahte-google] ${req.method} ${url.pathname} → ${response.status}`);
  res.writeHead(response.status, { 'Content-Type': 'application/json' }).end(await response.text());
}).listen(port, () => console.log(`[sahte-google] http://127.0.0.1:${port}`));

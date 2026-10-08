// Sahte Anthropic Messages API: SDK'ya `fetch` olarak verilir. Gelen istekleri kaydeder, sıradaki yanıtı döner.
// Yanıt biçimi resmi dokümandaki citations örneğinden (platform.claude.com/docs/en/build-with-claude/citations).

export interface RecordedRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

export type FakeReply =
  | { kind: 'message'; message: Record<string, unknown> }
  | { kind: 'error'; status: number; type: string }
  | { kind: 'network' };

export function createFakeAnthropic() {
  const requests: RecordedRequest[] = [];
  const replies: FakeReply[] = [];

  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => (headers[key] = value));
    requests.push({ url, headers, body: JSON.parse(String(init?.body ?? '{}')) });

    const reply = replies.shift();
    if (!reply) throw new Error('sahte Anthropic: beklenmeyen istek');
    if (reply.kind === 'network') throw new TypeError('fetch failed');
    if (reply.kind === 'error') {
      return Response.json({ type: 'error', error: { type: reply.type, message: 'sahte hata' } }, { status: reply.status, headers: { 'request-id': 'req_test' } });
    }
    return Response.json(reply.message, { status: 200, headers: { 'request-id': 'req_test' } });
  };

  return {
    fetch,
    requests,
    reply(r: FakeReply) {
      replies.push(r);
    },
  };
}

export function message(content: unknown[], extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    content,
    stop_reason: 'end_turn',
    stop_sequence: null,
    stop_details: null,
    usage: { input_tokens: 4200, output_tokens: 380, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, iterations: null },
    ...extra,
  };
}

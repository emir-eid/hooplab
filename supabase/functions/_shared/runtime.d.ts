// Supabase Edge Runtime (Deno) globallerinin kullandığımız kısmı. Yalnız tip denetimi içindir;
// çalışma anında platform sağlar. Kaynak: https://supabase.com/docs/guides/functions/background-tasks
declare const Deno: {
  env: { get(key: string): string | undefined };
};

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
} | undefined;

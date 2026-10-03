// Oturum durumu: saklanan oturum okunana kadar `ready` false kalır (açılış ekranı açık tutulur,
// giriş ekranı yanıp sönmez). Tek kullanıcı: kayıt akışı yok, hesap Supabase panosunda açılır.

import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { describeAuthError } from '@/auth/auth-errors';
import { supabase } from '@/lib/supabase';

interface SessionContextValue {
  session: Session | null;
  ready: boolean;
  /** Başarılıysa null, değilse kullanıcıya gösterilecek Türkçe hata. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(supabase === null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSession(data.session);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value: SessionContextValue = {
    session,
    ready,
    signIn: async (email, password) => {
      if (!supabase) return describeAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? describeAuthError(error) : null;
    },
    signOut: async () => {
      // Sunucu ulaşılamasa da yerel oturum silinir; kullanıcı çıkış yapmış görünür ve öyle olur.
      await supabase?.auth.signOut({ scope: 'local' });
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession, SessionProvider içinde kullanılmalı');
  return value;
}

-- Seans içerik etiketleri (karar 0027, research/rules/bolge.json → bolge-icerik-etiketleri).
-- Etiketler seansın hangi dokuları mekanik olarak çalıştırdığını işaretler; bölge yükü packages/engine'de
-- hesaplanır, saklanmaz.
--
--   * null: etiket girilmemiş (bu sütundan önceki kayıtlar). Hesap türün hazır etiketlerini kullanır ve
--     bunu ekranda söyler.
--   * boş dizi: kullanıcı "bu seansta bu içeriklerin hiçbiri yoktu" dedi (ör. mobilite).
--
-- Tablo düzeyindeki yetkiler ve sahibi politikaları (tek_sahip_ve_seanslar) yeni sütunu da kapsar.
-- Varsayılansız ve null olabilen sütun eklemek tabloyu yeniden yazmaz.

alter table public.training_sessions
  add column content_tags text[],
  add constraint training_sessions_content_tags_check
    check (content_tags <@ array['jump', 'cod', 'sprint', 'lower_strength', 'upper_strength']::text[]);

comment on column public.training_sessions.content_tags is
  'İçerik etiketleri (sıçrama, yön değiştirme, sprint, alt / üst vücut kuvvet). null = girilmemiş, türün hazır etiketleri sayılır.';

// Web (önizleme ve portfolyo demosu): expo-print web'de sayfanın kendisini yazdırır; rapor HTML'i gizli bir
// çerçevede açılıp tarayıcının yazdırma penceresi (PDF olarak kaydet) gösterilir. Hiçbir yere gönderilmez.

import type { SharePdfInput } from './share-pdf';

export async function sharePdf({ html }: SharePdfInput): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  try {
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      frame.srcdoc = html;
    });
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  } finally {
    // Yazdırma penceresi açıkken çerçeve kalır; kapanınca temizlenir.
    setTimeout(() => frame.remove(), 1000);
  }
}

// HTML'den PDF ve iOS paylaşım menüsü (karar 0051). PDF telefonda, uygulamanın önbellek klasöründe üretilir;
// sunucuya gitmez. Nereye gideceğini kullanıcı paylaşım menüsünde seçer. Menü kapanınca dosya silinir.

import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface SharePdfInput {
  html: string;
  fileName: string;
  width: number;
  height: number;
}

export async function sharePdf({ html, fileName, width, height }: SharePdfInput): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda paylaşım kullanılamıyor.');
  const { uri } = await Print.printToFileAsync({ html, width, height });
  const file = new File(uri);
  try {
    // Alıcının göreceği ad: rastgele önbellek adı yerine hafta. Aynı adlı eski dosya kaldıysa önce o silinir.
    const named = new File(file.parentDirectory, fileName);
    if (named.exists) named.delete();
    file.rename(fileName);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileName });
  } finally {
    if (file.exists) file.delete();
  }
}

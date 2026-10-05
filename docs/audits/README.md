# Denetim raporları

Haftalık zamanlanmış denetim görevi (`hooplab-haftalik-denetim`, her pazartesi 10:05) buraya `YYYY-AA-GG.md` yazar. Elle yapılan denetimler (ör. public öncesi) `YYYY-AA-GG-<konu>.md` adını alır. Görev kod değiştirmez, commit atmaz; rapor bir sonraki `/kapat` ile commit'lenir. `/ac` son oturumdan yeni bir rapor varsa gösterir.

Denetlenenler: STATE ile git geçmişinin tutarlılığı, bayatlayan açık işler, push edilmemiş veya rapora girmemiş commit'ler, commit edilmemiş değişiklikler, son CI sonucu, bekleyen literatür önerileri, LESSONS'taki kuralların son değişikliklerde ihlali, kopyalanan üçüncü taraf skill'lerin kaynak repolarındaki önemli güncellemeler, açık Dependabot uyarıları (uygulamada / sunucuda çalışan veya yalnız geliştirme diye sınıflanır; e-posta bildirimi yerine bu rapor).

Biçim: **Özet** (yeşil / sarı / kırmızı), **Bulgular** (her biri: ne, kanıt, öneri), **/ac'de konuşulacaklar**.

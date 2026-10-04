# Üçüncü taraf skill'ler

Bu klasördeki aşağıdaki skill'ler kaynak repolarından **değiştirilmeden** kopyalandı. Güncellemek için kaynak repodaki yeni sürüm aynı şekilde kopyalanır ve buradaki commit satırı güncellenir.

| Skill | Kaynak | Commit | Lisans |
|---|---|---|---|
| `animate-expo` | https://github.com/emilkowalski/skills (`skills/animate-expo`) | `e8a175de22ae1e49370fc144c1f3bb9aeedf988d` | MIT |
| `apple-design` | https://github.com/emilkowalski/skills (`skills/apple-design`) | `e8a175de22ae1e49370fc144c1f3bb9aeedf988d` | MIT |
| `review-animations` | https://github.com/emilkowalski/skills (`skills/review-animations`) | `e8a175de22ae1e49370fc144c1f3bb9aeedf988d` | MIT |
| `react-native-best-practices` | https://github.com/software-mansion-labs/skills (`skills/react-native-best-practices`) | `e3f00cdb34942cee8b788abe10fe0d78a7f2b4e9` | MIT (SKILL.md `license: MIT` beyanı ve marketplace kaydı; repo kökünde LICENSE dosyası yok) |

Kendi skill'lerimiz: `ac`, `rep`, `kapat`.

Plugin olarak yüklenenler (dosyaları bu repoda değil, `.claude/settings.json` üzerinden): `expo` (expo/skills), `supabase` ve `postgres-best-practices` (supabase/agent-skills).

## Not

`react-native-best-practices/references/enable-worklets-bundle-mode/` belgesi, internetten `curl` ile indirilen yamaların uygulanmasını önerir. HoopLab bu özelliği kullanmaz. Açılması gerekirse önce karar kaydı (docs/decisions) gerekir.

## Lisans metinleri

### emilkowalski/skills

```
MIT License

Copyright (c) 2026 Emil Kowalski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### software-mansion-labs/skills

MIT lisansı (Software Mansion). Repo kökünde ayrı bir lisans dosyası bulunmadığı için telif satırı `SKILL.md` ve marketplace kaydındaki beyana dayanır: "Copyright (c) Software Mansion".

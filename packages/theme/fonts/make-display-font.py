"""Bricolage Grotesque değişken fontundan opsz 96 / wght 800 / wdth 100 sabit kesimini üretir.

Neden: React Native değişken font eksenlerini ayarlayamaz; @expo-google-fonts paketindeki sabit
dosyalar opsz 14'te kesilmiş. Maketteki büyük durum etiketi ve rakamlar opsz 96 ile çiziliyor.
Ayrıntı: packages/theme/README.md ("Fontlar").

Kullanım (fontTools gerekir):
  python make-display-font.py <BricolageGrotesque[opsz,wdth,wght].ttf>
Kaynak dosya: github.com/google/fonts, ofl/bricolagegrotesque, commit b9f6c71 (README'de tam hash).
"""
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FAMILY = "Bricolage Grotesque 96pt"
STYLE = "ExtraBold"
POSTSCRIPT = "BricolageGrotesque96pt-ExtraBold"
OUT = Path(__file__).with_name("BricolageGrotesque96pt_800ExtraBold.ttf")


def main(src: str) -> None:
    font = TTFont(src)
    inst = instancer.instantiateVariableFont(font, {"opsz": 96, "wght": 800, "wdth": 100})
    assert "fvar" not in inst, "kesim hala değişken"

    # Stok 700Bold dosyasıyla aynı ailede ad çakışması olmasın diye adlar tekilleştirilir.
    name = inst["name"]
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
            name.removeNames(nameID=rec.nameID)
    for name_id, value in {
        1: FAMILY,
        2: "Regular",
        3: f"{POSTSCRIPT};opsz96-wght800-wdth100",
        4: f"{FAMILY} {STYLE}",
        6: POSTSCRIPT,
        16: FAMILY,
        17: STYLE,
    }.items():
        name.setName(value, name_id, 3, 1, 0x409)
        name.setName(value, name_id, 1, 0, 0)
    inst["OS/2"].usWeightClass = 800
    inst.save(OUT)
    print(f"yazıldı: {OUT.name} ({OUT.stat().st_size} bayt)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("kullanım: python make-display-font.py <değişken font>")
    main(sys.argv[1])

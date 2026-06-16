#!/usr/bin/env python3
"""
Bild-Optimierung & Galerie-Manifest für Luxis Puppentheater.

Was es tut:
  - liest die unveränderten Originale aus  _originale/galerie  und  _originale/bilder
  - erzeugt daraus web-optimierte Varianten in  assets/galerie  und  assets/bilder
    (je eine kleine "thumb"- und eine große Version, jeweils als WebP UND JPEG)
  - schreibt  galerie.json  (das Manifest, das die Galerie/den Slider auf der
    Website füllt) und übernimmt vorhandene Alt-Texte/Hero-Flags.

Wann ausführen:  immer wenn ein Bild dazukommt oder sich ändert.
  1. Neues Original (groß, unbearbeitet) nach  _originale/galerie/  legen,
     z. B.  galerie-17.jpg
  2.  python tools/optimize-images.py   ausführen
  3. Änderungen committen/pushen – fertig.

Voraussetzung:  Python 3 + Pillow  (pip install Pillow)
"""

import json
import os
from PIL import Image, ImageOps

# --- Konfiguration -----------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THUMB_MAX = 600      # längste Kante der Galerie-Vorschau (px)
FULL_MAX = 1400      # längste Kante der großen Version (Lightbox/Hero) (px)
BILDER_MAX = 1100    # längste Kante der Inhaltsbilder (Über mich, Anlässe) (px)
JPEG_Q = 82
WEBP_Q = 80

# Kuratierte Alt-Texte (Barrierefreiheit) und Hero-Slider-Auswahl.
# Wird nur als Startwert genutzt: ein bereits in galerie.json vorhandener
# Alt-Text hat Vorrang und wird beim erneuten Lauf NICHT überschrieben.
CURATED = {
    "galerie-01.jpg": ("Zwei Charakterpuppen – ein alter Mann mit weißem Haar und eine Hexe mit buntem Kopftuch.", True),
    "galerie-02.jpg": ("Der alte Mann und die wild gelockte Hexe im Gespräch.", False),
    "galerie-03.jpg": ("Engelsfigur in weißem Gewand mit ausgebreiteten Armen.", False),
    "galerie-04.jpg": ("Ein weißes Gespenst und ein Mann in brauner Kleidung.", False),
    "galerie-05.jpg": ("Weiße Märchenfigur mit Spitzhut.", False),
    "galerie-06.jpg": ("Mädchenpuppe im weißen Kleid vor herbstlicher Bühnenkulisse.", False),
    "galerie-07.jpg": ("Der alte Mann und die Hexe stehen sich gegenüber.", False),
    "galerie-08.jpg": ("Zwei Handpuppen – ein Kapitän mit Mütze und ein Mann mit Hut.", False),
    "galerie-09.jpg": ("Freundliche Hexe mit lila Spitzhut und buntem Flickenkleid.", True),
    "galerie-10.jpg": ("Prinzessin mit grünem Spitzhut und lila Kleid.", True),
    "galerie-11.jpg": ("Zauberer mit schwarzem Spitzhut und rotem Umhang.", True),
    "galerie-12.jpg": ("Zauberer mit Zauberstab und leuchtender Kristallkugel.", True),
    "galerie-13.jpg": ("Prinzessin und Kasperle mit einer lachenden Blume.", True),
    "galerie-14.jpg": ("Kasperle-Junge in roter Kleidung.", False),
    "galerie-15.jpg": ("Ein Mädchen im roten Kleid und eine Großmutter.", False),
    "galerie-16.jpg": ("Puppe im Trachtenkleid auf der Theaterbühne.", False),
}
GENERIC_ALT = "Foto aus dem Repertoire von Luxis Puppentheater."


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)          # Drehung aus EXIF anwenden
    return im.convert("RGB")


def save_variants(im, out_base, max_edge):
    """Speichert <out_base>.webp und <out_base>.jpg, auf max_edge skaliert."""
    v = im.copy()
    v.thumbnail((max_edge, max_edge), Image.LANCZOS)
    v.save(out_base + ".webp", "WEBP", quality=WEBP_Q, method=6)
    v.save(out_base + ".jpg", "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
    return v.size


def existing_manifest():
    path = os.path.join(ROOT, "galerie.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return {e["id"]: e for e in json.load(f)}


def main():
    prev = existing_manifest()

    # --- Galerie ---
    src_dir = os.path.join(ROOT, "_originale", "galerie")
    out_dir = os.path.join(ROOT, "assets", "galerie")
    os.makedirs(out_dir, exist_ok=True)
    manifest = []
    for fn in sorted(f for f in os.listdir(src_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))):
        stem = os.path.splitext(fn)[0]
        im = load(os.path.join(src_dir, fn))
        w, h = save_variants(im, os.path.join(out_dir, stem), FULL_MAX)
        save_variants(im, os.path.join(out_dir, stem + "-thumb"), THUMB_MAX)

        curated_alt, curated_hero = CURATED.get(fn, (GENERIC_ALT, False))
        prev_entry = prev.get(stem, {})
        manifest.append({
            "id": stem,
            "full": f"assets/galerie/{stem}",          # ohne Endung; .webp/.jpg ergänzt das Frontend
            "thumb": f"assets/galerie/{stem}-thumb",
            "alt": prev_entry.get("alt", curated_alt),  # vorhandener Alt-Text gewinnt
            "hero": prev_entry.get("hero", curated_hero),
            "w": w, "h": h,
        })
        print(f"  galerie  {fn:18} -> {w}x{h}")

    with open(os.path.join(ROOT, "galerie.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"galerie.json: {len(manifest)} Einträge")

    # --- Inhaltsbilder (Über mich, Anlässe) ---
    src_dir = os.path.join(ROOT, "_originale", "bilder")
    out_dir = os.path.join(ROOT, "assets", "bilder")
    os.makedirs(out_dir, exist_ok=True)
    for fn in sorted(f for f in os.listdir(src_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))):
        stem = os.path.splitext(fn)[0]
        im = load(os.path.join(src_dir, fn))
        w, h = save_variants(im, os.path.join(out_dir, stem), BILDER_MAX)
        print(f"  bilder   {fn:18} -> {w}x{h}")


if __name__ == "__main__":
    main()

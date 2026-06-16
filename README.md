# Luxis Puppentheater – Website

Moderne, statische Website für „Luxis Puppentheater“ (Birgit Lux, Lippstadt).
Gehostet auf **GitHub Pages**, ohne Server, ohne Datenbank, ohne Login.

**Live (nach Einrichtung):** https://groschenopa.github.io/kasper/

---

## 🚀 Einmalig: Seite live schalten

1. Diesen Ordner als Inhalt des GitHub-Repos **`groschenopa/kasper`** hochladen
   (Branch `main`).
2. Im Repo auf GitHub: **Settings → Pages**.
3. Unter **Build and deployment → Source**: „**Deploy from a branch**“ wählen,
   Branch **`main`**, Ordner **`/ (root)`**, **Save**.
4. Nach ein bis zwei Minuten ist die Seite unter
   `https://groschenopa.github.io/kasper/` erreichbar.

> Es gibt **keinen Build-Schritt**. Was im Repo liegt, ist live. Jede Änderung
> auf `main` ist nach ~1 Minute online.

---

## ✏️ Pflege im Alltag

### Ein neues Foto in die Galerie

**Bequemer Weg (mit Optimierung, empfohlen):**
1. Das Originalfoto (ruhig groß) nach `_originale/galerie/` legen und fortlaufend
   benennen, z. B. `galerie-17.jpg`.
2. Einmal das Optimierungs-Skript laufen lassen:
   ```
   python tools/optimize-images.py
   ```
   Es erzeugt automatisch die web-optimierten Varianten (WebP + JPEG, klein + groß)
   in `assets/galerie/` und aktualisiert `galerie.json`.
3. Änderungen committen/hochladen. Fertig – das Foto erscheint in der Galerie.

**Schnellster Weg (ohne Skript, direkt auf github.com):**
- Ein bereits web-taugliches Foto (max. ca. 1400 px Kante) per Drag & Drop in
  `assets/galerie/` hochladen und in `galerie.json` einen Eintrag ergänzen.
  (Das Skript ist komfortabler, weil es Größe und WebP automatisch erledigt.)

> Ein Bild soll in den **Hero-Slider** auf der Startseite? In `galerie.json` beim
> Eintrag `"hero": true` setzen.

### Ein Foto entfernen
Datei aus `_originale/galerie/` löschen, `python tools/optimize-images.py` ausführen
(räumt `galerie.json` auf) – oder den Eintrag in `galerie.json` und die Dateien in
`assets/galerie/` direkt löschen.

### Einen Gästebuch-Eintrag hinzufügen
Die Datei `guestbook.json` öffnen und oben einen Block ergänzen
(neueste Einträge stehen oben):

```json
{
  "name": "Familie Mustermann",
  "date": "5. Juni 2026",
  "iso": "2026-06-05",
  "text": "Vielen Dank für die schöne Vorstellung!"
}
```
`iso` ist nur für die richtige Sortierung (Format `JJJJ-MM-TT`).

### Einen Text ändern
Die Texte stehen direkt in den jeweiligen HTML-Dateien
(`index.html`, `anlaesse.html`, `ueber-mich.html`, …). Einfach dort bearbeiten.

---

## 🌐 Später: eigene Domain anbinden

1. Domain bei einem Anbieter registrieren (z. B. `luxis-puppentheater.de`).
2. Beim Anbieter einen DNS-Eintrag auf GitHub Pages setzen
   (A-Records auf die GitHub-Pages-IPs bzw. CNAME auf `groschenopa.github.io`).
3. Im Repo unter **Settings → Pages → Custom domain** die Domain eintragen
   (legt eine `CNAME`-Datei an) und **„Enforce HTTPS“** aktivieren.
4. Danach in `sitemap.xml` und `robots.txt` die Basis-URL anpassen; die `404.html`
   verlinkt dann automatisch auf `/`.

---

## ✅ Vom Staging zum echten Launch

Die Seite ist aktuell im **Staging-Modus**: erreichbar unter der URL, aber für
Google gesperrt (keine Konkurrenz zur Jimdo-Seite). Wenn alles fertig ist und die
Seite offiziell online gehen soll:

1. In **`robots.txt`** den Staging-Block durch den Launch-Block ersetzen
   (Anleitung steht in der Datei).
2. In den vier Seiten `index.html`, `anlaesse.html`, `ueber-mich.html`,
   `gaestebuch.html` die Zeile mit
   `<meta name="robots" content="noindex, nofollow">` entfernen
   (jeweils mit dem Kommentar „STAGING: vor dem Launch entfernen“ markiert).
3. (Empfohlen) Jimdo-Seite abschalten oder auf die neue Domain umleiten, damit es
   keine doppelten Inhalte gibt.

> Tipp: Schritt 1 + 2 erledige ich dir auf Zuruf in Sekunden.

## 🧩 Aufbau (für Technik-Interessierte)

```
index.html, anlaesse.html, …   Seiten (statische Texte fest im HTML)
galerie.json                   Manifest der Galerie-/Slider-Bilder
guestbook.json                 Gästebuch-Einträge
assets/css/styles.css          Designsystem (Farben/Fonts aus dem Briefing)
assets/js/main.js              Burger-Menü, Slider, Galerie + Lightbox, Gästebuch
assets/fonts/                  selbst gehostete Schriften (DSGVO-freundlich)
assets/galerie/                web-optimierte Galeriebilder (WebP + JPEG)
assets/bilder/                 Inhaltsbilder (Über mich, Anlässe)
_originale/                    unveränderte Original-Fotos (Backup, Quelle fürs Skript)
tools/optimize-images.py       erzeugt optimierte Bilder + galerie.json
.nojekyll                      sagt GitHub Pages: Dateien unverändert ausliefern
```

### Lokale Vorschau (optional)
Im Projektordner:
```
python -m http.server 8000
```
Dann im Browser `http://localhost:8000/` öffnen.
(Direktes Öffnen der HTML-Datei per Doppelklick funktioniert **nicht** vollständig,
weil Galerie und Gästebuch per `fetch` geladen werden – dafür einen lokalen Server
wie oben verwenden.)

---

## Hinweise
- **Rechtstexte** (Impressum, Datenschutz) sind sorgfältige Vorlagen, aber keine
  Rechtsberatung – bitte vor dem Live-Gang prüfen (lassen).
- Es werden **keine Cookies**, kein Tracking und keine externen Schriftarten geladen.

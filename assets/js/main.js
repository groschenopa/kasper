/* =====================================================================
   Luxis Puppentheater – Interaktion
   Vanilla JS, keine Abhängigkeiten. Läuft auf jeder Seite; aktiviert nur
   die Bausteine, die auf der jeweiligen Seite vorhanden sind.
   ===================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* <picture> mit WebP + JPEG-Fallback aus einem Basis-Pfad (ohne Endung) */
  function pictureHTML(base, alt, sizeClass) {
    return (
      '<picture>' +
      '<source srcset="' + base + '.webp" type="image/webp">' +
      '<img src="' + base + '.jpg" alt="' + escapeAttr(alt) + '" loading="lazy"' +
      (sizeClass ? ' class="' + sizeClass + '"' : "") +
      '>' +
      "</picture>"
    );
  }
  function escapeAttr(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function escapeHTML(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------------------------------------------------------
     1) Burger-Menü
     --------------------------------------------------------------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector("#nav-menu");
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------------------------------------------------------------
     2) Hero-Slider (nur Bilder mit "hero": true aus galerie.json)
     --------------------------------------------------------------- */
  function initHero(images) {
    const slider = document.querySelector(".hero-slider");
    if (!slider) return;
    const heroes = images.filter(function (i) { return i.hero; });
    const list = heroes.length ? heroes : images.slice(0, 5);
    if (!list.length) return;

    const track = document.createElement("div");
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "hero-dots";

    list.forEach(function (img, idx) {
      const slide = document.createElement("div");
      slide.className = "hero-slide" + (idx === 0 ? " active" : "");
      slide.innerHTML = pictureHTML(img.full, img.alt, null);
      track.appendChild(slide);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Bild " + (idx + 1) + " von " + list.length + " anzeigen");
      if (idx === 0) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", function () { go(idx); });
      dotsWrap.appendChild(dot);
    });

    slider.innerHTML = "";
    slider.appendChild(track);
    if (list.length > 1) slider.appendChild(dotsWrap);

    const slides = track.querySelectorAll(".hero-slide");
    const dots = dotsWrap.querySelectorAll("button");
    let current = 0;
    let timer = null;

    function go(i) {
      slides[current].classList.remove("active");
      if (dots[current]) dots[current].removeAttribute("aria-current");
      current = (i + list.length) % list.length;
      slides[current].classList.add("active");
      if (dots[current]) dots[current].setAttribute("aria-current", "true");
    }
    function next() { go(current + 1); }

    if (list.length > 1 && !reduceMotion) {
      const start = function () { timer = window.setInterval(next, 5000); };
      const stop = function () { window.clearInterval(timer); };
      start();
      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);
      slider.addEventListener("focusin", stop);
      slider.addEventListener("focusout", start);
    }
  }

  /* ---------------------------------------------------------------
     3) Galerie-Grid + Lightbox
     --------------------------------------------------------------- */
  function initGalerie(images) {
    const grid = document.querySelector(".galerie");
    if (!grid) return;
    if (!images.length) {
      grid.innerHTML = '<p class="no-js-hinweis">Zurzeit sind keine Bilder hinterlegt.</p>';
      return;
    }

    grid.innerHTML = "";
    images.forEach(function (img, idx) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Foto vergrößern: " + img.alt);
      btn.innerHTML = pictureHTML(img.thumb, img.alt, null);
      btn.addEventListener("click", function () { openLightbox(idx); });
      grid.appendChild(btn);
    });

    /* Lightbox-Gerüst einmalig erzeugen */
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Bildansicht");
    lb.innerHTML =
      '<button class="lb-close" aria-label="Schließen">×</button>' +
      '<button class="lb-nav lb-prev" aria-label="Vorheriges Bild">‹</button>' +
      '<button class="lb-nav lb-next" aria-label="Nächstes Bild">›</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);

    const lbImg = lb.querySelector("img");
    const lbCap = lb.querySelector("figcaption");
    const btnClose = lb.querySelector(".lb-close");
    const btnPrev = lb.querySelector(".lb-prev");
    const btnNext = lb.querySelector(".lb-next");
    let pos = 0;
    let lastFocus = null;

    function show(i) {
      pos = (i + images.length) % images.length;
      const img = images[pos];
      lbImg.src = img.full + ".jpg";
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
    }
    function openLightbox(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }
    function close() {
      lb.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(pos - 1); });
    btnNext.addEventListener("click", function () { show(pos + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(pos - 1);
      else if (e.key === "ArrowRight") show(pos + 1);
    });
  }

  /* ---------------------------------------------------------------
     4) Gästebuch
     --------------------------------------------------------------- */
  function initGaestebuch() {
    const wrap = document.querySelector(".gaeste");
    if (!wrap) return;
    fetch("guestbook.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (entries) {
        entries.sort(function (a, b) { return (b.iso || "").localeCompare(a.iso || ""); });
        wrap.innerHTML = "";
        entries.forEach(function (e) {
          const el = document.createElement("article");
          el.className = "eintrag";
          el.innerHTML =
            "<blockquote>" + escapeHTML(e.text) + "</blockquote>" +
            '<p class="meta"><strong>' + escapeHTML(e.name) + "</strong> – " +
            escapeHTML(e.date) + "</p>";
          wrap.appendChild(el);
        });
      })
      .catch(function () {
        wrap.innerHTML =
          '<p class="no-js-hinweis">Die Einträge konnten nicht geladen werden. ' +
          'Bitte laden Sie die Seite neu.</p>';
      });
  }

  /* ---------------------------------------------------------------
     Start
     --------------------------------------------------------------- */
  function boot() {
    initNav();
    initGaestebuch();

    const needsImages = document.querySelector(".hero-slider, .galerie");
    if (needsImages) {
      fetch("galerie.json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (images) {
          initHero(images);
          initGalerie(images);
        })
        .catch(function () {
          const g = document.querySelector(".galerie");
          if (g) g.innerHTML = '<p class="no-js-hinweis">Bilder konnten nicht geladen werden.</p>';
        });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

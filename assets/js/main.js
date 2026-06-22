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
      toggle.setAttribute("aria-label", "Menü öffnen");
    }
    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    /* Klick/Tipp außerhalb von Menü und Button schließt das Menü */
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (e.target.closest("#nav-menu") || e.target.closest(".nav-toggle")) return;
      close();
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
      slide.setAttribute("aria-hidden", idx === 0 ? "false" : "true");
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
      slides[current].setAttribute("aria-hidden", "true");
      if (dots[current]) dots[current].removeAttribute("aria-current");
      current = (i + list.length) % list.length;
      slides[current].classList.add("active");
      slides[current].setAttribute("aria-hidden", "false");
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
    const teaser = parseInt(grid.getAttribute("data-teaser"), 10) || 0;
    const shown = teaser ? Math.min(teaser, images.length) : images.length;
    images.forEach(function (img, idx) {
      if (idx >= shown) return;            // auf der Startseite nur die Teaser-Anzahl zeigen
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Foto vergrößern: " + img.alt);
      btn.innerHTML = pictureHTML(img.thumb, img.alt, null);
      btn.addEventListener("click", function () { openLightbox(idx); });
      grid.appendChild(btn);
    });

    /* Mehr Bilder vorhanden als gezeigt: Button öffnet direkt die Lightbox über ALLE Bilder */
    if (teaser && images.length > teaser) {
      const wrap = document.createElement("p");
      wrap.className = "text-center galerie-mehr";
      const more = document.createElement("button");
      more.type = "button";
      more.className = "btn btn-ghost";
      more.setAttribute("aria-haspopup", "dialog");
      more.textContent = "Alle " + images.length + " Bilder ansehen";
      more.addEventListener("click", function () { openLightbox(0); });
      wrap.appendChild(more);
      grid.insertAdjacentElement("afterend", wrap);
    }

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
      '<figure><img alt=""><figcaption aria-hidden="true"></figcaption></figure>' +
      '<p class="visually-hidden" aria-live="polite"></p>';
    document.body.appendChild(lb);

    const lbImg = lb.querySelector("img");
    const lbCap = lb.querySelector("figcaption");
    const lbStatus = lb.querySelector("[aria-live]");
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
      lbStatus.textContent = "Bild " + (pos + 1) + " von " + images.length + ": " + img.alt;
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
      else if (e.key === "Tab") {
        /* Fokus innerhalb des Dialogs halten */
        const f = [btnClose, btnPrev, btnNext];
        const i = f.indexOf(document.activeElement);
        const dir = e.shiftKey ? -1 : 1;
        e.preventDefault();
        f[i < 0 ? 0 : (i + dir + f.length) % f.length].focus();
      }
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
     5) Scroll-Reveal (dezent) + Gästebuch-Stimmen-Teaser
     --------------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initStimmenTeaser() {
    const wrap = document.querySelector("#stimmen-teaser");
    if (!wrap) return;
    fetch("guestbook.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (entries) {
        entries.sort(function (a, b) { return (b.iso || "").localeCompare(a.iso || ""); });
        wrap.innerHTML = "";
        entries.slice(0, 2).forEach(function (e) {
          const t = e.text.length > 180 ? e.text.slice(0, 177).trim() + "…" : e.text;
          const el = document.createElement("article");
          el.className = "stimme";
          el.innerHTML =
            "<blockquote>" + escapeHTML(t) + "</blockquote>" +
            '<p class="meta"><strong>' + escapeHTML(e.name) + "</strong> – " + escapeHTML(e.date) + "</p>";
          wrap.appendChild(el);
        });
      })
      .catch(function () {
        wrap.innerHTML = '<p class="no-js-hinweis">Stimmen konnten nicht geladen werden.</p>';
      });
  }

  /* ---------------------------------------------------------------
     Kopierschutz (nur Abschreckung – kein echter Schutz)
     --------------------------------------------------------------- */
  function initCopyschutz() {
    ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(function (evt) {
      document.addEventListener(evt, function (e) { e.preventDefault(); });
    });
  }

  /* ---------------------------------------------------------------
     Start
     --------------------------------------------------------------- */
  function boot() {
    initCopyschutz();
    initNav();
    initReveal();
    initStimmenTeaser();
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

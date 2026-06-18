/* =========================================================
   app.js — Asma ul-Husna
   - Picks the "name of the day" (same for everyone, changes daily)
   - Renders the hero + the grid of all 99 names
   - Opens a detail popup for any name
   - Tracks which names you've "learned" (saved in your browser)
   - Tab switching between Names and Quiz
   The 99 names come from data.js (the NAMES array).
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Small helpers ---------- */
  const $ = (sel) => document.querySelector(sel);
  const LS_KEY = "asma_learned_v1";

  // Which names has the user marked learned? Stored as a Set of ids.
  function loadLearned() {
    try {
      return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }
  function saveLearned(set) {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  }
  let learned = loadLearned();

  // Day of year (1–365/366) → pick the same name for everyone, each day.
  function dayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    return Math.floor(diff / 86400000);
  }
  const todayIndex = (dayOfYear(new Date()) - 1 + NAMES.length) % NAMES.length;
  const todayName = NAMES[todayIndex];

  /* ---------- Reference pill (links to quran.com) ---------- */
  function refHtml(name) {
    if (!name.quranRef || !name.quranUrl) return "";
    return `<a class="ref-pill" href="${name.quranUrl}" target="_blank" rel="noopener">Quran ${name.quranRef}</a>`;
  }

  /* ---------- Learn button label/state ---------- */
  function setLearnBtn(btn, id) {
    const isLearned = learned.has(id);
    btn.classList.toggle("is-learned", isLearned);
    btn.textContent = isLearned ? "Learned" : "Mark as learned";
  }
  function toggleLearned(id) {
    if (learned.has(id)) learned.delete(id);
    else learned.add(id);
    saveLearned(learned);
    renderProgress();
    renderGrid();           // refresh ticks on cards
  }

  /* ---------- Hero (name of the day) ---------- */
  function renderHero() {
    $("#hero-arabic").textContent   = todayName.arabic;
    $("#hero-translit").textContent = todayName.translit;
    $("#hero-english").textContent  = todayName.english;
    $("#hero-urdu").textContent     = todayName.urdu;
    $("#hero-ref").innerHTML        = refHtml(todayName);

    const btn = $("#hero-learn");
    setLearnBtn(btn, todayName.id);
    btn.onclick = () => { toggleLearned(todayName.id); setLearnBtn(btn, todayName.id); };
  }

  /* ---------- Progress ring ---------- */
  function renderProgress() {
    const count = learned.size;
    const pct = Math.round((count / NAMES.length) * 100);
    $("#progress-count").textContent = count;
    $("#progress-ring").style.setProperty("--pct", pct);
    const sub = $("#progress-sub");
    if (count === 0)      sub.textContent = "Tap a name, then “Mark as learned” to track your progress.";
    else if (count < 99)  sub.textContent = `${count} learned, ${NAMES.length - count} to go. Keep going 🤍`;
    else                  sub.textContent = "MashaAllah — you’ve learned all 99 names!";
  }

  /* ---------- Grid of all 99 ---------- */
  function renderGrid() {
    const grid = $("#grid");
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();

    NAMES.forEach((name) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.setAttribute("role", "listitem");
      if (name.id === todayName.id) card.classList.add("is-today");
      if (learned.has(name.id))     card.classList.add("is-learned");

      card.innerHTML = `
        <div class="card-num">${name.id}</div>
        <div class="card-arabic" lang="ar" dir="rtl">${name.arabic}</div>
        <div class="card-translit">${name.translit}</div>
        <div class="card-english">${name.english}</div>
      `;
      card.addEventListener("click", () => openModal(name));
      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  /* ---------- Detail modal ---------- */
  function openModal(name) {
    $("#modal-index").textContent    = `Name ${name.id} of 99`;
    $("#modal-arabic").textContent   = name.arabic;
    $("#modal-translit").textContent = name.translit;
    $("#modal-english").textContent  = name.english;
    $("#modal-urdu").textContent     = name.urdu;
    $("#modal-ref").innerHTML        = refHtml(name);

    const btn = $("#modal-learn");
    setLearnBtn(btn, name.id);
    btn.onclick = () => { toggleLearned(name.id); setLearnBtn(btn, name.id); };

    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#modal").hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- Tabs ---------- */
  function switchTab(which) {
    const onNames = which === "names";
    $("#tab-names").classList.toggle("is-active", onNames);
    $("#tab-quiz").classList.toggle("is-active", !onNames);
    $("#tab-names").setAttribute("aria-selected", onNames);
    $("#tab-quiz").setAttribute("aria-selected", !onNames);
    $("#view-names").classList.toggle("is-active", onNames);
    $("#view-quiz").classList.toggle("is-active", !onNames);
    $("#view-names").hidden = !onNames;
    $("#view-quiz").hidden = onNames;
    // Quiz hook (defined in quiz code, added in phase 2). Safe if absent.
    if (!onNames && typeof window.startQuiz === "function") window.startQuiz();
  }

  /* ---------- Wire everything up ---------- */
  function init() {
    renderHero();
    renderProgress();
    renderGrid();

    $("#modal-close").addEventListener("click", closeModal);
    $("#modal-backdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#modal").hidden) closeModal();
    });

    $("#tab-names").addEventListener("click", () => switchTab("names"));
    $("#tab-quiz").addEventListener("click", () => switchTab("quiz"));
  }

  // Expose a couple of things the quiz code (phase 2) will reuse.
  window.AsmaApp = { NAMES, refHtml };

  document.addEventListener("DOMContentLoaded", init);
})();

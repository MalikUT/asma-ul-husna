/* =========================================================
   app.js — 99 Beautiful Names of Allah
   - "Name of the day" (same for everyone, changes daily)
   - Hero + grid of all 99 + detail popup
   - "Learned" tracking (saved on this device via localStorage)
   - Save/share a name card as an image (date + AClan line stamped on)
   - Flash quiz with green/red feedback + shareable score card
   - Light/Dark theme toggle (saved on this device)
   Data comes from data.js (the NAMES array).
   ========================================================= */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const LEARNED_KEY = "asma_learned_v1";
  const BEST_KEY = "asma_quiz_best_v1";
  const THEME_KEY = "asma_theme_v1";
  const REMINDER_LINE = "For daily name reminders, visit theone.aclanglobal.com";

  /* ---------- Learned set (per device) ---------- */
  function loadLearned() {
    try { return new Set(JSON.parse(localStorage.getItem(LEARNED_KEY) || "[]")); }
    catch { return new Set(); }
  }
  function saveLearned(set) { localStorage.setItem(LEARNED_KEY, JSON.stringify([...set])); }
  let learned = loadLearned();

  /* ---------- Name of the day ---------- */
  function dayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }
  const todayIndex = (dayOfYear(new Date()) - 1 + NAMES.length) % NAMES.length;
  const todayName = NAMES[todayIndex];

  /* ---------- Dates (computed for Pakistan) ---------- */
  const TZ = "Asia/Karachi";
  function fmtGreg(opts) { return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(new Date()); }
  function fmtHijri(opts) {
    try { return new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", { timeZone: TZ, ...opts }).format(new Date()); }
    catch (e) { return ""; }
  }
  function renderDate() {
    const greg = fmtGreg({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const hijri = fmtHijri({ day: "numeric", month: "long", year: "numeric" });
    $("#topdate").textContent = hijri ? `${greg}  ·  ${hijri} (Pakistan)` : greg;
  }
  function dateForCard() {
    const greg = fmtGreg({ day: "numeric", month: "long", year: "numeric" });
    const hijri = fmtHijri({ day: "numeric", month: "long", year: "numeric" });
    return hijri ? `${hijri}  ·  ${greg}` : greg;
  }
  function dateTimeForCard() {
    const greg = fmtGreg({ day: "numeric", month: "long", year: "numeric" });
    const hijri = fmtHijri({ day: "numeric", month: "long", year: "numeric" });
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date());
    return `${hijri ? hijri + "  ·  " : ""}${greg}, ${time} PKT`;
  }

  /* ---------- Reference pill (links to quran.com) ---------- */
  function refHtml(name) {
    if (!name.quranRef || !name.quranUrl) return "";
    return `<a class="ref-pill" href="${name.quranUrl}" target="_blank" rel="noopener">Quran ${name.quranRef}</a>`;
  }

  /* ---------- Learn button ---------- */
  function setLearnBtn(btn, id) {
    const isLearned = learned.has(id);
    btn.classList.toggle("is-learned", isLearned);
    btn.textContent = isLearned ? "Learned" : "Mark as learned";
  }
  function toggleLearned(id) {
    if (learned.has(id)) learned.delete(id); else learned.add(id);
    saveLearned(learned);
    renderProgress();
    renderGrid();
  }

  /* ---------- Image export (save / share) ---------- */
  const canShareFiles = !!(navigator.canShare && navigator.share);

  // Render an element to a PNG blob. footerHtml (optional) is stamped on for the image only.
  function renderCardCanvas(rootSel, footerHtml) {
    const node = $(rootSel);
    return html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      onclone: (doc) => {
        doc.body.classList.remove("dark"); // exported card is always the light version
        // Freeze animations/transitions so we never capture a mid-fade (washed-out) frame
        const s = doc.createElement("style");
        s.textContent = "*{animation:none !important;transition:none !important;}";
        doc.head.appendChild(s);
        const clone = doc.querySelector(rootSel);
        clone.style.opacity = "1";
        clone.style.transform = "none";
        clone.querySelectorAll(".hero-actions, .modal-actions, .modal-close, .quiz-actions")
             .forEach((el) => (el.style.display = "none"));
        if (footerHtml) {
          const foot = doc.createElement("div");
          foot.className = "dl-foot";
          foot.innerHTML = footerHtml;
          clone.appendChild(foot);
        }
      },
    }).then((canvas) => new Promise((res) => canvas.toBlob((b) => res(b), "image/png")));
  }

  // Deliver a blob: Share sheet on mobile (saves to Photos / sends to socials), else download.
  async function deliver(blob, filename, shareText, forceDownload) {
    const file = new File([blob], filename, { type: "image/png" });
    if (!forceDownload && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: shareText }); return; }
      catch (e) { if (e && e.name === "AbortError") return; /* else fall through to download */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function notReady() { alert("The image tool is still loading — please try again in a second."); }

  async function exportNameCard(rootSel, name, forceDownload) {
    if (typeof html2canvas !== "function") return notReady();
    const footer =
      `<span class="dl-num">Name ${name.id} of 99</span>` +
      `<span class="dl-date">${dateForCard()}</span>` +
      `<span class="dl-brand">${REMINDER_LINE}</span>`;
    const blob = await renderCardCanvas(rootSel, footer);
    const filename = `${name.translit.replace(/[^\w-]/g, "")}-name-${name.id}-of-99.png`;
    await deliver(blob, filename, `${name.translit} — Name ${name.id} of 99 · ${REMINDER_LINE}`, forceDownload);
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

    const dl = $("#hero-download");
    dl.textContent = "↓ Download card";
    dl.onclick = () => exportNameCard("#hero", todayName, true);
  }

  /* ---------- Progress ---------- */
  function renderProgress() {
    const count = learned.size;
    const pct = Math.round((count / NAMES.length) * 100);
    $("#progress-count").textContent = count;
    $("#progress-ring").style.setProperty("--pct", pct);
    const sub = $("#progress-sub");
    if (count === 0)      sub.textContent = "Saved on this device. Open a name, then “Mark as learned”.";
    else if (count < 99)  sub.textContent = `${count} learned on this device · ${NAMES.length - count} to go 🤍`;
    else                  sub.textContent = "MashaAllah — all 99 marked learned on this device!";
  }

  /* ---------- Grid (flows right-to-left) ---------- */
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
        <div class="card-english">${name.english}</div>`;
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

    const dl = $("#modal-download");
    dl.textContent = "↓ Download";
    dl.onclick = () => exportNameCard("#modal-card", name, true);

    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#modal").hidden = true;
    document.body.style.overflow = "";
  }

  /* =========================================================
     QUIZ — match the Arabic name to its English meaning
     ========================================================= */
  const QUIZ_LEN = 10;
  let quiz = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function buildQuestions() {
    return shuffle(NAMES).slice(0, QUIZ_LEN).map((correct) => {
      const distractors = shuffle(NAMES.filter((n) => n.id !== correct.id)).slice(0, 3);
      return { name: correct, options: shuffle([correct, ...distractors]) };
    });
  }

  window.startQuiz = function () { renderQuizHome(); };

  function bestScore() { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10); }

  function renderQuizHome() {
    const best = bestScore();
    $("#quiz").innerHTML = `
      <div class="quiz-card">
        <p class="quiz-eyebrow">Flash Quiz</p>
        <h2 class="quiz-title">Match the name to its meaning</h2>
        <p class="quiz-lead">${QUIZ_LEN} questions. See the Arabic name, pick the right English meaning.</p>
        ${best ? `<p class="quiz-best">Your best: <strong>${best}/${QUIZ_LEN}</strong></p>` : ""}
        <button class="quiz-primary" id="quiz-start" type="button">Start quiz</button>
      </div>`;
    $("#quiz-start").onclick = beginQuiz;
  }

  function beginQuiz() {
    quiz = { qs: buildQuestions(), i: 0, score: 0, answered: false };
    renderQuestion();
  }

  function renderQuestion() {
    const q = quiz.qs[quiz.i];
    $("#quiz").innerHTML = `
      <div class="quiz-card">
        <div class="quiz-meta">
          <span>Question ${quiz.i + 1} / ${QUIZ_LEN}</span>
          <span>Score ${quiz.score}</span>
        </div>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${(quiz.i / QUIZ_LEN) * 100}%"></div></div>
        <p class="quiz-prompt-label">What does this name mean?</p>
        <div class="quiz-arabic" lang="ar" dir="rtl">${q.name.arabic}</div>
        <p class="quiz-translit">${q.name.translit}</p>
        <div class="quiz-options" id="quiz-options"></div>
        <button class="quiz-primary" id="quiz-next" type="button" hidden>${quiz.i === QUIZ_LEN - 1 ? "See result" : "Next"}</button>
      </div>`;

    const wrap = $("#quiz-options");
    q.options.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-option";
      b.textContent = opt.english;
      b.onclick = () => answer(b, opt, q.name);
      wrap.appendChild(b);
    });
    quiz.answered = false;
  }

  function answer(btn, opt, correct) {
    if (quiz.answered) return;
    quiz.answered = true;
    const correctText = correct.english;
    const isRight = opt.english === correctText;
    document.querySelectorAll(".quiz-option").forEach((b) => {
      b.disabled = true;
      if (b.textContent === correctText) b.classList.add("is-correct"); // green = the right answer
    });
    if (!isRight) btn.classList.add("is-wrong"); // red = your wrong pick
    if (isRight) quiz.score++;

    const next = $("#quiz-next");
    next.hidden = false;
    next.onclick = () => {
      if (quiz.i < QUIZ_LEN - 1) { quiz.i++; renderQuestion(); }
      else renderResult();
    };
  }

  function renderResult() {
    const best = Math.max(bestScore(), quiz.score);
    localStorage.setItem(BEST_KEY, String(best));
    const pct = quiz.score / QUIZ_LEN;
    const note = pct === 1 ? "Perfect — MashaAllah!" : pct >= 0.7 ? "Beautifully done." : pct >= 0.4 ? "Good effort — keep going." : "A lovely start — try again.";
    $("#quiz").innerHTML = `
      <div class="quiz-card" id="quiz-result-card">
        <p class="quiz-eyebrow">My Score · 99 Beautiful Names of Allah</p>
        <div class="quiz-score">${quiz.score}<span>/${QUIZ_LEN}</span></div>
        <p class="quiz-lead">${note}</p>
        <p class="quiz-best">Your best: <strong>${best}/${QUIZ_LEN}</strong></p>
        <div class="dl-foot quiz-stamp">
          <span class="dl-date">${dateTimeForCard()}</span>
          <span class="dl-brand">${REMINDER_LINE}</span>
        </div>
        <div class="quiz-actions">
          <button class="quiz-primary" id="quiz-again" type="button">Play again</button>
          <button class="dl-btn" id="quiz-share" type="button">${canShareFiles ? "↑ Share score" : "↗ Share score"}</button>
          <button class="dl-btn" id="quiz-download" type="button">↓ Download</button>
        </div>
      </div>`;
    $("#quiz-again").onclick = beginQuiz;
    $("#quiz-share").onclick = () => exportQuizResult(false);
    $("#quiz-download").onclick = () => exportQuizResult(true);
  }

  async function exportQuizResult(forceDownload) {
    if (typeof html2canvas !== "function") return notReady();
    const blob = await renderCardCanvas("#quiz-result-card", null);
    await deliver(blob, "my-99-names-quiz-score.png",
      `I scored ${quiz.score}/${QUIZ_LEN} on the 99 Beautiful Names of Allah quiz! ${REMINDER_LINE}`,
      forceDownload);
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
    if (!onNames) renderQuizHome();
  }

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark", dark);
    const btn = $("#theme-toggle");
    if (btn) btn.textContent = dark ? "◐  Light mode" : "◐  Dark mode";
  }
  function initTheme() {
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
    $("#theme-toggle").addEventListener("click", () => {
      const next = document.body.classList.contains("dark") ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* ---------- Init ---------- */
  function init() {
    initTheme();
    renderDate();
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

  window.AsmaApp = { NAMES, refHtml };
  document.addEventListener("DOMContentLoaded", init);
})();

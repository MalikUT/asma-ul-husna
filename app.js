/* =========================================================
   app.js — 99 Beautiful Names of Allah
   - "Name of the day" (same for everyone, changes daily)
   - Hero + grid of all 99 + detail popup
   - "Learned" tracking (saved on this device via localStorage)
   - Download a name card as a PNG image (date + AClan brand stamped on)
   - Flash quiz: match the Arabic name to its English meaning
   Data comes from data.js (the NAMES array).
   ========================================================= */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const LEARNED_KEY = "asma_learned_v1";
  const BEST_KEY = "asma_quiz_best_v1";

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
    // Islamic formatter already includes the era ("AH").
    $("#topdate").textContent = hijri ? `${greg}  ·  ${hijri} (Pakistan)` : greg;
  }
  // Compact date stamped onto downloaded cards
  function dateForCard() {
    const greg = fmtGreg({ day: "numeric", month: "long", year: "numeric" });
    const hijri = fmtHijri({ day: "numeric", month: "long", year: "numeric" });
    return hijri ? `${hijri}  ·  ${greg}` : greg;
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

    $("#hero-download").onclick = () => downloadCard("#hero", todayName);
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
  let modalName = null;
  function openModal(name) {
    modalName = name;
    $("#modal-index").textContent    = `Name ${name.id} of 99`;
    $("#modal-arabic").textContent   = name.arabic;
    $("#modal-translit").textContent = name.translit;
    $("#modal-english").textContent  = name.english;
    $("#modal-urdu").textContent     = name.urdu;
    $("#modal-ref").innerHTML        = refHtml(name);

    const btn = $("#modal-learn");
    setLearnBtn(btn, name.id);
    btn.onclick = () => { toggleLearned(name.id); setLearnBtn(btn, name.id); };
    $("#modal-download").onclick = () => downloadCard("#modal-card", name);

    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#modal").hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- Download a card as a PNG ---------- */
  function downloadCard(rootSel, name) {
    if (typeof html2canvas !== "function") {
      alert("The image tool is still loading — please try again in a second.");
      return;
    }
    const node = $(rootSel);
    html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      onclone: (doc) => {
        const clone = doc.querySelector(rootSel);
        clone.querySelectorAll(".hero-actions, .modal-actions, .modal-close").forEach((el) => (el.style.display = "none"));
        const foot = doc.createElement("div");
        foot.className = "dl-foot";
        foot.innerHTML =
          `<span class="dl-num">Name ${name.id} of 99</span>` +
          `<span class="dl-date">${dateForCard()}</span>` +
          `<span class="dl-brand">For daily name reminders, visit theone.aclanglobal.com</span>`;
        clone.appendChild(foot);
      },
    }).then((canvas) => {
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${name.translit.replace(/[^\w-]/g, "")}-name-${name.id}-of-99.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    }).catch(() => alert("Sorry — couldn't create the image. Please try again."));
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

  // Opening the Quiz tab shows the intro screen (does not auto-start).
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
    const buttons = [...document.querySelectorAll(".quiz-option")];
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.textContent === correctText) b.classList.add("is-correct");
    });
    if (opt.english === correctText) quiz.score++;
    else btn.classList.add("is-wrong");
    $("#quiz-next").hidden = false;
    $("#quiz-next").onclick = () => {
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
      <div class="quiz-card">
        <p class="quiz-eyebrow">Result</p>
        <div class="quiz-score">${quiz.score}<span>/${QUIZ_LEN}</span></div>
        <p class="quiz-lead">${note}</p>
        <p class="quiz-best">Your best: <strong>${best}/${QUIZ_LEN}</strong></p>
        <button class="quiz-primary" id="quiz-again" type="button">Play again</button>
      </div>`;
    $("#quiz-again").onclick = beginQuiz;
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

  /* ---------- Init ---------- */
  function init() {
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

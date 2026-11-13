import {
  PILLARS_DATA,
  PROOFS_DATA,
  QUIZ_DATA,
  CHECKLIST_DATA,
  MISTAKES_DATA
} from './pillars-data.js';
import { TRANSLATIONS } from './i18n.js';

const STORAGE_KEY = 'anubisland_arkan_state_v1';

let state = {
  lang: 'ar',
  theme: 'light',
  fontFamily: "'Cairo', sans-serif",
  fontSize: '16px',
  activeView: 'home',
  activePillarId: 'shahada',
  studiedPillars: [],
  checkedItems: [],
  bestQuizScore: 0
};

let quizState = {
  index: 0,
  score: 0,
  answered: false,
  selectedIdx: null,
  finished: false
};

const el = (id) => document.getElementById(id);

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (_) {}
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el('btnTheme').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

function applyTypography() {
  document.documentElement.style.setProperty('--app-font', state.fontFamily);
  document.documentElement.style.setProperty('--base-font-size', state.fontSize);
  if (el('fontSelect')) el('fontSelect').value = state.fontFamily;
  if (el('fontSizeSelect')) el('fontSizeSelect').value = state.fontSize;
}

function applyLanguage() {
  const t = TRANSLATIONS[state.lang];
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = state.lang === 'ar'
    ? 'أركان الإسلام | AnubisLand'
    : 'Pillars of Islam | AnubisLand';
  el('btnLang').textContent = state.lang === 'ar' ? '🌐 EN' : '🌐 عربي';

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (t[key]) node.textContent = t[key];
  });

  const searchInput = el('proofSearch');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  renderKPIs();
  renderPillarsOverview();
  renderStudyView();
  renderProofsFilterOptions();
  renderProofs();
  renderQuiz();
  renderPractice();
}

function switchView(viewName) {
  state.activeView = viewName;
  saveState();
  document.querySelectorAll('.nav-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  document.querySelectorAll('.app-view').forEach((view) => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });
}

function renderKPIs() {
  el('kpiStudied').textContent = `${state.studiedPillars.length} / 5`;
  el('kpiBestScore').textContent = `${state.bestQuizScore} / ${QUIZ_DATA.length}`;
  el('kpiChecklist').textContent = `${state.checkedItems.length} / ${CHECKLIST_DATA.length}`;
}

function renderPillarsOverview() {
  const t = TRANSLATIONS[state.lang];
  const grid = el('pillarsOverviewGrid');
  grid.innerHTML = PILLARS_DATA.map((p) => {
    const isStudied = state.studiedPillars.includes(p.id);
    const title = state.lang === 'ar' ? p.titleAr : p.titleEn;
    const desc = state.lang === 'ar' ? p.shortAr : p.shortEn;
    return `
      <article class="pillar-card" style="--pillar-color: ${p.color}" data-pillar-id="${p.id}">
        <div class="pillar-top">
          <span class="pillar-num">${p.number}</span>
          <span class="pillar-icon">${p.icon}</span>
        </div>
        <h4>${title}</h4>
        <p>${desc}</p>
        <div class="pillar-footer">
          <span>${t.openPillar}</span>
          ${isStudied ? `<span class="studied-badge">${t.studiedText}</span>` : ''}
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.pillar-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.activePillarId = card.dataset.pillarId;
      saveState();
      renderStudyView();
      switchView('study');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderStudyView() {
  const t = TRANSLATIONS[state.lang];
  const tabsEl = el('studyTabs');
  tabsEl.innerHTML = PILLARS_DATA.map((p) => `
    <button type="button" class="study-tab ${p.id === state.activePillarId ? 'active' : ''}" data-pillar-id="${p.id}">
      <span>${p.icon}</span>
      <span>${state.lang === 'ar' ? p.titleAr : p.titleEn}</span>
    </button>
  `).join('');

  tabsEl.querySelectorAll('.study-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activePillarId = btn.dataset.pillarId;
      saveState();
      renderStudyView();
    });
  });

  const pillar = PILLARS_DATA.find((p) => p.id === state.activePillarId) || PILLARS_DATA[0];
  const isStudied = state.studiedPillars.includes(pillar.id);

  el('studyBanner').innerHTML = `
    <div class="study-banner-head">
      <div>
        <h2>${pillar.icon} ${state.lang === 'ar' ? pillar.titleAr : pillar.titleEn}</h2>
        <p>${state.lang === 'ar' ? pillar.bannerDescAr : pillar.bannerDescEn}</p>
      </div>
      <button type="button" id="btnToggleStudied" class="${isStudied ? 'btn-gold' : 'btn-primary'}">
        ${isStudied ? t.markedStudied : t.markStudied}
      </button>
    </div>
  `;

  el('btnToggleStudied').addEventListener('click', () => {
    if (state.studiedPillars.includes(pillar.id)) {
      state.studiedPillars = state.studiedPillars.filter((id) => id !== pillar.id);
    } else {
      state.studiedPillars.push(pillar.id);
    }
    saveState();
    renderKPIs();
    renderPillarsOverview();
    renderStudyView();
  });

  el('studySectionsGrid').innerHTML = pillar.sections.map((sec) => `
    <section class="study-card">
      <h4>📌 ${state.lang === 'ar' ? sec.titleAr : sec.titleEn}</h4>
      <ul class="study-list">
        ${sec.items.map((item) => `
          <li>
            <strong>${state.lang === 'ar' ? item.headAr : item.headEn}</strong>
            <span>${state.lang === 'ar' ? item.bodyAr : item.bodyEn}</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');
}

function renderProofsFilterOptions() {
  const t = TRANSLATIONS[state.lang];
  const pillarSelect = el('proofPillarFilter');
  const currentPillar = pillarSelect.value || 'all';
  pillarSelect.innerHTML = `<option value="all">${t.allPillars}</option>` +
    PILLARS_DATA.map((p) => `<option value="${p.id}">${state.lang === 'ar' ? p.titleAr : p.titleEn}</option>`).join('');
  pillarSelect.value = currentPillar;

  const typeSelect = el('proofTypeFilter');
  const currentType = typeSelect.value || 'all';
  typeSelect.innerHTML = `
    <option value="all">${t.allTypes}</option>
    <option value="quran">${t.typeQuran}</option>
    <option value="sunnah">${t.typeSunnah}</option>
  `;
  typeSelect.value = currentType;
}

function renderProofs() {
  const t = TRANSLATIONS[state.lang];
  const query = (el('proofSearch')?.value || '').trim().toLowerCase();
  const pillarFilter = el('proofPillarFilter')?.value || 'all';
  const typeFilter = el('proofTypeFilter')?.value || 'all';

  const filtered = PROOFS_DATA.filter((item) => {
    if (pillarFilter !== 'all' && item.pillar !== pillarFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (!query) return true;
    const haystack = `${item.textAr} ${item.textEn} ${item.sourceAr} ${item.sourceEn} ${item.benefitAr} ${item.benefitEn}`.toLowerCase();
    return haystack.includes(query);
  });

  const grid = el('proofsGrid');
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="study-card"><p>${t.noProofsFound}</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((item) => {
    const pillar = PILLARS_DATA.find((p) => p.id === item.pillar);
    const typeLabel = item.type === 'quran' ? t.typeQuran : t.typeSunnah;
    const pillarLabel = pillar ? (state.lang === 'ar' ? pillar.titleAr : pillar.titleEn) : '';
    return `
      <article class="proof-card">
        <div class="proof-meta">
          <span class="proof-type-badge">${typeLabel}</span>
          <span class="proof-pillar-badge">${pillarLabel}</span>
        </div>
        <div class="proof-text">${state.lang === 'ar' ? item.textAr : item.textEn}</div>
        <div class="proof-source">📚 ${state.lang === 'ar' ? item.sourceAr : item.sourceEn}</div>
        <p class="proof-benefit">${state.lang === 'ar' ? item.benefitAr : item.benefitEn}</p>
      </article>
    `;
  }).join('');
}

function renderQuiz() {
  const t = TRANSLATIONS[state.lang];
  const box = el('quizContainer');

  if (quizState.finished) {
    const pct = Math.round((quizState.score / QUIZ_DATA.length) * 100);
    box.innerHTML = `
      <div style="text-align:center; padding: 16px 0;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
        <h3>${t.quizScoreTitle}: ${quizState.score} / ${QUIZ_DATA.length} (${pct}%)</h3>
        <div class="quiz-progress-bar" style="max-width:420px; margin: 16px auto;">
          <div class="quiz-progress-fill" style="width:${pct}%"></div>
        </div>
        <button type="button" id="btnRestartQuiz" class="btn-primary">${t.quizRestart}</button>
      </div>
    `;
    el('btnRestartQuiz').addEventListener('click', () => {
      quizState = { index: 0, score: 0, answered: false, selectedIdx: null, finished: false };
      renderQuiz();
    });
    return;
  }

  const q = QUIZ_DATA[quizState.index];
  const progressPct = Math.round(((quizState.index + (quizState.answered ? 1 : 0)) / QUIZ_DATA.length) * 100);
  const opts = state.lang === 'ar' ? q.optsAr : q.optsEn;

  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <strong>${state.lang === 'ar' ? `السؤال ${quizState.index + 1} من ${QUIZ_DATA.length}` : `Question ${quizState.index + 1} of ${QUIZ_DATA.length}`}</strong>
      <span>${state.lang === 'ar' ? `النقاط: ${quizState.score}` : `Score: ${quizState.score}`}</span>
    </div>
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" style="width:${progressPct}%"></div>
    </div>
    <div class="quiz-question">${state.lang === 'ar' ? q.qAr : q.qEn}</div>
    <div class="quiz-options">
      ${opts.map((opt, idx) => {
        let cls = 'quiz-option';
        if (quizState.answered) {
          if (idx === q.correct) cls += ' correct';
          else if (idx === quizState.selectedIdx) cls += ' wrong';
        }
        return `<button type="button" class="${cls}" data-idx="${idx}" ${quizState.answered ? 'disabled' : ''}>${opt}</button>`;
      }).join('')}
    </div>
    ${quizState.answered ? `
      <div class="quiz-explanation">
        <strong>💡 ${state.lang === 'ar' ? 'التوضيح العلمي:' : 'Explanation:'}</strong>
        <span>${state.lang === 'ar' ? q.expAr : q.expEn}</span>
      </div>
    ` : ''}
    <div class="quiz-controls">
      <button type="button" id="btnQuizReset" class="btn-outline">${t.quizRestart}</button>
      ${quizState.answered ? `
        <button type="button" id="btnQuizNext" class="btn-primary">
          ${quizState.index + 1 < QUIZ_DATA.length ? t.quizNext : t.quizFinish}
        </button>
      ` : ''}
    </div>
  `;

  box.querySelectorAll('.quiz-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (quizState.answered) return;
      const idx = Number(btn.dataset.idx);
      quizState.selectedIdx = idx;
      quizState.answered = true;
      if (idx === q.correct) {
        quizState.score += 1;
        if (quizState.score > state.bestQuizScore) {
          state.bestQuizScore = quizState.score;
          saveState();
          renderKPIs();
        }
      }
      renderQuiz();
    });
  });

  el('btnQuizReset').addEventListener('click', () => {
    quizState = { index: 0, score: 0, answered: false, selectedIdx: null, finished: false };
    renderQuiz();
  });

  if (el('btnQuizNext')) {
    el('btnQuizNext').addEventListener('click', () => {
      if (quizState.index + 1 < QUIZ_DATA.length) {
        quizState.index += 1;
        quizState.answered = false;
        quizState.selectedIdx = null;
      } else {
        quizState.finished = true;
      }
      renderQuiz();
    });
  }
}

function renderPractice() {
  const checklistEl = el('checklistGrid');
  checklistEl.innerHTML = CHECKLIST_DATA.map((item) => {
    const checked = state.checkedItems.includes(item.id);
    return `
      <label class="check-item">
        <input type="checkbox" data-check-id="${item.id}" ${checked ? 'checked' : ''} />
        <span>${state.lang === 'ar' ? item.ar : item.en}</span>
      </label>
    `;
  }).join('');

  checklistEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.checkId;
      if (cb.checked && !state.checkedItems.includes(id)) {
        state.checkedItems.push(id);
      } else if (!cb.checked) {
        state.checkedItems = state.checkedItems.filter((x) => x !== id);
      }
      saveState();
      renderKPIs();
    });
  });

  el('mistakesGrid').innerHTML = MISTAKES_DATA.map((m) => `
    <article class="mistake-card">
      <div class="mistake-wrong">❌ ${state.lang === 'ar' ? m.wrongAr : m.wrongEn}</div>
      <div class="mistake-right">✅ ${state.lang === 'ar' ? m.rightAr : m.rightEn}</div>
    </article>
  `).join('');
}

let deferredPrompt = null;
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    el('btnInstallPWA')?.classList.remove('hidden');
  });
  el('btnInstallPWA')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    el('btnInstallPWA')?.classList.add('hidden');
  });
}

function initEvents() {
  document.querySelectorAll('.nav-pill').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  el('btnHeroStudy')?.addEventListener('click', () => switchView('study'));
  el('btnHeroQuiz')?.addEventListener('click', () => switchView('quiz'));

  el('btnLang').addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    saveState();
    applyLanguage();
  });

  el('btnTheme').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    saveState();
    applyTheme();
  });

  el('fontSelect').addEventListener('change', (e) => {
    state.fontFamily = e.target.value;
    saveState();
    applyTypography();
  });

  el('fontSizeSelect').addEventListener('change', (e) => {
    state.fontSize = e.target.value;
    saveState();
    applyTypography();
  });

  el('proofSearch').addEventListener('input', renderProofs);
  el('proofPillarFilter').addEventListener('change', renderProofs);
  el('proofTypeFilter').addEventListener('change', renderProofs);
}

function boot() {
  loadState();
  applyTheme();
  applyTypography();
  initEvents();
  applyLanguage();
  switchView(state.activeView || 'home');
  initPWA();
}

document.addEventListener('DOMContentLoaded', boot);

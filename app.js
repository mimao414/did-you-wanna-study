/**
 * 數位科技概論（上）題庫與解題學習平台
 * 專屬建置：資處科一仁 鍾百越 同學
 */

// Application State
const state = {
  activeTab: 'all',          // 'all', 'quiz', 'exercise', 'concepts', 'bookmarks', 'mock_exam'
  chapterFilter: 0,          // 0 = all, 3, 4, 5, 6
  typeFilter: 'all',         // 'all', 'choice', 'fill', 'multi', 'sheet', 'puzzle'
  searchQuery: '',
  mode: 'study',             // 'study' (學習解析模式) | 'exam' (刷題測驗模式)
  expandAllSol: false,
  bookmarks: new Set(),
  examAnswers: {},           // qid -> userSelectedOption
  mockExamSet: [],           // array of questions for mock test
  mockExamActive: false,
  mockExamScore: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadBookmarks();
  initTheme();
  setupEventListeners();
  renderStats();
  renderApp();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('app_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('app_theme', target);
  updateThemeIcon(target);
  showToast(`已切換為 ${target === 'dark' ? '🌙 深色模式' : '☀️ 明亮模式'}`);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

// Bookmarks (LocalStorage)
function loadBookmarks() {
  try {
    const raw = localStorage.getItem('bm_by_questions');
    if (raw) state.bookmarks = new Set(JSON.parse(raw));
  } catch (e) {
    state.bookmarks = new Set();
  }
}

function saveBookmarks() {
  try {
    localStorage.setItem('bm_by_questions', JSON.stringify([...state.bookmarks]));
  } catch (e) {}
}

function toggleBookmark(id) {
  if (state.bookmarks.has(id)) {
    state.bookmarks.delete(id);
    showToast('已從錯題本/收藏中移除');
  } else {
    state.bookmarks.add(id);
    showToast('⭐ 已加入錯題本/重點收藏！');
  }
  saveBookmarks();
  renderStats();
  // If in bookmarks tab, re-render
  if (state.activeTab === 'bookmarks') {
    renderApp();
  } else {
    // update card star UI
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.classList.toggle('bookmarked', state.bookmarks.has(id));
      const starBtn = card.querySelector('.btn-star');
      if (starBtn) {
        starBtn.classList.toggle('active', state.bookmarks.has(id));
        starBtn.innerHTML = state.bookmarks.has(id) ? '★' : '☆';
      }
    }
  }
}

// Toast Notification
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

// Stats & Banner
function renderStats() {
  const total = window.ALL_QUESTIONS ? window.ALL_QUESTIONS.length : 0;
  const quizCount = window.ALL_QUESTIONS ? window.ALL_QUESTIONS.filter(q => q.category === 'quiz').length : 0;
  const exCount = window.ALL_QUESTIONS ? window.ALL_QUESTIONS.filter(q => q.category === 'exercise').length : 0;
  const bmCount = state.bookmarks.size;

  const statTotal = document.getElementById('stat-total');
  const statQuiz = document.getElementById('stat-quiz');
  const statEx = document.getElementById('stat-ex');
  const statBm = document.getElementById('stat-bm');

  if (statTotal) statTotal.textContent = total;
  if (statQuiz) statQuiz.textContent = quizCount;
  if (statEx) statEx.textContent = exCount;
  if (statBm) statBm.textContent = bmCount;
}

// Main Render Function
function renderApp() {
  const container = document.getElementById('main-container');
  if (!container) return;

  if (state.activeTab === 'concepts') {
    renderConceptCards(container);
    return;
  }

  if (state.activeTab === 'mock_exam') {
    renderMockExamView(container);
    return;
  }

  // Filter Questions
  let filtered = [...window.ALL_QUESTIONS];

  // Tab filter
  if (state.activeTab === 'quiz') {
    filtered = filtered.filter(q => q.category === 'quiz');
  } else if (state.activeTab === 'exercise') {
    filtered = filtered.filter(q => q.category === 'exercise');
  } else if (state.activeTab === 'bookmarks') {
    filtered = filtered.filter(q => state.bookmarks.has(q.id));
  }

  // Chapter filter
  if (state.chapterFilter > 0) {
    filtered = filtered.filter(q => q.chapter_num === state.chapterFilter);
  }

  // Type filter
  if (state.typeFilter !== 'all') {
    filtered = filtered.filter(q => q.type === state.typeFilter);
  }

  // Search filter
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      const qText = (item.question || item.title || '').toLowerCase();
      const concept = (item.key_concept || '').toLowerCase();
      const step = (item.step_by_step || '').toLowerCase();
      const opts = item.options ? Object.values(item.options).join(' ').toLowerCase() : '';
      return qText.includes(q) || concept.includes(q) || step.includes(q) || opts.includes(q);
    });
  }

  // Render question cards
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>沒有找到符合條件的題目</h3>
        <p>請嘗試清除搜尋關鍵字或調整篩選條件。</p>
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="resetFilters()">重設篩選條件</button>
      </div>
    `;
    return;
  }

  const cardsHtml = filtered.map(q => renderQuestionCard(q)).join('');
  container.innerHTML = `
    <div style="margin-bottom: 0.8rem; font-size: 0.88rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
      <span>共篩選出 <strong>${filtered.length}</strong> 道題目</span>
      ${state.mode === 'exam' ? '<span style="color: var(--warning); font-weight: 700;">✍️ 目前處於刷題測驗模式：請點選選項進行自我測驗！</span>' : ''}
    </div>
    <div class="questions-grid">
      ${cardsHtml}
    </div>
  `;
}

// Render Individual Question Card
function renderQuestionCard(q) {
  const isBm = state.bookmarks.has(q.id);
  const isChoice = q.type === 'choice';
  const showSol = state.mode === 'study' || state.expandAllSol || (state.examAnswers[q.id] !== undefined);

  // Highlighting
  const highlight = (text) => {
    if (!text) return '';
    if (!state.searchQuery.trim()) return text;
    const reg = new RegExp(`(${escapeRegex(state.searchQuery)})`, 'gi');
    return text.replace(reg, '<mark style="background: #fef08a; color: #000; padding: 0 2px; border-radius: 2px;">$1</mark>');
  };

  // Build Options if choice
  let optionsHtml = '';
  if (isChoice && q.options) {
    const userChoice = state.examAnswers[q.id];
    const optsEntries = Object.entries(q.options);
    const gridClass = optsEntries.length > 2 ? 'options-grid-2' : '';

    optionsHtml = `
      <div class="options-list ${gridClass}">
        ${optsEntries.map(([letter, text]) => {
          let optClass = 'opt-item';
          const isSelected = userChoice === letter;
          const isCorrect = q.answer === letter;

          if (state.mode === 'exam' && userChoice !== undefined) {
            if (isCorrect) optClass += ' correct';
            else if (isSelected && !isCorrect) optClass += ' wrong';
          } else if (state.mode === 'study' && isCorrect) {
            optClass += ' correct';
          }

          return `
            <div class="${optClass}" onclick="handleOptionSelect('${q.id}', '${letter}')">
              <span class="opt-key">${letter}</span>
              <span class="opt-text">${highlight(text)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Non-choice specific rendering
  let nonChoiceExtraHtml = '';
  if (q.type === 'fill' && q.table_data) {
    nonChoiceExtraHtml = `
      <table class="fill-table">
        <thead>
          <tr>
            ${Object.keys(q.table_data[0]).map(k => `<th>${k.toUpperCase()}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${q.table_data.map(row => `
            <tr>
              ${Object.values(row).map(val => `<td>${val.includes('【') ? `<span class="fill-highlight">${val}</span>` : val}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (q.type === 'multi' && q.motherboard_img) {
    nonChoiceExtraHtml = `
      <div class="diagram-preview">
        <img src="${q.motherboard_img}" alt="主機板插槽圖解" onclick="openLightbox('${q.motherboard_img}', '主機板插槽與組件對照圖')">
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.4rem;">點擊圖片可放大查看主機板插槽細節</p>
      </div>
      <div class="fill-table-wrap">
        <table class="fill-table">
          <thead><tr><th>插槽代號</th><th>對應組件名稱</th><th>插槽規格說明</th></tr></thead>
          <tbody>
            ${q.mappings ? q.mappings.map(m => `
              <tr>
                <td><strong>插槽 ${m.slot}</strong></td>
                <td><span class="fill-highlight">${m.code}、${m.name}</span></td>
                <td>${m.target}</td>
              </tr>
            `).join('') : ''}
          </tbody>
        </table>
      </div>
    `;
  } else if (q.type === 'multi' && q.taskmgr_img) {
    nonChoiceExtraHtml = `
      <div class="diagram-preview">
        <img src="${q.taskmgr_img}" alt="工作管理員畫面" onclick="openLightbox('${q.taskmgr_img}', '工作管理員效能與程序判讀')">
      </div>
      <div style="margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.4rem;">
        ${q.questions ? q.questions.map(item => `
          <div style="background: var(--bg-main); padding: 0.6rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent);">
            <div style="font-weight: 700; font-size: 0.9rem;">${item.q}</div>
            <div style="color: var(--accent); font-weight: 800; margin-top: 0.2rem;">👉 答案：${item.ans}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem;">💡 判讀技巧：${item.how}</div>
          </div>
        `).join('') : ''}
      </div>
    `;
  } else if (q.type === 'puzzle') {
    nonChoiceExtraHtml = `
      <div class="diagram-preview">
        <img src="${q.puzzle_img}" alt="填字遊戲題目" onclick="openLightbox('${q.puzzle_img}', '填字遊戲原始題目')">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem;">
        <div style="background: var(--bg-main); padding: 0.75rem; border-radius: var(--radius-sm);">
          <h4 style="color: var(--primary); font-size: 0.9rem; margin-bottom: 0.4rem;">橫向題目解答</h4>
          ${q.horizontal_clues.map(c => `
            <div style="font-size: 0.82rem; margin-bottom: 0.35rem;">
              <strong>${c.num}. ${c.clue}：</strong> <span class="fill-highlight">${c.answer}</span>
            </div>
          `).join('')}
        </div>
        <div style="background: var(--bg-main); padding: 0.75rem; border-radius: var(--radius-sm);">
          <h4 style="color: var(--secondary); font-size: 0.9rem; margin-bottom: 0.4rem;">直向題目解答</h4>
          ${q.vertical_clues.map(c => `
            <div style="font-size: 0.82rem; margin-bottom: 0.35rem;">
              <strong>${c.num}、${c.clue}：</strong> <span class="fill-highlight">${c.answer}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Solution Box HTML
  const solutionBoxHtml = `
    <div class="solution-box ${showSol ? 'open' : ''}" id="sol-${q.id}">
      ${q.answer ? `<div class="answer-banner"><span>✓ 正確解答：</span><span style="font-size: 1.1rem; color: var(--accent);">(${q.answer})</span></div>` : ''}

      <div class="sol-section">
        <div class="sol-heading">💡【核心關鍵概念】</div>
        <div class="sol-content">${highlight(q.key_concept || '本題考查核心資訊科技概念')}</div>
      </div>

      <div class="sol-section">
        <div class="sol-heading">🔍【詳細解題思維脈絡】</div>
        <div class="sol-content">${highlight(q.step_by_step || '依照題意進行觀念分析與排除。')}</div>
      </div>

      ${q.option_analysis && Object.keys(q.option_analysis).length > 0 ? `
        <div class="sol-section">
          <div class="sol-heading">⚖️【各選項逐一深度剖析】</div>
          <div class="options-breakdown">
            ${Object.entries(q.option_analysis).map(([opt, desc]) => `
              <div class="opt-analysis-item">
                <strong>選項 (${opt})：</strong> ${highlight(desc)}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${q.exam_tip ? `
        <div class="exam-tip-box">
          <span>🎯【資處科考點小撇步】：</span>
          <span>${highlight(q.exam_tip)}</span>
        </div>
      ` : ''}

      ${q.official_explanation ? `
        <div style="margin-top: 0.6rem; font-size: 0.82rem; color: var(--text-muted); background: var(--bg-card); padding: 0.4rem 0.6rem; border-radius: 4px; border: 1px solid var(--border);">
          <strong>📜 試卷官方精解：</strong> ${highlight(q.official_explanation)}
        </div>
      ` : ''}
    </div>
  `;

  return `
    <div class="q-card ${isBm ? 'bookmarked' : ''}" id="card-${q.id}">
      <div class="q-header">
        <div class="q-meta">
          <span class="badge badge-source">${q.category_name || (q.category === 'quiz' ? '隨堂測驗卷' : '課堂習作本')}</span>
          <span class="badge badge-chap">${q.round_name || q.chapter_name}</span>
          <span class="badge badge-type">${q.type_name || '選擇題'}</span>
          ${q.is_advanced ? '<span class="badge badge-star">★進階精解</span>' : ''}
          ${q.page ? `<span class="badge" style="background: var(--bg-main); color: var(--text-muted);">原卷 P.${q.page}</span>` : ''}
        </div>
        <div class="q-tools">
          ${q.page_img ? `
            <button class="btn btn-sm" onclick="openLightbox('${q.page_img}', '${q.category_name} - 原卷第 ${q.page} 頁對照')">
              🖼️ 查看原卷
            </button>
          ` : ''}
          <button class="btn-star ${isBm ? 'active' : ''}" onclick="toggleBookmark('${q.id}')" title="加入錯題本/收藏">
            ${isBm ? '★' : '☆'}
          </button>
        </div>
      </div>

      <div class="q-title">
        <span class="q-num">${q.q_num ? `${q.q_num}.` : ''}</span>
        <span>${highlight(q.question || q.title || '')}</span>
      </div>

      ${optionsHtml}
      ${nonChoiceExtraHtml}

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="toggle-sol-btn" onclick="toggleSolution('${q.id}')">
          <span id="btn-text-${q.id}">${showSol ? '▲ 隱藏解題過程與觀念' : '▼ 查看詳細解題過程與觀念'}</span>
        </button>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${(q.tags || []).map(t => `#${t}`).join(' ')}</span>
      </div>

      ${solutionBoxHtml}
    </div>
  `;
}

// Option Click in Exam Mode
function handleOptionSelect(qid, letter) {
  if (state.mode !== 'exam') return;

  state.examAnswers[qid] = letter;

  const q = window.ALL_QUESTIONS.find(item => item.id === qid);
  if (!q) return;

  const isCorrect = q.answer === letter;
  if (isCorrect) {
    showToast('🎉 答對了！觀念很清晰！');
  } else {
    showToast(`❌ 答錯囉！正確答案是 (${q.answer})，已為您加入錯題本`);
    state.bookmarks.add(qid);
    saveBookmarks();
    renderStats();
  }

  // Auto open solution
  const solBox = document.getElementById(`sol-${qid}`);
  if (solBox) solBox.classList.add('open');
  const btnText = document.getElementById(`btn-text-${qid}`);
  if (btnText) btnText.textContent = '▲ 隱藏解題過程與觀念';

  // Re-render card options UI
  const card = document.getElementById(`card-${qid}`);
  if (card) {
    const optItems = card.querySelectorAll('.opt-item');
    optItems.forEach(item => {
      const keySpan = item.querySelector('.opt-key');
      if (!keySpan) return;
      const key = keySpan.textContent.trim();
      item.classList.remove('selected', 'correct', 'wrong');
      if (key === q.answer) {
        item.classList.add('correct');
      } else if (key === letter && !isCorrect) {
        item.classList.add('wrong');
      }
    });
  }
}

// Toggle Solution Box
function toggleSolution(qid) {
  const box = document.getElementById(`sol-${qid}`);
  const btnText = document.getElementById(`btn-text-${qid}`);
  if (!box) return;

  const isOpen = box.classList.contains('open');
  if (isOpen) {
    box.classList.remove('open');
    if (btnText) btnText.textContent = '▼ 查看詳細解題過程與觀念';
  } else {
    box.classList.add('open');
    if (btnText) btnText.textContent = '▲ 隱藏解題過程與觀念';
  }
}

// Toggle All Solutions
function toggleAllSolutions() {
  state.expandAllSol = !state.expandAllSol;
  const btn = document.getElementById('toggle-all-sol-btn');
  if (btn) btn.innerHTML = state.expandAllSol ? '🙈 摺疊全部解析' : '👁️ 展開全部解析';
  renderApp();
}

// Lightbox Modal for Original Page Scans
function openLightbox(imgSrc, title) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  if (!modal || !img) return;

  img.src = imgSrc;
  if (titleEl) titleEl.textContent = title || '原始試卷對照';
  modal.classList.add('open');
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.remove('open');
}

// Concept Cards View
function renderConceptCards(container) {
  const summary = window.CHAPTER_SUMMARY;
  if (!summary) return;

  const html = `
    <div style="margin-bottom: 1.25rem;">
      <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.3rem;">💡 數位科技概論（上）核心考點速記寶典</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">針對資處科高一段考與升學統測提煉的四大章節考點精華，考前必讀！</p>
    </div>
    <div class="concept-grid">
      ${Object.values(summary).map(ch => `
        <div class="concept-card">
          <div class="concept-card-title">📘 ${ch.title}</div>
          <div class="concept-list">
            ${ch.highlights.map(h => `
              <div class="concept-point">
                <div class="concept-point-title">📌 ${h.title}</div>
                <div class="concept-point-desc">${h.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

// Mock Exam Generator & View
function startMockExam() {
  // Select 25 random choice questions
  const choices = window.ALL_QUESTIONS.filter(q => q.type === 'choice');
  const shuffled = [...choices].sort(() => 0.5 - Math.random());
  state.mockExamSet = shuffled.slice(0, 25);
  state.examAnswers = {};
  state.mockExamActive = true;
  state.mockExamScore = null;
  state.activeTab = 'mock_exam';
  setActiveTabUI('mock_exam');
  renderApp();
}

function submitMockExam() {
  let correctCount = 0;
  state.mockExamSet.forEach(q => {
    if (state.examAnswers[q.id] === q.answer) {
      correctCount++;
    } else {
      state.bookmarks.add(q.id); // Add wrong questions to bookmarks
    }
  });
  saveBookmarks();
  renderStats();
  state.mockExamScore = Math.round((correctCount / state.mockExamSet.length) * 100);
  renderApp();
}

function renderMockExamView(container) {
  if (!state.mockExamSet || state.mockExamSet.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>全真隨堂模擬測驗</h3>
        <p>系統將從題庫中隨機抽出 25 題選擇題，模擬段考全真刷題環境，考完自動計分並將錯題收入錯題本！</p>
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="startMockExam()">🚀 開始 25 題模擬測驗</button>
      </div>
    `;
    return;
  }

  const answeredCount = Object.keys(state.examAnswers).length;
  const isFinished = state.mockExamScore !== null;

  container.innerHTML = `
    <div class="banner-card" style="margin-bottom: 1.5rem;">
      <div>
        <div class="banner-title">🎯 全真隨堂模擬測驗（共 25 題）</div>
        <div class="banner-desc">
          已作答：<strong>${answeredCount} / 25</strong> 題
          ${isFinished ? ` | 🏆 測驗成績：<span style="font-size: 1.5rem; color: var(--accent); font-weight: 800;">${state.mockExamScore} 分</span> (${state.mockExamScore >= 60 ? '及格' : '需再加強'})` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 0.6rem;">
        ${!isFinished ? `
          <button class="btn btn-accent" onclick="submitMockExam()" ${answeredCount < 5 ? 'disabled title=\"至少作答5題才可交卷\"' : ''}>
            📝 立即交卷算分
          </button>
        ` : ''}
        <button class="btn btn-primary" onclick="startMockExam()">
          🔄 重新抽取題目
        </button>
      </div>
    </div>
    <div class="questions-grid">
      ${state.mockExamSet.map((q, idx) => {
        // override q_num for exam
        const examQ = { ...q, q_num: idx + 1 };
        return renderQuestionCard(examQ);
      }).join('')}
    </div>
  `;
}

// Reset Filters
function resetFilters() {
  state.chapterFilter = 0;
  state.typeFilter = 'all';
  state.searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.chip-btn[data-chap="0"]')?.classList.add('active');
  document.querySelector('.chip-btn[data-type="all"]')?.classList.add('active');
  renderApp();
}

// Event Listeners
function setupEventListeners() {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = btn.dataset.tab;
      state.activeTab = tab;
      setActiveTabUI(tab);
      renderApp();
    });
  });

  // Chapter filter chips
  document.querySelectorAll('.chip-btn[data-chap]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn[data-chap]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chapterFilter = parseInt(btn.dataset.chap, 10);
      renderApp();
    });
  });

  // Type filter chips
  document.querySelectorAll('.chip-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn[data-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.typeFilter = btn.dataset.type;
      renderApp();
    });
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      showToast(`已切換為：${state.mode === 'study' ? '📖 學習解析模式' : '✍️ 線上刷題測驗模式'}`);
      renderApp();
    });
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        renderApp();
      }, 200);
    });
  }

  // Keyboard shortcut '/' to search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput?.focus();
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  });

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Toggle all solution button
  const toggleAllBtn = document.getElementById('toggle-all-sol-btn');
  if (toggleAllBtn) toggleAllBtn.addEventListener('click', toggleAllSolutions);

  // Print button
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      state.expandAllSol = true;
      renderApp();
      setTimeout(() => window.print(), 300);
    });
  }
}

function setActiveTabUI(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

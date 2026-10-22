const STORAGE_KEY = "shiguang-study-space-v1";
const THEME_KEY = "shiguang-study-space-theme";

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function isoDate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function defaultState() {
  return {
    project: {
      title: "我的学习项目",
      outcome: "用 30 天完成一个能展示、能复盘的学习成果。",
      deadline: isoDate(addDays(new Date(), 30)),
      weeklyTarget: 5,
      dailyMinutes: 25
    },
    tasks: [
      { id: makeId("task"), title: "写清楚这次学习要解决的具体问题", done: true, createdAt: new Date().toISOString() },
      { id: makeId("task"), title: "完成一次 25 分钟入门学习", done: false, createdAt: new Date().toISOString() },
      { id: makeId("task"), title: "整理 3 张关键知识卡片", done: false, createdAt: new Date().toISOString() }
    ],
    cards: [
      {
        id: makeId("card"),
        question: "学习闭环的最后一步是什么？",
        answer: "反馈。根据练习或输出的结果，检查理解偏差，再修正下一轮学习行动。",
        reviews: 0,
        lastReviewed: null,
        createdAt: new Date().toISOString()
      },
      {
        id: makeId("card"),
        question: "怎样把“我要学会某个知识”改写成可以执行的目标？",
        answer: "把它改写成可验收的成果，例如“能独立完成一个案例”“能讲清楚三个核心概念”或“产出一份作品”。",
        reviews: 0,
        lastReviewed: null,
        createdAt: new Date().toISOString()
      }
    ],
    sessions: [
      {
        id: makeId("session"),
        minutes: 25,
        note: "示例记录：梳理学习目标",
        date: isoDate(addDays(new Date(), -1)),
        createdAt: new Date().toISOString()
      }
    ],
    timer: {
      minutes: 25,
      remaining: 25 * 60
    },
    reviewQueue: [],
    currentCardId: null
  };
}

function normalizeState(candidate) {
  const base = defaultState();
  if (!candidate || typeof candidate !== "object") return base;

  const project = candidate.project && typeof candidate.project === "object" ? candidate.project : {};
  const tasks = Array.isArray(candidate.tasks)
    ? candidate.tasks.filter((task) => task && typeof task.title === "string").map((task) => ({
        id: String(task.id || makeId("task")),
        title: task.title.slice(0, 120),
        done: Boolean(task.done),
        createdAt: String(task.createdAt || new Date().toISOString())
      }))
    : base.tasks;
  const cards = Array.isArray(candidate.cards)
    ? candidate.cards
        .filter((card) => card && typeof card.question === "string" && typeof card.answer === "string")
        .map((card) => ({
          id: String(card.id || makeId("card")),
          question: card.question.slice(0, 180),
          answer: card.answer.slice(0, 600),
          reviews: Number.isFinite(Number(card.reviews)) ? Number(card.reviews) : 0,
          lastReviewed: card.lastReviewed || null,
          createdAt: String(card.createdAt || new Date().toISOString())
        }))
    : base.cards;
  const sessions = Array.isArray(candidate.sessions)
    ? candidate.sessions
        .filter((session) => session && Number.isFinite(Number(session.minutes)) && /^\d{4}-\d{2}-\d{2}$/.test(String(session.date)))
        .map((session) => ({
          id: String(session.id || makeId("session")),
          minutes: Math.max(1, Math.min(600, Number(session.minutes))),
          note: String(session.note || "").slice(0, 120),
          date: String(session.date),
          createdAt: String(session.createdAt || new Date().toISOString())
        }))
    : base.sessions;

  const minutes = Number(candidate.timer?.minutes);
  const remaining = Number(candidate.timer?.remaining);
  const safeMinutes = Number.isFinite(minutes) ? Math.max(5, Math.min(120, minutes)) : 25;

  return {
    project: {
      title: String(project.title || base.project.title).slice(0, 60),
      outcome: String(project.outcome || base.project.outcome).slice(0, 240),
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(project.deadline)) ? project.deadline : base.project.deadline,
      weeklyTarget: Math.max(1, Math.min(21, Number(project.weeklyTarget) || base.project.weeklyTarget)),
      dailyMinutes: Math.max(5, Math.min(120, Number(project.dailyMinutes) || base.project.dailyMinutes))
    },
    tasks,
    cards,
    sessions,
    timer: {
      minutes: safeMinutes,
      remaining: Number.isFinite(remaining) ? Math.max(0, Math.min(safeMinutes * 60, remaining)) : safeMinutes * 60
    },
    reviewQueue: [],
    currentCardId: null
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  } catch (error) {
    console.warn("无法读取本地学习记录，已加载初始内容。", error);
    return defaultState();
  }
}

let state = loadState();
let timerInterval = null;
let timerRunning = false;
let toastTimeout = null;
let practiceAnswerVisible = false;

const elements = {
  greeting: document.querySelector("#greeting"),
  dateLine: document.querySelector("#dateLine"),
  projectTitle: document.querySelector("#projectTitle"),
  projectOutcome: document.querySelector("#projectOutcome"),
  deadlineLabel: document.querySelector("#deadlineLabel"),
  weeklyTargetLabel: document.querySelector("#weeklyTargetLabel"),
  weeklyRing: document.querySelector("#weeklyRing"),
  weeklyProgress: document.querySelector("#weeklyProgress"),
  weeklyCount: document.querySelector("#weeklyCount"),
  weeklyGoal: document.querySelector("#weeklyGoal"),
  taskCount: document.querySelector("#taskCount"),
  taskList: document.querySelector("#taskList"),
  taskEmpty: document.querySelector("#taskEmpty"),
  taskProgressBar: document.querySelector("#taskProgressBar"),
  focusTaskSelect: document.querySelector("#focusTaskSelect"),
  focusMinutes: document.querySelector("#focusMinutes"),
  timerDisplay: document.querySelector("#timerDisplay"),
  timerProgress: document.querySelector("#timerProgress"),
  timerButton: document.querySelector("#timerButton"),
  timerHint: document.querySelector("#timerHint"),
  weekChart: document.querySelector("#weekChart"),
  streakDays: document.querySelector("#streakDays"),
  totalMinutes: document.querySelector("#totalMinutes"),
  todayMinutes: document.querySelector("#todayMinutes"),
  reviewQuestion: document.querySelector("#reviewQuestion"),
  reviewDetail: document.querySelector("#reviewDetail"),
  cardCount: document.querySelector("#cardCount"),
  practiceButton: document.querySelector("#practiceButton"),
  toast: document.querySelector("#toast"),
  projectDialog: document.querySelector("#projectDialog"),
  projectForm: document.querySelector("#projectForm"),
  sessionDialog: document.querySelector("#sessionDialog"),
  sessionForm: document.querySelector("#sessionForm"),
  cardDialog: document.querySelector("#cardDialog"),
  cardForm: document.querySelector("#cardForm"),
  reviewDialog: document.querySelector("#reviewDialog"),
  helpDialog: document.querySelector("#helpDialog"),
  flashcard: document.querySelector("#flashcard"),
  flashcardAnswer: document.querySelector("#flashcardAnswer"),
  practiceQuestion: document.querySelector("#practiceQuestion"),
  practiceAnswer: document.querySelector("#practiceAnswer"),
  reviewProgressText: document.querySelector("#reviewProgressText")
};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast("浏览器存储空间不可用，请先导出记录备份");
    console.warn("保存失败", error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  window.clearTimeout(toastTimeout);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function startOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function isSameDay(first, second) {
  return isoDate(first) === isoDate(second);
}

function getWeekSessions() {
  const weekStart = startOfWeek().getTime();
  return state.sessions.filter((session) => {
    const time = new Date(`${session.date}T12:00:00`).getTime();
    return time >= weekStart && time < weekStart + 7 * 86400000;
  });
}

function calculateStreak() {
  const dates = new Set(state.sessions.map((session) => session.date));
  const cursor = new Date();
  if (!dates.has(isoDate(cursor)) && dates.has(isoDate(addDays(cursor, -1)))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (dates.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatDeadline(value) {
  const date = new Date(`${value}T12:00:00`);
  const remaining = Math.ceil((date.getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000);
  const formatted = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  if (remaining < 0) return `${formatted} · 已超过目标日期`;
  if (remaining === 0) return `${formatted} · 就是今天`;
  return `${formatted} · 还剩 ${remaining} 天`;
}

function renderGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? "夜深了，也别忘了休息。" : hour < 12 ? "早上好，开始学习吧。" : hour < 18 ? "下午好，继续向前吧。" : "晚上好，收束今天的收获。";
  elements.greeting.textContent = greeting;
  elements.dateLine.textContent = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${DAY_NAMES[now.getDay()]} · 把想学的内容，变成一个看得见结果的项目。`;
}

function renderProject() {
  const project = state.project;
  elements.projectTitle.textContent = project.title;
  elements.projectOutcome.textContent = project.outcome;
  elements.deadlineLabel.textContent = formatDeadline(project.deadline);
  elements.weeklyTargetLabel.textContent = project.weeklyTarget;
  elements.weeklyGoal.textContent = project.weeklyTarget;
  elements.focusMinutes.textContent = state.timer.minutes;
}

function renderTasks() {
  const done = state.tasks.filter((task) => task.done).length;
  const progress = state.tasks.length ? Math.round((done / state.tasks.length) * 100) : 0;
  elements.taskCount.textContent = `${done} / ${state.tasks.length}`;
  elements.taskProgressBar.style.width = `${progress}%`;
  elements.taskEmpty.hidden = state.tasks.length > 0;

  elements.taskList.innerHTML = state.tasks
    .map(
      (task) => `
        <li class="task-item ${task.done ? "done" : ""}" data-task-id="${escapeHtml(task.id)}">
          <button class="task-check" type="button" data-action="toggle-task" aria-label="${task.done ? "标记为未完成" : "标记为完成"}">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.8"></path></svg>
          </button>
          <span class="task-title">${escapeHtml(task.title)}</span>
          <button class="task-delete" type="button" data-action="delete-task" aria-label="删除任务" title="删除任务">×</button>
        </li>`
    )
    .join("");

  const selected = elements.focusTaskSelect.value;
  const pendingTasks = state.tasks.filter((task) => !task.done);
  elements.focusTaskSelect.innerHTML = [
    '<option value="">选择一个待办任务（可选）</option>',
    ...pendingTasks.map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)}</option>`)
  ].join("");
  if (pendingTasks.some((task) => task.id === selected)) {
    elements.focusTaskSelect.value = selected;
  }
}

function renderWeeklyProgress() {
  const weekSessions = getWeekSessions();
  const target = state.project.weeklyTarget;
  const percentage = Math.min(100, Math.round((weekSessions.length / target) * 100));
  elements.weeklyCount.textContent = weekSessions.length;
  elements.weeklyProgress.textContent = `${percentage}%`;
  elements.weeklyRing.style.setProperty("--progress", `${percentage}%`);
}

function renderStats() {
  const today = isoDate();
  const total = state.sessions.reduce((sum, session) => sum + session.minutes, 0);
  const todayTotal = state.sessions
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + session.minutes, 0);
  elements.streakDays.textContent = calculateStreak();
  elements.totalMinutes.textContent = total;
  elements.todayMinutes.textContent = todayTotal;
}

function renderWeekChart() {
  const today = new Date();
  const currentWeek = startOfWeek(today);
  const totals = DAY_NAMES.map(() => 0);
  state.sessions.forEach((session) => {
    const date = new Date(`${session.date}T12:00:00`);
    if (date >= currentWeek && date < addDays(currentWeek, 7)) {
      totals[date.getDay()] += session.minutes;
    }
  });
  const max = Math.max(30, ...totals);
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  elements.weekChart.innerHTML = orderedDays
    .map((day) => {
      const minutes = totals[day];
      const height = minutes ? Math.max(8, Math.round((minutes / max) * 100)) : 4;
      const isToday = today.getDay() === day;
      return `
        <div class="day-column ${isToday ? "today" : ""}" title="${DAY_NAMES[day]}：${minutes} 分钟">
          <span class="day-value">${minutes || ""}</span>
          <div class="day-bar-wrap"><span class="day-bar" style="height:${height}%"></span></div>
          <span class="day-label">${isToday ? "今天" : DAY_NAMES[day].replace("周", "")}</span>
        </div>`;
    })
    .join("");
}

function getReviewTarget() {
  if (!state.cards.length) return null;
  return [...state.cards].sort((a, b) => {
    const aReviewed = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
    const bReviewed = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;
    return aReviewed - bReviewed || a.reviews - b.reviews;
  })[0];
}

function renderCards() {
  elements.cardCount.textContent = `${state.cards.length} 张`;
  const card = getReviewTarget();
  elements.practiceButton.disabled = !card;
  elements.practiceButton.textContent = card ? "开始复习" : "添加卡片后复习";
  if (card) {
    elements.reviewQuestion.textContent = card.question;
    elements.reviewDetail.textContent = card.reviews ? `已复习 ${card.reviews} 次` : "建议先回忆，再看答案";
  } else {
    elements.reviewQuestion.textContent = "还没有知识卡片";
    elements.reviewDetail.textContent = "学到一个关键概念后，把它变成一张卡片";
  }
}

function renderTimer() {
  const totalSeconds = state.timer.minutes * 60;
  const remaining = Math.max(0, Math.min(totalSeconds, state.timer.remaining));
  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  elements.timerDisplay.textContent = `${minutes}:${seconds}`;
  elements.timerProgress.style.strokeDashoffset = String(333 * (1 - remaining / totalSeconds));
  elements.focusMinutes.textContent = state.timer.minutes;
  elements.timerButton.textContent = timerRunning ? "暂停专注" : remaining === totalSeconds ? "开始专注" : "继续专注";
  document.title = timerRunning ? `${minutes}:${seconds} · 正在专注` : "拾光 · 我的学习空间";
}

function renderAll() {
  renderGreeting();
  renderProject();
  renderTasks();
  renderWeeklyProgress();
  renderStats();
  renderWeekChart();
  renderCards();
  renderTimer();
}

function logSession(minutes, note) {
  state.sessions.push({
    id: makeId("session"),
    minutes,
    note: note || "专注学习",
    date: isoDate(),
    createdAt: new Date().toISOString()
  });
  saveState();
  renderWeeklyProgress();
  renderStats();
  renderWeekChart();
}

function completeTimer() {
  window.clearInterval(timerInterval);
  timerRunning = false;
  const focusedTaskId = elements.focusTaskSelect.value;
  const focusedTask = state.tasks.find((task) => task.id === focusedTaskId);
  const note = focusedTask ? `专注完成：${focusedTask.title}` : "完成一次专注学习";
  logSession(state.timer.minutes, note);
  state.timer.remaining = state.timer.minutes * 60;
  saveState();
  renderTimer();
  showToast(`专注完成，已记录 ${state.timer.minutes} 分钟`);

  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
      const context = new Context();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 620;
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.6);
    }
  } catch (error) {
    console.warn("提示音不可用", error);
  }
}

function toggleTimer() {
  if (timerRunning) {
    window.clearInterval(timerInterval);
    timerRunning = false;
    renderTimer();
    showToast("已暂停，当前进度会保留");
    return;
  }

  if (state.timer.remaining <= 0) state.timer.remaining = state.timer.minutes * 60;
  timerRunning = true;
  renderTimer();
  timerInterval = window.setInterval(() => {
    state.timer.remaining -= 1;
    if (state.timer.remaining <= 0) {
      completeTimer();
      return;
    }
    if (state.timer.remaining % 10 === 0) saveState();
    renderTimer();
  }, 1000);
}

function resetTimer() {
  window.clearInterval(timerInterval);
  timerRunning = false;
  state.timer.remaining = state.timer.minutes * 60;
  saveState();
  renderTimer();
}

function changeTimerMinutes(delta) {
  if (timerRunning) {
    showToast("请先暂停计时，再调整时长");
    return;
  }
  const nextMinutes = Math.max(5, Math.min(120, state.timer.minutes + delta));
  state.timer.minutes = nextMinutes;
  state.project.dailyMinutes = nextMinutes;
  state.timer.remaining = nextMinutes * 60;
  saveState();
  renderTimer();
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function fillProjectForm() {
  document.querySelector("#projectTitleInput").value = state.project.title;
  document.querySelector("#projectOutcomeInput").value = state.project.outcome;
  document.querySelector("#projectDeadlineInput").value = state.project.deadline;
  document.querySelector("#projectWeeklyInput").value = state.project.weeklyTarget;
}

function startReview() {
  if (!state.cards.length) {
    openDialog(elements.cardDialog);
    return;
  }
  state.reviewQueue = [...state.cards].sort(() => Math.random() - 0.5).map((card) => card.id);
  state.currentCardId = state.reviewQueue[0];
  practiceAnswerVisible = false;
  renderPracticeCard();
  openDialog(elements.reviewDialog);
}

function renderPracticeCard() {
  const card = state.cards.find((item) => item.id === state.currentCardId) || getReviewTarget();
  if (!card) {
    closeDialog(elements.reviewDialog);
    renderCards();
    return;
  }
  state.currentCardId = card.id;
  elements.practiceQuestion.textContent = card.question;
  elements.practiceAnswer.textContent = card.answer;
  elements.flashcardAnswer.hidden = true;
  practiceAnswerVisible = false;
  const position = state.reviewQueue.indexOf(card.id);
  elements.reviewProgressText.textContent = position >= 0
    ? `本轮第 ${position + 1} / ${state.reviewQueue.length} 张`
    : `全部 ${state.cards.length} 张卡片`;
}

function revealPracticeAnswer() {
  elements.flashcardAnswer.hidden = false;
  practiceAnswerVisible = true;
}

function moveToNextCard(markKnown = false) {
  const card = state.cards.find((item) => item.id === state.currentCardId);
  if (markKnown && card) {
    card.reviews += 1;
    card.lastReviewed = new Date().toISOString();
    saveState();
  }
  const currentIndex = state.reviewQueue.indexOf(state.currentCardId);
  const nextId = state.reviewQueue[currentIndex + 1];
  if (nextId) {
    state.currentCardId = nextId;
    renderPracticeCard();
    return;
  }
  closeDialog(elements.reviewDialog);
  renderCards();
  showToast(markKnown ? "完成一轮复习，卡片已经更新" : "本轮复习结束");
}

function deleteCurrentCard() {
  const card = state.cards.find((item) => item.id === state.currentCardId);
  if (!card) return;
  if (!window.confirm("确定删除这张知识卡片吗？")) return;
  state.cards = state.cards.filter((item) => item.id !== card.id);
  state.reviewQueue = state.reviewQueue.filter((id) => id !== card.id);
  saveState();
  renderCards();
  const nextId = state.reviewQueue.find((id) => state.cards.some((item) => item.id === id));
  if (nextId) {
    state.currentCardId = nextId;
    renderPracticeCard();
  } else {
    closeDialog(elements.reviewDialog);
    showToast("知识卡片已删除");
  }
}

function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `学习空间备份-${isoDate()}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("学习记录已导出");
}

async function importData(file) {
  try {
    const text = await file.text();
    const imported = normalizeState(JSON.parse(text));
    state = imported;
    resetTimer();
    saveState();
    renderAll();
    showToast("学习记录已导入");
  } catch (error) {
    console.error(error);
    showToast("导入失败，请选择本页面导出的 JSON 文件");
  }
}

function resetData() {
  if (!window.confirm("这会清除当前所有任务、卡片和学习记录，并恢复示例内容。确定继续吗？")) return;
  window.clearInterval(timerInterval);
  timerRunning = false;
  state = defaultState();
  saveState();
  renderAll();
  showToast("已恢复示例内容");
}

function bindEvents() {
  document.querySelector("#themeButton").addEventListener("click", () => {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });

  document.querySelector("#exportButton").addEventListener("click", exportData);
  document.querySelector("#importButton").addEventListener("click", () => document.querySelector("#importFile").click());
  document.querySelector("#importFile").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) importData(file);
    event.target.value = "";
  });

  document.querySelector("#startTodayButton").addEventListener("click", () => {
    document.querySelector("#focusSection").scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => elements.timerButton.focus(), 500);
  });
  document.querySelector("#editProjectButton").addEventListener("click", () => {
    fillProjectForm();
    openDialog(elements.projectDialog);
  });

  document.querySelector("#logSessionButton").addEventListener("click", () => openDialog(elements.sessionDialog));
  document.querySelector("#addCardButton").addEventListener("click", () => openDialog(elements.cardDialog));
  document.querySelector("#practiceButton").addEventListener("click", startReview);
  document.querySelector("#helpButton").addEventListener("click", () => openDialog(elements.helpDialog));
  document.querySelector("#resetButton").addEventListener("click", resetData);

  elements.projectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.project.title = document.querySelector("#projectTitleInput").value.trim();
    state.project.outcome = document.querySelector("#projectOutcomeInput").value.trim();
    state.project.deadline = document.querySelector("#projectDeadlineInput").value;
    state.project.weeklyTarget = Math.max(1, Math.min(21, Number(document.querySelector("#projectWeeklyInput").value)));
    saveState();
    renderProject();
    renderWeeklyProgress();
    closeDialog(elements.projectDialog);
    showToast("项目设定已更新");
  });

  document.querySelector("#taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#taskInput");
    const title = input.value.trim();
    if (!title) return;
    state.tasks.push({ id: makeId("task"), title, done: false, createdAt: new Date().toISOString() });
    input.value = "";
    saveState();
    renderTasks();
    showToast("已加入下一步行动");
  });

  elements.taskList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    const taskItem = event.target.closest("[data-task-id]");
    if (!actionButton || !taskItem) return;
    const task = state.tasks.find((item) => item.id === taskItem.dataset.taskId);
    if (!task) return;
    if (actionButton.dataset.action === "toggle-task") {
      task.done = !task.done;
    } else if (actionButton.dataset.action === "delete-task") {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
    }
    saveState();
    renderTasks();
  });

  elements.sessionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const minutes = Number(document.querySelector("#sessionMinutesInput").value);
    const note = document.querySelector("#sessionNoteInput").value.trim();
    logSession(minutes, note || "补记一次学习");
    elements.sessionForm.reset();
    closeDialog(elements.sessionDialog);
    showToast(`已记录 ${minutes} 分钟学习`);
  });

  elements.cardForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = document.querySelector("#cardQuestionInput").value.trim();
    const answer = document.querySelector("#cardAnswerInput").value.trim();
    if (!question || !answer) return;
    state.cards.push({
      id: makeId("card"),
      question,
      answer,
      reviews: 0,
      lastReviewed: null,
      createdAt: new Date().toISOString()
    });
    saveState();
    elements.cardForm.reset();
    closeDialog(elements.cardDialog);
    renderCards();
    showToast("知识卡片已保存");
  });

  document.querySelector("#timerButton").addEventListener("click", toggleTimer);
  document.querySelector("#resetTimerButton").addEventListener("click", resetTimer);
  document.querySelector("#minusFiveButton").addEventListener("click", () => changeTimerMinutes(-5));
  document.querySelector("#plusFiveButton").addEventListener("click", () => changeTimerMinutes(5));

  elements.flashcard.addEventListener("click", () => {
    if (!practiceAnswerVisible) {
      revealPracticeAnswer();
    } else {
      elements.flashcardAnswer.hidden = true;
      practiceAnswerVisible = false;
    }
  });
  elements.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.flashcard.click();
    }
  });
  document.querySelector("#closeReviewButton").addEventListener("click", () => {
    closeDialog(elements.reviewDialog);
    renderCards();
  });
  document.querySelector("#nextCardButton").addEventListener("click", () => moveToNextCard(false));
  document.querySelector("#knownCardButton").addEventListener("click", () => moveToNextCard(true));
  document.querySelector("#deleteCardButton").addEventListener("click", deleteCurrentCard);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.querySelector(`#${button.dataset.closeDialog}`);
      if (dialog) closeDialog(dialog);
    });
  });

  window.addEventListener("beforeunload", () => {
    window.clearInterval(timerInterval);
    saveState();
  });
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.dataset.theme = saved || (prefersDark ? "dark" : "light");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch((error) => console.warn("离线缓存未启用", error));
  }
}

initTheme();
bindEvents();
renderAll();
saveState();
registerServiceWorker();

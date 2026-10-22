const DATA = window.SHIJI_DATA;
const STATE = {
  era: "all",
  activeCharacterId: null,
  activeEventId: DATA.events[3].id,
  quizIndex: 0,
  quizLocked: false,
  toastTimer: null,
  speakingElement: null
};

const dom = {
  characterGrid: document.querySelector("#characterGrid"),
  eraFilter: document.querySelector("#eraFilter"),
  characterDialog: document.querySelector("#characterDialog"),
  eventDetail: document.querySelector("#eventDetail"),
  timelineTrack: document.querySelector("#timelineTrack"),
  timelineProgress: document.querySelector("#timelineProgress"),
  relationMap: document.querySelector("#relationMap"),
  quizQuestion: document.querySelector("#quizQuestion"),
  quizOptions: document.querySelector("#quizOptions"),
  quizFeedback: document.querySelector("#quizFeedback"),
  quizNumber: document.querySelector("#quizNumber"),
  quizProgress: document.querySelector("#quizProgress"),
  nextQuizButton: document.querySelector("#nextQuizButton"),
  sourceDialog: document.querySelector("#sourceDialog"),
  voicePlayer: document.querySelector("#voicePlayer"),
  voiceTitle: document.querySelector("#voiceTitle"),
  voiceSubtitle: document.querySelector("#voiceSubtitle"),
  toast: document.querySelector("#toast")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function portraitSvg(character, instance = "card") {
  const color = character.color;
  const gradientId = `portrait-gradient-${character.id}-${instance}`;
  const filterId = `portrait-glow-${character.id}-${instance}`;
  const style = character.portrait;
  let headwear = "";
  let facialHair = "";

  if (style === "crown" || style === "emperor") {
    headwear = `
      <path d="M47 54 L57 27 L72 43 L88 21 L104 43 L119 27 L128 55" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M54 55 Q88 44 122 55 L118 67 Q88 58 58 67 Z" fill="#1a2822" stroke="${color}" stroke-width="2"/>
      <path d="M62 54 V44 M114 54 V44" stroke="${color}" stroke-width="2"/>
      <circle cx="57" cy="48" r="3" fill="${color}"/>
      <circle cx="119" cy="48" r="3" fill="${color}"/>`;
  } else if (style === "warrior" || style === "general") {
    headwear = `
      <path d="M50 58 Q51 29 88 25 Q125 29 126 58 Q106 48 88 49 Q70 48 50 58Z" fill="#192722" stroke="${color}" stroke-width="3"/>
      <path d="M61 38 Q88 28 115 38 M88 24 V14 Q80 18 76 25 M88 14 Q99 18 101 29" fill="none" stroke="${color}" stroke-width="2.5"/>
      <path d="M52 58 L43 74 M124 58 L133 74" stroke="${color}" stroke-width="2"/>`;
    facialHair = `<path d="M69 105 Q74 124 88 129 Q102 124 107 105" fill="none" stroke="#2a2420" stroke-width="4" stroke-linecap="round" opacity=".72"/>`;
  } else if (style === "sage" || style === "historian") {
    headwear = `
      <path d="M51 55 Q56 30 88 29 Q120 30 125 55 Q107 48 88 49 Q69 48 51 55Z" fill="#1a2822" stroke="${color}" stroke-width="2.5"/>
      <path d="M65 39 Q88 25 111 39 L107 22 Q88 11 69 22 Z" fill="#23362c" stroke="${color}" stroke-width="2"/>
      <path d="M87 24 V47" stroke="${color}" stroke-width="1.5"/>`;
    facialHair = `
      <path d="M72 101 Q76 134 88 143 Q100 134 104 101" fill="none" stroke="#2a2a25" stroke-width="3" stroke-linecap="round" opacity=".68"/>
      <path d="M78 110 Q88 119 98 110" fill="none" stroke="#2a2a25" stroke-width="2" opacity=".6"/>`;
  } else if (style === "poet") {
    headwear = `
      <path d="M48 57 Q57 32 87 31 Q119 32 128 57" fill="none" stroke="${color}" stroke-width="5"/>
      <path d="M51 54 Q31 73 33 95" fill="none" stroke="${color}" stroke-width="2.5" opacity=".7"/>
      <path d="M124 54 Q145 70 141 92" fill="none" stroke="${color}" stroke-width="2.5" opacity=".7"/>
      <path d="M61 36 Q88 20 115 36" fill="none" stroke="${color}" stroke-width="2"/>`;
    facialHair = `<path d="M73 104 Q77 132 88 139 Q99 132 103 104" fill="none" stroke="#242824" stroke-width="3" opacity=".64"/>`;
  } else {
    headwear = `
      <path d="M48 55 Q54 29 88 28 Q122 29 128 55 L122 63 Q88 53 54 63Z" fill="#1a2822" stroke="${color}" stroke-width="2.5"/>
      <path d="M67 30 L58 15 H118 L109 30" fill="#22342b" stroke="${color}" stroke-width="2"/>
      <path d="M58 15 H118" stroke="${color}" stroke-width="1.5"/>`;
    facialHair = `<path d="M74 103 Q76 128 88 135 Q101 129 102 103" fill="none" stroke="#252620" stroke-width="3" opacity=".6"/>`;
  }

  return `
    <svg class="portrait-svg" viewBox="0 0 176 220" role="img" aria-label="${escapeHtml(character.name)}的风格化人物徽章">
      <defs>
        <radialGradient id="${gradientId}" cx="50%" cy="43%" r="55%">
          <stop offset="0%" stop-color="${color}" stop-opacity=".34"/>
          <stop offset="65%" stop-color="${color}" stop-opacity=".09"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
        <filter id="${filterId}">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
      </defs>
      <circle class="portrait-aura" cx="88" cy="111" r="69" fill="url(#${gradientId})"/>
      <circle cx="88" cy="104" r="56" fill="none" stroke="${color}" stroke-opacity=".16" stroke-dasharray="2 5"/>
      <path d="M22 220 Q31 158 69 144 L107 144 Q145 158 154 220Z" fill="#17251f" stroke="${color}" stroke-width="1.4"/>
      <path d="M69 146 Q88 165 107 146 L115 220 H61Z" fill="${color}" opacity=".17"/>
      <path d="M72 128 Q72 149 88 155 Q104 149 104 128Z" fill="#b88d6c"/>
      <g class="portrait-figure">
        <path d="M63 77 Q63 49 88 47 Q113 49 113 77 L109 108 Q104 133 88 136 Q72 133 67 108Z" fill="#c79b78" stroke="#604d3c" stroke-width="1"/>
        <path d="M65 71 Q72 54 88 52 Q103 51 112 70 Q101 62 88 63 Q76 62 65 71Z" fill="#2a2923"/>
        ${headwear}
        <path d="M72 84 Q79 80 85 83 M91 83 Q98 80 104 84" fill="none" stroke="#4d4034" stroke-width="1.5" stroke-linecap="round"/>
        <g class="eye-blink">
          <path d="M74 87 Q79 85 83 87 M93 87 Q97 85 102 87" fill="none" stroke="#2a2721" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <path d="M88 87 L86 98 Q89 101 92 98" fill="none" stroke="#85664f" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M80 107 Q88 111 96 107" fill="none" stroke="#7d4c42" stroke-width="1.4" stroke-linecap="round"/>
        ${facialHair}
      </g>
      <path d="M43 194 Q88 175 133 194" fill="none" stroke="${color}" stroke-opacity=".3" stroke-width="1"/>
      <text x="88" y="207" fill="${color}" fill-opacity=".55" text-anchor="middle" font-size="8" letter-spacing="3">${escapeHtml(character.courtesy || character.category)}</text>
    </svg>`;
}

function renderCharacters() {
  const characters = DATA.characters.filter((character) => STATE.era === "all" || character.era === STATE.era);
  dom.characterGrid.innerHTML = characters
    .map(
      (character, index) => `
        <button class="character-card" type="button" data-character="${character.id}"
          style="--card-color:${character.color}" aria-label="打开${character.name}的人物档案">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="card-era">${escapeHtml(character.eraLabel)}</span>
          <div class="card-portrait">${portraitSvg(character, `card-${index}`)}</div>
          <div class="card-body">
            <h3>${escapeHtml(character.name)} <small>${escapeHtml(character.courtesy || "")}</small></h3>
            <p class="card-role">${escapeHtml(character.category)} · ${escapeHtml(character.chapter)}</p>
            <p class="card-summary">${escapeHtml(character.summary)}</p>
          </div>
        </button>`
    )
    .join("");

  dom.characterGrid.querySelectorAll(".character-card").forEach(bindCardTilt);
}

function renderTimeline() {
  dom.timelineTrack.innerHTML = DATA.events
    .map(
      (event) => `
        <button class="timeline-node ${event.id === STATE.activeEventId ? "active" : ""}" type="button"
          data-event="${event.id}" style="--event-color:${event.color}">
          <time>${escapeHtml(event.year)}</time>
          <span class="timeline-dot"></span>
          <strong>${escapeHtml(event.title)}</strong>
        </button>`
    )
    .join("");
  renderEventDetail();
}

function renderEventDetail() {
  const event = DATA.events.find((item) => item.id === STATE.activeEventId) || DATA.events[0];
  dom.eventDetail.innerHTML = `
    <div class="event-year" id="eventYear">${escapeHtml(event.year)}</div>
    <div class="event-main">
      <span class="event-chapter" id="eventChapter">${escapeHtml(event.displayYear)} · ${escapeHtml(event.chapter)}</span>
      <h3 id="eventTitle">${escapeHtml(event.title)}</h3>
      <p id="eventSummary">${escapeHtml(event.summary)}</p>
    </div>
    <blockquote id="eventQuote">${escapeHtml(event.quote)}</blockquote>
    <div class="event-tools">
      <p id="eventPlain">${escapeHtml(event.plain)}</p>
      <button class="read-button" type="button" data-read-event="${event.id}">
        <span class="play-icon">▶</span> 听这段故事
      </button>
    </div>`;

  document.querySelector(`[data-read-event="${event.id}"]`).addEventListener("click", (buttonEvent) => {
    speakText(
      `${event.title}。${event.summary}。史记${event.chapter}原文：${event.quote}。${event.plain}`,
      event.title,
      `《史记 · ${event.chapter}》`,
      buttonEvent.currentTarget
    );
  });

  const eventIndex = DATA.events.findIndex((item) => item.id === event.id);
  dom.timelineProgress.style.width = `${((eventIndex + 1) / DATA.events.length) * 100}%`;
  dom.timelineTrack.querySelectorAll(".timeline-node").forEach((node) => {
    node.classList.toggle("active", node.dataset.event === event.id);
  });
}

function renderRelations() {
  const positions = {
    huangdi: [450, 70],
    confucius: [215, 116],
    shangyang: [692, 84],
    quyuan: [132, 305],
    lianpo: [276, 417],
    qinshihuang: [691, 218],
    xiangyu: [742, 388],
    liubang: [561, 446],
    hanxin: [368, 389],
    simaqian: [170, 458]
  };
  const byId = Object.fromEntries(DATA.characters.map((character) => [character.id, character]));
  const spiritualEdges = new Set(["confucius-simaqian", "quyuan-simaqian", "lianpo-hanxin"]);
  const edges = DATA.relations
    .map((relation) => {
      const [x1, y1] = positions[relation.source];
      const [x2, y2] = positions[relation.target];
      const key = [relation.source, relation.target].sort().join("-");
      const spiritual = spiritualEdges.has(key);
      const labelX = (x1 + x2) / 2;
      const labelY = (y1 + y2) / 2 - 4;
      return `
        <g>
          <line class="relation-edge ${spiritual ? "spiritual" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
          <text class="relation-edge-label" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeHtml(relation.label)}</text>
        </g>`;
    })
    .join("");
  const nodes = Object.entries(positions)
    .map(([id, [x, y]]) => {
      const character = byId[id];
      return `
        <g class="relation-node" data-character="${id}" style="--node-color:${character.color}" transform="translate(${x} ${y})">
          <circle class="node-halo" r="38"/>
          <circle class="node-core" r="25"/>
          <text y="1">${escapeHtml(character.name)}</text>
        </g>`;
    })
    .join("");
  dom.relationMap.innerHTML = `<g>${edges}</g><g>${nodes}</g>`;
}

function renderQuiz() {
  const quiz = DATA.quiz[STATE.quizIndex];
  STATE.quizLocked = false;
  dom.quizNumber.textContent = String(STATE.quizIndex + 1).padStart(2, "0");
  dom.quizProgress.style.width = `${((STATE.quizIndex + 1) / DATA.quiz.length) * 100}%`;
  dom.quizQuestion.textContent = quiz.question;
  dom.quizOptions.innerHTML = quiz.options
    .map(
      (option, index) => `
        <button class="quiz-option" type="button" data-answer="${index}">
          <span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}
        </button>`
    )
    .join("");
  dom.quizFeedback.hidden = true;
  dom.quizFeedback.textContent = "";
  dom.nextQuizButton.style.visibility = "hidden";
}

function answerQuiz(index) {
  if (STATE.quizLocked) return;
  STATE.quizLocked = true;
  const quiz = DATA.quiz[STATE.quizIndex];
  dom.quizOptions.querySelectorAll(".quiz-option").forEach((button) => {
    button.disabled = true;
    const optionIndex = Number(button.dataset.answer);
    if (optionIndex === quiz.answer) button.classList.add("correct");
    if (optionIndex === index && index !== quiz.answer) button.classList.add("wrong");
  });
  const correct = index === quiz.answer;
  dom.quizFeedback.innerHTML = `<strong>${correct ? "答对了。" : "再想一步。"}</strong> ${escapeHtml(quiz.explain)}`;
  dom.quizFeedback.hidden = false;
  dom.nextQuizButton.style.visibility = "visible";
  dom.nextQuizButton.innerHTML = STATE.quizIndex === DATA.quiz.length - 1 ? "重新开始 <span>↺</span>" : "下一题 <span>→</span>";
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

function openCharacter(id, pushHistory = true) {
  const character = DATA.characters.find((item) => item.id === id);
  if (!character) return;
  stopSpeech();
  STATE.activeCharacterId = id;

  const portrait = document.querySelector("#dialogPortrait");
  portrait.style.setProperty("--dialog-color", character.color);
  portrait.dataset.seal = character.name.slice(0, 1);
  portrait.innerHTML = portraitSvg(character, "dialog");
  document.querySelector("#dialogEra").textContent = character.eraLabel;
  document.querySelector("#dialogName").textContent = character.name;
  document.querySelector("#dialogTitle").textContent = character.title;
  document.querySelector("#dialogChapter").textContent = `《史记 · ${character.chapter}》`;
  document.querySelector("#dialogYears").textContent = character.years;
  document.querySelector("#dialogCategory").textContent = character.category;
  document.querySelector("#dialogSummary").textContent = character.summary;
  document.querySelector("#dialogStory").textContent = character.story;
  document.querySelector("#dialogQuote").textContent = `“${character.quote}”`;
  document.querySelector("#dialogCite").textContent = `——《史记·${character.chapter}》`;
  document.querySelector("#dialogPlain").textContent = character.plain;
  document.querySelector("#dialogTags").innerHTML = character.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  document.querySelector("#dialogConnections").innerHTML = character.connections
    .map((connectionId) => {
      const connection = DATA.characters.find((item) => item.id === connectionId);
      return connection ? `<button class="connection-chip" type="button" data-character="${connection.id}">${escapeHtml(connection.name)}</button>` : "";
    })
    .join("");
  document.querySelector("#readCharacterButton").classList.remove("speaking");
  document.querySelector("#readCharacterButton").innerHTML = `<span class="audio-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span> 听人物故事`;
  openDialog(dom.characterDialog);
  if (pushHistory) {
    history.replaceState(null, "", `#person=${encodeURIComponent(id)}`);
  }
}

function closeCharacter() {
  stopSpeech();
  closeDialog(dom.characterDialog);
  if (location.hash.startsWith("#person=")) {
    history.replaceState(null, "", `${location.pathname}${location.search}#people`);
  }
}

function speakText(text, title, subtitle, sourceElement = null) {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器不支持语音朗读");
    return;
  }
  window.speechSynthesis.cancel();
  if (STATE.speakingElement) STATE.speakingElement.classList.remove("speaking");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.92;
  utterance.pitch = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find((voice) => /^zh[-_]/i.test(voice.lang) && /Xiaoxiao|Huihui|Tingting|Chinese|中文|普通话/i.test(voice.name))
    || voices.find((voice) => /^zh[-_]/i.test(voice.lang));
  if (chineseVoice) utterance.voice = chineseVoice;

  utterance.onstart = () => {
    STATE.speakingElement = sourceElement;
    if (sourceElement) sourceElement.classList.add("speaking");
    dom.voiceTitle.textContent = title;
    dom.voiceSubtitle.textContent = subtitle || "浏览器本地语音";
    dom.voicePlayer.classList.add("show");
  };
  utterance.onend = clearSpeechUi;
  utterance.onerror = (event) => {
    clearSpeechUi();
    if (event.error !== "canceled") showToast("语音暂时无法播放，请检查系统中文语音");
  };
  window.speechSynthesis.speak(utterance);
}

function clearSpeechUi() {
  if (STATE.speakingElement) STATE.speakingElement.classList.remove("speaking");
  STATE.speakingElement = null;
  dom.voicePlayer.classList.remove("show");
  document.querySelector("#readCharacterButton").classList.remove("speaking");
}

function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  clearSpeechUi();
}

function showToast(message) {
  window.clearTimeout(STATE.toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  STATE.toastTimer = window.setTimeout(() => dom.toast.classList.remove("show"), 2600);
}

function bindCardTilt(card) {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.style.setProperty("--ry", `${(x - 0.5) * 5}deg`);
    card.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const characterTrigger = event.target.closest("[data-character]");
    if (characterTrigger) openCharacter(characterTrigger.dataset.character);
  });

  dom.eraFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-era]");
    if (!button) return;
    STATE.era = button.dataset.era;
    dom.eraFilter.querySelectorAll("[data-era]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    renderCharacters();
  });

  dom.timelineTrack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-event]");
    if (!button) return;
    STATE.activeEventId = button.dataset.event;
    renderEventDetail();
  });

  document.querySelector("#closeCharacterButton").addEventListener("click", closeCharacter);
  document.querySelector("#stopVoiceButton").addEventListener("click", stopSpeech);
  document.querySelector("#introVoiceButton").addEventListener("click", (event) => {
    speakText(
      "史记，原名太史公书，由西汉史学家司马迁撰写。全书一百三十篇，从传说中的黄帝写到汉武帝时代。它不只记录王朝，也写刺客、商人、游侠与失败者，让历史中的人拥有自己的声音。",
      "史记 · 千年人物志",
      "约一分钟的历史漫游",
      event.currentTarget
    );
  });
  document.querySelector("#randomCharacterButton").addEventListener("click", () => {
    const character = DATA.characters[Math.floor(Math.random() * DATA.characters.length)];
    openCharacter(character.id);
  });
  document.querySelector("#readCharacterButton").addEventListener("click", (event) => {
    const character = DATA.characters.find((item) => item.id === STATE.activeCharacterId);
    if (!character) return;
    speakText(
      `${character.name}，${character.title}。${character.story}。史记原文：${character.quote}。${character.plain}`,
      character.name,
      `《史记 · ${character.chapter}》`,
      event.currentTarget
    );
  });
  document.querySelector("#characterSourceButton").addEventListener("click", () => {
    window.open(`${DATA.meta.onlineUrl}/wiki/`, "_blank", "noopener,noreferrer");
  });
  document.querySelector("#sourceButton").addEventListener("click", () => openDialog(dom.sourceDialog));
  document.querySelector("#closeSourceButton").addEventListener("click", () => closeDialog(dom.sourceDialog));
  document.querySelector("#closeSourceBottomButton").addEventListener("click", () => closeDialog(dom.sourceDialog));
  dom.quizOptions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-answer]");
    if (option) answerQuiz(Number(option.dataset.answer));
  });
  dom.nextQuizButton.addEventListener("click", () => {
    STATE.quizIndex = (STATE.quizIndex + 1) % DATA.quiz.length;
    renderQuiz();
  });

  dom.characterDialog.addEventListener("close", stopSpeech);
  dom.characterDialog.addEventListener("click", (event) => {
    const rect = dom.characterDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) closeCharacter();
  });
  dom.sourceDialog.addEventListener("click", (event) => {
    const rect = dom.sourceDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) closeDialog(dom.sourceDialog);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dom.characterDialog.open) closeCharacter();
  });
  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    const hero = document.querySelector("#heroArt");
    if (hero) {
      const dx = (event.clientX / window.innerWidth - 0.5) * 10;
      const dy = (event.clientY / window.innerHeight - 0.5) * 10;
      hero.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  });
  window.addEventListener("beforeunload", stopSpeech);
}

function initReveal() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px" }
  );
  revealItems.forEach((item) => observer.observe(item));
}

function openHashCharacter() {
  if (!location.hash.startsWith("#person=")) return;
  const id = decodeURIComponent(location.hash.slice(8));
  if (DATA.characters.some((character) => character.id === id)) {
    window.setTimeout(() => openCharacter(id, false), 350);
  }
}

renderCharacters();
renderTimeline();
renderRelations();
renderQuiz();
bindEvents();
initReveal();
openHashCharacter();

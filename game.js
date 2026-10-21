"use strict";

const SAVE_KEY = "shkolnye-budni-save-v1";
const WEEKDAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const LESSON_HOURS = new Set([9, 10, 11, 13, 14, 15]);
const GRADE_NAMES = ["1 класс", "2 класс", "3 класс", "4 класс", "5 класс", "6 класс", "7 класс", "8 класс", "9 класс", "10 класс", "11 класс", "12 класс"];

const ACTIONS = {
  breakfast: {
    name: "Нормальный завтрак", icon: "🍳",
    detail: "Каша, яйцо и тост — хорошее начало дня.",
    effects: "Голод −24 · энергия +5 · здоровье +1",
    run: (s) => { s.hunger -= 24; s.energy += 5; s.health += 1; }
  },
  skipBreakfast: {
    name: "Без завтрака", icon: "⏰",
    detail: "Сразу пора выходить. К обеду проголодаешься сильнее.",
    effects: "Голод +6",
    run: (s) => { s.hunger += 6; }
  },
  schoolLunch: {
    name: "Обед в столовой", icon: "🍲",
    detail: "Полноценный обед помогает продержаться до вечера.",
    effects: "Голод −36 · энергия +12 · здоровье +2",
    run: (s) => { s.hunger -= 36; s.energy += 12; s.health += 2; }
  },
  homeLunch: {
    name: "Домашний обед", icon: "🍛",
    detail: "Сытная еда, если сегодня остался дома.",
    effects: "Голод −38 · энергия +13 · здоровье +2",
    run: (s) => { s.hunger -= 38; s.energy += 13; s.health += 2; }
  },
  dinner: {
    name: "Поужинать", icon: "🍽️",
    detail: "Нормальная еда вечером поддерживает силы и здоровье.",
    effects: "Голод −30 · энергия +8 · здоровье +2",
    run: (s) => { s.hunger -= 30; s.energy += 8; s.health += 2; }
  },
  snack: {
    name: "Полезный перекус", icon: "🍎",
    detail: "Фрукт или йогурт немного утолит голод.",
    effects: "Голод −13 · энергия +2 · здоровье +1",
    run: (s) => { s.hunger -= 13; s.energy += 2; s.health += 1; }
  },
  junk: {
    name: "Чипсы и лимонад", icon: "🥤",
    detail: "Вкусно и весело, но почти не насыщает и вредит здоровью.",
    effects: "Радость +13 · голод −4 · здоровье −8",
    run: (s) => { s.joy += 13; s.hunger -= 4; s.health -= 8; }
  },
  fastFood: {
    name: "Фастфуд", icon: "🍔",
    detail: "Сытнее снеков, но не так полезно, как обычный обед.",
    effects: "Радость +9 · голод −20 · энергия +3 · здоровье −5",
    run: (s) => { s.joy += 9; s.hunger -= 20; s.energy += 3; s.health -= 5; }
  },
  games: {
    name: "Видеоигры", icon: "🎮",
    detail: "Сыграй три раунда в «Камень, ножницы, бумага»!",
    effects: "Радость +14 · энергия −6",
    run: (s) => { s.joy += 14; s.energy -= 6; }
  },
  friends: {
    name: "Встретиться с друзьями", icon: "🧑‍🤝‍🧑",
    detail: "Прогулка и разговоры — отличный способ отдохнуть.",
    effects: "Радость +15 · энергия −8",
    run: (s) => { s.joy += 15; s.energy -= 8; }
  },
  read: {
    name: "Почитать", icon: "📚",
    detail: "Чтение понемногу помогает в учёбе.",
    effects: "Учёба +4 · радость +2 · энергия −7",
    run: (s) => { addStudy(4); s.joy += 2; s.energy -= 7; }
  },
  prepare: {
    name: "Сделать уроки", icon: "✏️",
    detail: "Сосредоточенная подготовка полезна, но утомляет.",
    effects: "Учёба +9 · радость −4 · энергия −13",
    run: (s) => { addStudy(9); s.joy -= 4; s.energy -= 13; }
  },
  sport: {
    name: "Заняться спортом", icon: "🏃",
    detail: "Усталость сейчас — больше выносливости завтра.",
    effects: "Радость +3 · энергия −14 · здоровье +2 · тренировка",
    run: (s) => {
      s.joy += 3;
      s.energy -= 14;
      s.health += 2;
      s.sportSessions += 1;
      s.sportDays = Math.max(s.sportDays, 2);
    }
  },
  rest: {
    name: "Спокойно отдохнуть", icon: "🛋️",
    detail: "Передохнуть час и немного восстановить силы.",
    effects: "Энергия +4 · радость +2",
    run: (s) => { s.energy += 4; s.joy += 2; }
  }
};

function newGame() {
  return {
    day: 1,
    grade: 1,
    study: 0,
    joy: 100,
    energy: 86,
    hunger: 15,
    health: 100,
    maxEnergy: 100,
    time: 8,
    schoolToday: null,
    lessonsToday: 0,
    sportSessions: 0,
    sportDays: 0,
    journal: [],
    finished: false
  };
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return newGame();
    const parsed = JSON.parse(saved);
    const fresh = newGame();
    const state = { ...fresh, ...parsed };
    if (!Number.isInteger(state.day) || state.day < 1 ||
        !Number.isInteger(state.grade) || state.grade < 1 || state.grade > 12 ||
        !Number.isInteger(state.time) || state.time < 8 || state.time > 21) {
      return fresh;
    }
    return state;
  } catch (error) {
    console.error("Не удалось загрузить сохранение игры.", error);
    return newGame();
  }
}

let state = loadGame();

const elements = {
  grade: document.querySelector("#grade-label"),
  joy: document.querySelector("#joy-value"),
  energy: document.querySelector("#energy-value"),
  hunger: document.querySelector("#hunger-value"),
  health: document.querySelector("#health-value"),
  joyBar: document.querySelector("#joy-bar"),
  energyBar: document.querySelector("#energy-bar"),
  hungerBar: document.querySelector("#hunger-bar"),
  healthBar: document.querySelector("#health-bar"),
  studyValue: document.querySelector("#study-value"),
  studyBar: document.querySelector("#study-bar"),
  sceneKicker: document.querySelector("#scene-kicker"),
  sceneTitle: document.querySelector("#scene-title"),
  sceneDescription: document.querySelector("#scene-description"),
  clock: document.querySelector("#clock-label"),
  day: document.querySelector("#day-label"),
  location: document.querySelector("#location-label"),
  eventTitle: document.querySelector("#event-title"),
  eventDescription: document.querySelector("#event-description"),
  choices: document.querySelector("#choices"),
  journal: document.querySelector("#journal-list"),
  victory: document.querySelector("#victory-dialog")
};

const miniGame = {
  dialog: document.querySelector("#mini-game-dialog"),
  status: document.querySelector("#mini-game-status"),
  score: document.querySelector("#mini-game-score"),
  choices: document.querySelector("#mini-game-choices"),
  result: document.querySelector("#mini-game-result"),
  continueButton: document.querySelector("#mini-game-continue"),
  round: 0,
  playerWins: 0,
  computerWins: 0
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function gradeGoal() {
  return Math.round(75 + state.grade * 20);
}

function weekdayIndex() {
  return (state.day - 1) % 7;
}

function isSchoolDay() {
  return weekdayIndex() < 5;
}

function formatTime(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function record(message, hour = state.time) {
  state.journal.unshift({ day: state.day, time: formatTime(hour), message });
  state.journal = state.journal.slice(0, 5);
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Не удалось сохранить игру в браузере.", error);
  }
}

function normalizeStats() {
  state.joy = clamp(state.joy);
  state.energy = clamp(state.energy, 0, state.maxEnergy);
  state.hunger = clamp(state.hunger);
  state.health = clamp(state.health);
  state.study = Math.max(0, state.study);
  state.maxEnergy = clamp(state.maxEnergy, 80, 120);
}

function applyHourlyNeeds() {
  state.hunger += 4;
  const hungryDrain = Math.max(0, state.hunger - 45) * 0.055;
  const lowMoodDrain = Math.max(0, 55 - state.joy) * 0.045;
  const sportRecovery = state.sportDays > 0 ? 0.82 : 1;
  state.energy -= (3 + hungryDrain + lowMoodDrain) * sportRecovery;
  if (state.energy <= 0) {
    state.joy -= 2;
    state.health -= 1;
  }
  normalizeStats();
}

function addStudy(amount) {
  state.study += amount;
  const goal = gradeGoal();
  if (state.study >= goal) {
    state.study -= goal;
    if (state.grade === 12) {
      state.finished = true;
      record("Окончил 12 класс и завершил школу!");
    } else {
      state.grade += 1;
      record(`Закончил ${state.grade - 1} класс и перешёл в ${state.grade} класс!`);
    }
  }
}

function getLessonTask() {
  const lessonNumber = state.lessonsToday + 1;
  if (lessonNumber === 1) {
    const mathTasks = [
      { question: "У Маши было 7 яблок, ей дали ещё 5. Сколько яблок стало?", answer: 12 },
      { question: "В коробке 24 карандаша, а в другой — 18. Сколько всего карандашей?", answer: 42 },
      { question: "В библиотеке было 56 книг. 29 книг взяли почитать. Сколько осталось?", answer: 27 },
      { question: "На полке 6 рядов по 7 книг. Сколько всего книг?", answer: 42 },
      { question: "В пяти коробках по 4 карандаша. Сколько карандашей всего?", answer: 20 },
      { question: "Вычисли: 24 × 6.", answer: 144 },
      { question: "Вычисли: 144 ÷ 12.", answer: 12 },
      { question: "Сколько будет 15% от 200?", answer: 30 },
      { question: "Вычисли: (18 + 12) × 3.", answer: 90 },
      { question: "Вычисли: 12 × 12.", answer: 144 },
      { question: "Вычисли: 125 ÷ 5.", answer: 25 },
      { question: "Сколько будет 25% от 240?", answer: 60 }
    ];
    const task = mathTasks[Math.min(state.grade - 1, mathTasks.length - 1)];
    return { subject: "Математика", ...task };
  }
  if (lessonNumber === 2) {
    return {
      subject: "Физика",
      question: "Велосипед едет со скоростью 3 метра в секунду. Какое расстояние он проедет за 4 секунды?",
      answer: 12,
      unit: "м"
    };
  }
  if (lessonNumber === 3) {
    return {
      subject: "Английский",
      question: "Choose the correct translation of “cat”.",
      answer: "кошка",
      options: ["кошка", "собака", "дом"]
    };
  }
  if (lessonNumber === 4) {
    return {
      subject: "Физкультура",
      question: "Стадионная дорожка — 200 метров. Сколько метров нужно пробежать за 3 круга?",
      answer: "600 м",
      options: ["400 м", "600 м", "800 м"],
      energyCost: 14
    };
  }
  if (lessonNumber === 5) {
    return {
      subject: "Физкультура",
      question: "За минуту спортсмен делает 20 приседаний. Сколько приседаний он сделает за 3 минуты?",
      answer: "60",
      options: ["40", "60", "80"],
      energyCost: 14
    };
  }
  if (lessonNumber === 6) {
    return {
      subject: "Биология",
      question: "Какой орган помогает нам дышать?",
      answer: "Лёгкие",
      options: ["Сердце", "Лёгкие", "Желудок"]
    };
  }
  return null;
}

function answerOptions(task) {
  if (task.options) {
    const answerPosition = state.day % task.options.length;
    return [...task.options.slice(answerPosition), ...task.options.slice(0, answerPosition)];
  }
  const correct = task.answer;
  const offsets = correct < 10 ? [-2, 2] : [-3, 4];
  const values = [correct, ...offsets.map((offset) => Math.max(0, correct + offset))];
  const answerLabels = values.map((value) => `${value}${task.unit ? ` ${task.unit}` : ""}`);
  const answerPosition = state.day % answerLabels.length;
  return [...answerLabels.slice(answerPosition), ...answerLabels.slice(0, answerPosition)];
}

function startMorning(attendSchool, eatBreakfast) {
  state.schoolToday = attendSchool;
  const breakfast = eatBreakfast ? ACTIONS.breakfast : ACTIONS.skipBreakfast;
  breakfast.run(state);
  applyHourlyNeeds();
  const message = attendSchool
    ? (eatBreakfast ? "Позавтракал и пошёл в школу." : "Пошёл в школу без завтрака.")
    : (eatBreakfast ? "Позавтракал и остался дома." : "Пропустил завтрак и остался дома.");
  record(message, 8);
  state.time = 9;
  render();
}

function doLesson(taskResult) {
  const hour = state.time;
  const studyGain = 9 + Math.floor((state.grade - 1) * 0.45);
  const bonus = taskResult?.correct ? 3 : 0;
  const lessonEnergyCost = taskResult?.energyCost ?? 8;
  addStudy(studyGain + bonus);
  state.energy -= lessonEnergyCost;
  state.joy -= 1;
  state.lessonsToday += 1;
  applyHourlyNeeds();
  const resultMessage = taskResult
    ? taskResult.correct
      ? `Верно! Задание по предмету «${taskResult.subject}» решено.`
      : `Задание по предмету «${taskResult.subject}» не решено. Урок всё равно засчитан.`
    : `Урок ${state.lessonsToday} из 6: учёба +${studyGain}.`;
  record(`${resultMessage} Учёба +${studyGain + bonus}, энергия −${lessonEnergyCost}.`, hour);
  state.time += 1;
  render();
}

function doAction(key) {
  if (!ACTIONS[key]) return;
  const action = ACTIONS[key];
  const hour = state.time;
  if ((key === "prepare" || key === "sport") && state.energy < 12) return;
  action.run(state);
  applyHourlyNeeds();
  record(`${action.name}.`, hour);
  state.time += 1;
  render();
}

function startMiniGame() {
  miniGame.round = 0;
  miniGame.playerWins = 0;
  miniGame.computerWins = 0;
  miniGame.status.textContent = "Сыграй три раунда. Выбирай свой ход!";
  miniGame.result.hidden = true;
  miniGame.continueButton.hidden = true;
  miniGame.choices.hidden = false;
  updateMiniGameScore();
  miniGame.dialog.showModal();
}

function updateMiniGameScore() {
  miniGame.score.textContent =
    `Раунд ${miniGame.round + 1} из 3 · Ты ${miniGame.playerWins} : ${miniGame.computerWins} Компьютер`;
}

function playMiniGameRound(playerMove) {
  const moves = ["камень", "бумага", "ножницы"];
  const computerMove = moves[Math.floor(Math.random() * moves.length)];
  const moveDifference = (moves.indexOf(playerMove) - moves.indexOf(computerMove) + moves.length) % moves.length;
  miniGame.round += 1;

  if (moveDifference === 1) {
    miniGame.playerWins += 1;
    miniGame.status.textContent = `Ты выбрал: ${playerMove}. Компьютер выбрал: ${computerMove}. Раунд за тобой!`;
  } else if (moveDifference === 2) {
    miniGame.computerWins += 1;
    miniGame.status.textContent = `Ты выбрал: ${playerMove}. Компьютер выбрал: ${computerMove}. Раунд за компьютером.`;
  } else {
    miniGame.status.textContent = `Ты выбрал: ${playerMove}. Компьютер выбрал: ${computerMove}. Ничья!`;
  }

  if (miniGame.round === 3) {
    miniGame.choices.hidden = true;
    miniGame.score.textContent = `Итог · Ты ${miniGame.playerWins} : ${miniGame.computerWins} Компьютер`;
    miniGame.result.textContent = miniGame.playerWins > miniGame.computerWins
      ? "Ты выиграл! Отличная игра!"
      : miniGame.playerWins < miniGame.computerWins
        ? "В этот раз компьютер победил — ничего страшного!"
        : "Ничья! Хорошая игра!";
    miniGame.result.hidden = false;
    miniGame.continueButton.hidden = false;
    return;
  }

  updateMiniGameScore();
}

function sleep() {
  if (state.time !== 21) return;
  const hour = state.time;
  const sleepQuality = clamp(100 - state.hunger * 0.42, 45, 100) / 100;
  const healthFactor = 0.85 + state.health * 0.0015;
  state.energy = Math.min(state.maxEnergy, state.energy + state.maxEnergy * sleepQuality * healthFactor);
  state.joy = 100;
  record(`Лёг спать. Утром восстановится ${Math.round(sleepQuality * healthFactor * 100)}% энергии.`, hour);
  const previousWeek = Math.floor((state.day - 1) / 7);
  state.day += 1;
  if (Math.floor((state.day - 1) / 7) > previousWeek) {
    if (state.sportSessions >= 2) {
      state.maxEnergy = Math.min(120, state.maxEnergy + 2);
      record("Спортивная неделя! Максимальная энергия +2.");
    } else {
      state.maxEnergy = Math.max(80, state.maxEnergy - 2);
      record("Мало движения на неделе: максимальная энергия −2.");
    }
    state.sportSessions = 0;
  }
  state.sportDays = Math.max(0, state.sportDays - 1);
  state.time = 8;
  state.schoolToday = null;
  state.lessonsToday = 0;
  render();
}

function makeChoice(actionKey, overrides = {}) {
  const action = ACTIONS[actionKey];
  const button = document.createElement("button");
  button.type = "button";
  button.className = `choice-button${overrides.primary ? " primary-button" : ""}`;
  button.disabled = Boolean(overrides.disabled);
  button.innerHTML = `
    <span class="choice-topline">
      <span class="choice-name">${overrides.name || action.name}</span>
      <span class="choice-icon" aria-hidden="true">${overrides.icon || action.icon}</span>
    </span>
    <span class="choice-detail">${overrides.detail || action.detail}</span>
    <span class="choice-effects">${overrides.effects || action.effects}</span>`;
  button.addEventListener("click", overrides.onClick || (() => doAction(actionKey)));
  elements.choices.append(button);
}

function makeSleepChoice() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "choice-button primary-button";
  button.innerHTML = `<span class="choice-topline"><span class="choice-name">Лечь спать</span><span class="choice-icon" aria-hidden="true">🌙</span></span>
    <span class="choice-detail">Завтра начинается новый день. Голод ухудшает восстановление энергии.</span>
    <span class="choice-effects">Энергия восстановится · радость вернётся к 100</span>`;
  button.addEventListener("click", sleep);
  elements.choices.append(button);
}

function morningChoices() {
  const options = [];
  if (isSchoolDay()) {
    options.push(
      ["breakfast", "Идти в школу", "Позавтракать дома и успеть на первый урок к 09:00.", "Завтрак · 6 уроков"],
      ["skipBreakfast", "Сразу в школу", "Пропустить завтрак, чтобы не опоздать к первому уроку.", "6 уроков · сильнее проголодаешься"],
      ["breakfast", "Остаться дома", "Позавтракать и прогулять школу.", "Завтрак · свободный день"],
      ["skipBreakfast", "Прогулять школу", "Остаться дома без завтрака.", "Свободный день · голод +6"]
    );
    options[0][4] = () => startMorning(true, true);
    options[1][4] = () => startMorning(true, false);
    options[2][4] = () => startMorning(false, true);
    options[3][4] = () => startMorning(false, false);
  } else {
    options.push(
      ["breakfast", "Позавтракать", "Неспешное утро: подкрепиться перед свободным днём.", "Голод −24 · энергия +5"],
      ["skipBreakfast", "Пропустить завтрак", "Начать свободный день сразу.", "Голод +6"]
    );
    options[0][4] = () => startMorning(false, true);
    options[1][4] = () => startMorning(false, false);
  }
  for (const [key, name, detail, effects, onClick] of options) {
    makeChoice(key, { name, detail, effects, onClick });
  }
}

function freeTimeChoices() {
  if (state.time === 12) {
    if (state.schoolToday) {
      makeChoice("schoolLunch", {
        onClick: () => doAction("schoolLunch"),
        name: "Обед в столовой",
        detail: "Перерыв между третьим и четвёртым уроком.",
        effects: "Голод −36 · энергия +12 · здоровье +2"
      });
    } else {
      makeChoice("homeLunch", { onClick: () => doAction("homeLunch") });
    }
    makeChoice("fastFood", { onClick: () => doAction("fastFood") });
    makeChoice("junk", { onClick: () => doAction("junk") });
    makeChoice("snack", { onClick: () => doAction("snack") });
    return;
  }
  makeChoice("games", { onClick: startMiniGame });
  makeChoice("friends");
  makeChoice("read");
  makeChoice("prepare", { disabled: state.energy < 12 });
  makeChoice("sport", { disabled: state.energy < 12 });
  makeChoice("rest");
  if (state.time >= 17 && state.time <= 20) {
    makeChoice("dinner", { onClick: () => doAction("dinner") });
  }
  makeChoice("snack");
}

function renderChoices() {
  elements.choices.replaceChildren();
  if (state.finished) return;
  if (state.time === 8) {
    morningChoices();
  } else if (state.time === 21) {
    makeSleepChoice();
  } else if (state.schoolToday && LESSON_HOURS.has(state.time)) {
    const lessonNumber = state.lessonsToday + 1;
    const gain = 9 + Math.floor((state.grade - 1) * 0.45);
    const task = getLessonTask();
    if (task) {
      for (const option of answerOptions(task)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button answer-button";
        button.textContent = option;
        button.addEventListener("click", () => {
          const selected = task.options ? option : Number.parseInt(option, 10);
          doLesson({
            subject: task.subject,
            correct: selected === task.answer,
            energyCost: task.energyCost
          });
        });
        elements.choices.append(button);
      }
    } else {
      makeChoice("prepare", {
        name: `Начать урок ${lessonNumber} из 6`,
        icon: "🏫",
        detail: "Учитель объясняет новую тему. Каждый урок немного утомляет.",
        effects: `Учёба +${gain} · энергия −8 · радость −1`,
        disabled: false,
        onClick: () => doLesson()
      });
    }
  } else {
    freeTimeChoices();
  }
}

function sceneCopy() {
  if (state.time === 8) {
    return ["НОВЫЙ ДЕНЬ", "Доброе утро!", "Пора просыпаться. Что будем делать сегодня?", "ДОМА · УТРО"];
  }
  if (state.time === 21) {
    return ["ДЕНЬ ЗАКАНЧИВАЕТСЯ", "Пора отдыхать", "Хороший сон поможет восстановить энергию к утру.", "ДОМА · ВЕЧЕР"];
  }
  if (state.schoolToday && LESSON_HOURS.has(state.time)) {
    const task = getLessonTask();
    if (task) {
      const energyNote = task.energyCost
        ? ` Это задание утомительнее обычного урока: энергия −${task.energyCost}.`
        : "";
      return ["ШКОЛЬНЫЙ ДЕНЬ", `${task.subject} · урок ${state.lessonsToday + 1}`, `${task.question}${energyNote}`, "ШКОЛА · ЗАДАНИЕ"];
    }
    return ["ШКОЛЬНЫЙ ДЕНЬ", `Урок ${state.lessonsToday + 1} из 6`, "Внимательно слушай — знания пригодятся в следующем классе.", "ШКОЛА · УРОК"];
  }
  if (state.schoolToday && state.time === 12) {
    return ["БОЛЬШАЯ ПЕРЕМЕНА", "Время обеда", "После третьего урока можно поесть в столовой.", "ШКОЛА · ОБЕД"];
  }
  if (state.schoolToday && state.time === 16) {
    return ["УРОКИ ЗАКОНЧИЛИСЬ", "Школа позади!", "Шесть уроков пройдены. Теперь можно выбрать занятие.", "ДОМА · ПОСЛЕ ШКОЛЫ"];
  }
  if (state.schoolToday && state.time > 12 && state.time < 16) {
    return ["ШКОЛЬНЫЙ ДЕНЬ", "После обеда", "Впереди ещё уроки, а потом — свободное время.", "ШКОЛА · УРОК"];
  }
  if (state.time === 12) {
    return ["СЕРЕДИНА ДНЯ", "Время пообедать", "Сытный обед — самый важный приём пищи.", "ДОМА · ОБЕД"];
  }
  if (state.schoolToday && state.time < 12) {
    return ["ШКОЛЬНЫЙ ДЕНЬ", "Утренние уроки", "После каждого урока наступает следующий час.", "ШКОЛА · УРОК"];
  }
  if (state.time >= 17) {
    return ["СВОБОДНОЕ ВРЕМЯ", "Вечер дома", "Отдыхай, занимайся или помоги себе вкусным ужином.", "ДОМА · ВЕЧЕР"];
  }
  return ["СВОБОДНЫЙ ДЕНЬ", "Чем займёмся?", "Выбирай занятие на этот час. Не забывай отдыхать и есть.", "ДОМА · ДЕНЬ"];
}

function renderJournal() {
  elements.journal.replaceChildren();
  if (state.journal.length === 0) {
    const empty = document.createElement("li");
    empty.className = "journal-empty";
    empty.textContent = "Здесь появятся события твоего дня.";
    elements.journal.append(empty);
    return;
  }
  for (const item of state.journal) {
    const row = document.createElement("li");
    row.className = "journal-entry";
    const time = document.createElement("span");
    time.className = "journal-time";
    time.textContent = `${item.day}д · ${item.time}`;
    const message = document.createElement("span");
    message.textContent = item.message;
    row.append(time, message);
    elements.journal.append(row);
  }
}

function render() {
  normalizeStats();
  const goal = gradeGoal();
  const copy = sceneCopy();
  const scene = document.querySelector(".scene-sky");
  const isLunchBreak = state.schoolToday && state.time === 12;
  const isInClassroom = state.schoolToday && state.time >= 9 && state.time <= 15 && !isLunchBreak;
  scene.classList.toggle("school-scene", isInClassroom);
  scene.classList.toggle("cafeteria-scene", isLunchBreak);
  elements.grade.textContent = state.grade <= 12 ? GRADE_NAMES[state.grade - 1] : "Выпускник";
  elements.joy.textContent = Math.round(state.joy);
  elements.energy.textContent = `${Math.round(state.energy)} / ${state.maxEnergy}`;
  elements.hunger.textContent = Math.round(state.hunger);
  elements.health.textContent = Math.round(state.health);
  elements.joyBar.style.width = `${state.joy}%`;
  elements.energyBar.style.width = `${(state.energy / state.maxEnergy) * 100}%`;
  elements.hungerBar.style.width = `${state.hunger}%`;
  elements.healthBar.style.width = `${state.health}%`;
  elements.studyValue.textContent = `${Math.floor(state.study)} / ${goal}`;
  elements.studyBar.style.width = `${clamp((state.study / goal) * 100)}%`;
  elements.sceneKicker.textContent = copy[0];
  elements.sceneTitle.textContent = copy[1];
  elements.sceneDescription.textContent = copy[2];
  elements.clock.textContent = formatTime(state.time);
  elements.day.textContent = `День ${state.day} · ${WEEKDAYS[weekdayIndex()]}`;
  elements.location.textContent = copy[3];
  elements.eventTitle.textContent = copy[1];
  elements.eventDescription.textContent = copy[2];
  renderChoices();
  renderJournal();
  saveGame();
  if (state.finished && !elements.victory.open) elements.victory.showModal();
}

document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Начать новую историю? Текущий прогресс будет удалён.")) return;
  state = newGame();
  saveGame();
  render();
});

document.querySelector("#victory-reset").addEventListener("click", () => {
  state = newGame();
  elements.victory.close();
  saveGame();
  render();
});

miniGame.choices.addEventListener("click", (event) => {
  const button = event.target.closest("[data-move]");
  if (button) playMiniGameRound(button.dataset.move);
});

miniGame.continueButton.addEventListener("click", () => {
  miniGame.dialog.close();
  doAction("games");
});

render();

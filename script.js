// ====================== MINDFLIP - Enhanced script.js ======================
// Features: Timer System + Improved Score & High Score Logic

const symbols = ["🚀", "👽", "🌕", "🛸", "⭐", "🌌", "☄️", "🪐", "🤖", "📡", "🛰️", "🔭"];

let cards = [], flipped = [];
let players = ["P1", "P2"];
let scores = [0, 0];
let turn = 0;
let mode = "single";
let difficulty = 4;
let selectedLevel = 1;
let lockBoard = false;

// === TIMER SYSTEM ===
let timerInterval = null;
let secondsElapsed = 0;
let gameStartTime = 0;

function startTimer() {
    stopTimer(); // Clear any existing timer
    secondsElapsed = 0;
    gameStartTime = Date.now();
    
    timerInterval = setInterval(() => {
        secondsElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = `⏱ ${timeString}`;
}

function getFormattedTime() {
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// === SOUND ENGINE (WAV) ===
const sounds = {
    flip: new Audio('./assets/flip.wav'),
    match: new Audio('./assets/match.wav'),
    wrong: new Audio('./assets/wrong.wav'),
    win: new Audio('./assets/win.wav')
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {});
    }
}

// === BACKGROUND ANIMATION ===
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let stars = [];

function initBG() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2
    }));
}

function animateBG() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
        s.y += 0.2;
        if (s.y > canvas.height) s.y = 0;
    });
    requestAnimationFrame(animateBG);
}

// === HIGH SCORE KEY (Score + Time) ===
function getHighScoreKey() {
    return `mindflip_d${difficulty}_l${selectedLevel}`;
}

// Save high score with both Score and Time (lower time is better)
function saveHighScore(finalScore, finalTimeInSeconds) {
    const key = getHighScoreKey();
    const currentBest = JSON.parse(localStorage.getItem(key)) || { score: 0, time: Infinity };

    let isNewRecord = false;
    let isBetterTime = false;

    if (finalScore > currentBest.score) {
        isNewRecord = true;
    } else if (finalScore === currentBest.score && finalTimeInSeconds < currentBest.time) {
        isBetterTime = true;
    }

    if (isNewRecord || isBetterTime) {
        localStorage.setItem(key, JSON.stringify({
            score: finalScore,
            time: finalTimeInSeconds,
            timeFormatted: getFormattedTime()
        }));
    }

    return { isNewRecord, isBetterTime };
}

function getBestScoreData() {
    const key = getHighScoreKey();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { score: 0, time: Infinity, timeFormatted: "--:--" };
}

// === MENU LOGIC ===
window.selectMode = (m, btn) => {
    mode = m;
    document.querySelectorAll("#modeSelect button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("p2").style.display = (m === 'multi') ? "block" : "none";
};

window.selectDiff = (d, btn) => {
    difficulty = d;
    document.querySelectorAll("#diffSelect button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
};

// Generate Levels
const levelContainer = document.getElementById("levels");
for (let i = 1; i <= 40; i++) {
    let btn = document.createElement("button");
    btn.innerText = i;
    btn.className = "level-btn" + (i === 1 ? " active" : "");
    btn.onclick = () => {
        selectedLevel = i;
        document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        updateUI();
    };
    levelContainer.appendChild(btn);
}

// === GAME START ===
window.startGame = () => {
    // Mobile sound unlock
    Object.values(sounds).forEach(s => {
        s.load();
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
    });

    document.getElementById("menu").style.display = "none";
    document.getElementById("victory-screen").style.display = "none";

    players[0] = document.getElementById("p1").value || "Player 1";
    players[1] = document.getElementById("p2").value || "Player 2";

    scores = [0, 0];
    turn = 0;
    flipped = [];
    lockBoard = false;
    secondsElapsed = 0;

    loadGame();
    startTimer();        // ← Timer starts here
};

function loadGame() {
    let size = difficulty;
    if (selectedLevel > 10 && size < 6) size = 6;
    if (selectedLevel > 20 && size < 8) size = 8;

    const grid = document.getElementById("grid");
    grid.style.gridTemplateColumns = `repeat(${size}, min(70px, 18vw))`;

    const pairCount = (size * size) / 2;
    const selectedSymbols = symbols.slice(0, pairCount);
    cards = [...selectedSymbols, ...selectedSymbols].sort(() => Math.random() - 0.5);

    grid.innerHTML = "";
    cards.forEach(sym => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<div class="inner"><div class="front"></div><div class="back">${sym}</div></div>`;
        card.onclick = () => flip(card, sym);
        grid.appendChild(card);
    });

    updateUI();
}

function flip(card, sym) {
    if (lockBoard || card.classList.contains("flipped")) return;
   
    playSound('flip');
    card.classList.add("flipped");
    flipped.push({ card, sym });

    if (flipped.length === 2) {
        lockBoard = true;
        setTimeout(checkMatch, 600);
    }
}

function checkMatch() {
    const [a, b] = flipped;
    if (a.sym === b.sym) {
        playSound('match');
        scores[turn]++;
        flipped = [];
        lockBoard = false;

        if (document.querySelectorAll(".flipped").length === cards.length) {
            endGame();
        }
    } else {
        playSound('wrong');
        setTimeout(() => {
            a.card.classList.remove("flipped");
            b.card.classList.remove("flipped");
            flipped = [];
            lockBoard = false;
            if (mode === "multi") turn = (turn === 0) ? 1 : 0;
            updateUI();
        }, 400);
    }
    updateUI();
}

function endGame() {
    stopTimer();           // ← Timer stops here
    playSound('win');

    let winnerName = mode === "single" ? players[0] :
        scores[0] > scores[1] ? players[0] :
        scores[1] > scores[0] ? players[1] : "Draw";

    let isNewRecord = false;
    let isBetterTime = false;

    if (mode === "single") {
        const result = saveHighScore(scores[0], secondsElapsed);
        isNewRecord = result.isNewRecord;
        isBetterTime = result.isBetterTime;
    }

    setTimeout(() => {
        const winDisplay = document.getElementById("winner-display");
        const recordMsg = document.getElementById("record-msg");

        winDisplay.innerText = winnerName === "Draw" ? "🤝 Draw!" : "🏆 " + winnerName + "!";

        let recordText = "";
        if (isNewRecord) recordText = "⭐ NEW RECORD! ⭐";
        else if (isBetterTime) recordText = "⚡ FASTER TIME! ⚡";

        recordMsg.innerHTML = recordText + 
            `<br><small style="opacity:0.7">Time: ${getFormattedTime()} | Score: ${scores[0]}</small>`;

        document.getElementById("victory-screen").style.display = "flex";
    }, 600);
}

window.restartLevel = () => {
    stopTimer();
    document.getElementById("victory-screen").style.display = "none";
    scores = [0, 0];
    turn = 0;
    flipped = [];
    lockBoard = false;
    loadGame();
    startTimer();
};

window.backToMenu = () => {
    stopTimer();
    document.getElementById("victory-screen").style.display = "none";
    document.getElementById("menu").style.display = "flex";
    document.getElementById("grid").innerHTML = "";
};

// === UPDATED UI (with Timer) ===
function updateUI() {
    const stats = document.getElementById("stats");
    const turnDiv = document.getElementById("turn");

    if (mode === "multi") {
        turnDiv.innerText = `${players[turn]}'s Turn`;
        stats.innerText = `${players[0]}: ${scores[0]} | ${players[1]}: ${scores[1]}`;
    } else {
        const best = getBestScoreData();
        turnDiv.innerText = "";
        stats.innerHTML = `
            Score: ${scores[0]} 
            <span style="opacity:0.4; font-size:0.85rem; margin-left:12px;">
                Best: ${best.score} (${best.timeFormatted})
            </span>
        `;
    }
}

// === INITIALIZATION ===
function initializeGame() {
    initBG();
    animateBG();
    window.addEventListener('resize', initBG);

    // Add Timer Element to DOM if not present
    if (!document.getElementById('timer')) {
        const timerDiv = document.createElement('div');
        timerDiv.id = 'timer';
        timerDiv.style.cssText = 'position:fixed; top:70px; right:20px; color:#00f0ff; font-size:1.3rem; font-weight:bold; text-shadow:0 0 10px #00f0ff; z-index:100;';
        document.body.appendChild(timerDiv);
    }

    console.log("%c🚀 MindFlip Enhanced: Timer + Smart High Score System Active!", "color:#00f0ff; font-size:1.1rem;");
}

initializeGame();

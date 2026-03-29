// ====================== MINDFLIP - script.js ======================

const symbols = ["🚀","👽","🌕","🛸","⭐","🌌","☄️","🪐","🤖","📡","🛰️","🔭"];

let cards = [], flipped = [];
let players = ["P1", "P2"];
let scores = [0, 0];
let turn = 0;
let mode = "single";
let difficulty = 4;
let selectedLevel = 1;
let lockBoard = false;

// ====================== USER SYSTEM (JSON Style) ======================
let usersDB = [];
let currentUser = null;

function loadUsersFromStorage() {
    const saved = localStorage.getItem('mindflip_users');
    if (saved) {
        usersDB = JSON.parse(saved);
    } else {
        // First time: Load sample from knowledge_base.json style
        usersDB = [
            {
                "username": "spacecadet",
                "password": "123456",
                "email": "cadet@mindflip.space",
                "joined": "2026-03-01",
                "highscores": {}
            }
        ];
        saveUsersDB();
    }
}

const savedUsername = localStorage.getItem('mindflip_current_user');
if (savedUsername) {
    currentUser = usersDB.find(u => u.username === savedUsername);
}

function saveUsersDB() {
    localStorage.setItem('mindflip_users', JSON.stringify(usersDB));
}

function getHighScoreKey() {
    return `mindflip_best_d${difficulty}_l${selectedLevel}`;
}

function getBestScore() {
    const key = getHighScoreKey();
    if (currentUser && currentUser.highscores) {
        return currentUser.highscores[key] || 0;
    }
    return parseInt(localStorage.getItem(key)) || 0;
}

function saveBestScore(newScore) {
    const key = getHighScoreKey();
    if (currentUser && currentUser.highscores) {
        if (newScore > (currentUser.highscores[key] || 0)) {
            currentUser.highscores[key] = newScore;
            saveUsersDB();
        }
        return;
    }
    const prev = parseInt(localStorage.getItem(key)) || 0;
    if (newScore > prev) {
        localStorage.setItem(key, newScore);
    }
}

// ====================== MUSIC ======================
let menuMusic, winMusic;
let isMuted = false;

function initMusic() {
    menuMusic = document.getElementById('menuMusic');
    winMusic = document.getElementById('winMusic');
}

function stopAllMusic() {
    if (menuMusic) menuMusic.pause();
    if (winMusic) winMusic.pause();
}

function playMenuMusic() {
    stopAllMusic();
    if (!isMuted && menuMusic) menuMusic.play().catch(() => {});
}

function playWinMusic() {
    stopAllMusic();
    if (!isMuted && winMusic) winMusic.play().catch(() => {});
}

window.toggleMusic = () => {
    isMuted = !isMuted;
    document.getElementById('music-btn').textContent = isMuted ? '🔇' : '🎵';
    if (isMuted) stopAllMusic();
    else {
        if (document.getElementById('menu').style.display !== 'none') playMenuMusic();
        if (document.getElementById('victory-screen').style.display === 'flex') playWinMusic();
    }
};

// ====================== AUTH SYSTEM ======================
function renderAuthBar() {
    const container = document.getElementById('auth-bar-container');
    if (currentUser) {
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,240,255,0.15);padding:10px 15px;border-radius:8px;color:#00f0ff;font-weight:bold;">
                <span>👤 ${currentUser.username}</span>
                <button onclick="logout()" style="background:#ff0066;color:white;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;">Logout</button>
            </div>`;
    } else {
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.08);padding:10px 15px;border-radius:8px;">
                <span style="color:#aaa;">Guest Pilot</span>
                <div>
                    <button onclick="showAuthModal('login')" style="margin-right:8px;background:#00f0ff;color:#000;border:none;padding:6px 14px;border-radius:6px;">Sign In</button>
                    <button onclick="showAuthModal('signup')" style="background:#ff00aa;color:white;border:none;padding:6px 14px;border-radius:6px;">Sign Up</button>
                </div>
            </div>`;
    }
}

window.showAuthModal = (authMode) => {
    const modal = document.getElementById('auth-screen');
    document.getElementById('auth-title').innerHTML = authMode === 'signup' ? '🌌 CREATE ACCOUNT' : '🔑 SIGN IN';
    document.getElementById('signup-fields').style.display = authMode === 'signup' ? 'block' : 'none';
    document.getElementById('auth-msg').textContent = '';
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-email').value = '';
    modal.dataset.authMode = authMode;
    modal.style.display = 'flex';
};

window.hideAuth = () => document.getElementById('auth-screen').style.display = 'none';

window.toggleAuthMode = () => {
    const modal = document.getElementById('auth-screen');
    showAuthModal(modal.dataset.authMode === 'login' ? 'signup' : 'login');
};

window.handleAuth = () => {
    const modal = document.getElementById('auth-screen');
    const mode = modal.dataset.authMode;
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const msg = document.getElementById('auth-msg');

    if (!username || !password) {
        msg.style.color = '#ff00aa';
        msg.textContent = '⚠️ Username and password required!';
        return;
    }

    if (mode === 'signup') {
        if (usersDB.find(u => u.username === username)) {
            msg.style.color = '#ff00aa';
            msg.textContent = '❌ Username already exists!';
            return;
        }
        const newUser = {
            username: username,
            password: password,
            email: document.getElementById('auth-email').value.trim() || '',
            joined: new Date().toISOString().split('T')[0],
            highscores: {}
        };
        usersDB.push(newUser);
        saveUsersDB();
        currentUser = newUser;
        localStorage.setItem('mindflip_current_user', username);
        
        msg.style.color = '#00ffaa';
        msg.textContent = '✅ Account created successfully!';
        setTimeout(() => { hideAuth(); renderAuthBar(); }, 1500);
    } else {
        const user = usersDB.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('mindflip_current_user', username);
            msg.style.color = '#00ffaa';
            msg.textContent = `✅ Welcome back, ${username}!`;
            setTimeout(() => { hideAuth(); renderAuthBar(); }, 1200);
        } else {
            msg.style.color = '#ff00aa';
            msg.textContent = '❌ Incorrect credentials!';
        }
    }
};

window.logout = () => {
    currentUser = null;
    localStorage.removeItem('mindflip_current_user');
    renderAuthBar();
};

// ====================== BACKGROUND ======================
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

// ====================== GAME LOGIC ======================
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
    };
    levelContainer.appendChild(btn);
}

window.startGame = () => {
    const soundFiles = ['flip.mp3', 'match.mp3', 'wrong.mp3', 'win.mp3'];
    soundFiles.forEach(file => {
        const audio = new Audio(file);
        audio.play().then(() => audio.pause()).catch(() => {});
    });

    stopAllMusic();
    document.getElementById("menu").style.display = "none";
    document.getElementById("victory-screen").style.display = "none";

    players[0] = document.getElementById("p1").value || "Player 1";
    players[1] = document.getElementById("p2").value || "Player 2";

    scores = [0, 0];
    turn = 0;
    flipped = [];
    lockBoard = false;
    loadGame();
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
    new Audio('flip.mp3').play().catch(() => {});
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
        new Audio('match.mp3').play().catch(() => {});
        scores[turn]++;
        flipped = [];
        lockBoard = false;
        if (document.querySelectorAll(".flipped").length === cards.length) endGame();
    } else {
        new Audio('wrong.mp3').play().catch(() => {});
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
    new Audio('win.mp3').play().catch(() => {});
    playWinMusic();

    let winner = mode === "single" ? players[0] :
        scores[0] > scores[1] ? players[0] :
        scores[1] > scores[0] ? players[1] : "Draw";

    let isNewRecord = false;
    if (mode === "single") {
        const prev = getBestScore();
        if (scores[0] > prev) {
            saveBestScore(scores[0]);
            isNewRecord = true;
        }
    }

    setTimeout(() => {
        document.getElementById("winner-display").innerText = winner === "Draw" ? "🤝 Draw!" : "🏆 " + winner + "!";
        document.getElementById("record-msg").innerText = isNewRecord ? "⭐ NEW RECORD ⭐" : "";
        document.getElementById("victory-screen").style.display = "flex";
    }, 500);
}

window.restartLevel = () => {
    stopAllMusic();
    document.getElementById("victory-screen").style.display = "none";
    scores = [0, 0];
    turn = 0;
    flipped = [];
    lockBoard = false;
    loadGame();
};

window.backToMenu = () => {
    stopAllMusic();
    playMenuMusic();
    document.getElementById("victory-screen").style.display = "none";
    document.getElementById("menu").style.display = "flex";
    document.getElementById("grid").innerHTML = "";
};

function updateUI() {
    const stats = document.getElementById("stats");
    const turnDiv = document.getElementById("turn");

    if (mode === "multi") {
        turnDiv.innerText = `${players[turn]}'s Turn`;
        stats.innerText = `${players[0]}: ${scores[0]} | ${players[1]}: ${scores[1]}`;
    } else {
        const best = getBestScore();
        turnDiv.innerText = "";
        stats.innerHTML = `Score: ${scores[0]} <span style="opacity:0.4; font-size:0.85rem; margin-left:10px;">Best: ${best}</span>`;
    }
}

// ====================== INIT ======================
function initializeGame() {
    loadUsersFromStorage();
    initBG();
    animateBG();
    window.addEventListener('resize', initBG);
    initMusic();
    renderAuthBar();
    playMenuMusic();

    console.log("%c🚀 MindFlip Ready! (Using knowledge_base.json structure)", "color:#00f0ff;font-size:1.1rem;");
}

initializeGame();

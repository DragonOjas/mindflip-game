// ====================== MINDFLIP CORE ENGINE ======================
const symbols = ["🚀","👽","🌕","🛸","⭐","🌌","☄️","🪐","🤖","📡","🛰️","🔭"];
let cards = [], flipped = [];
let players = ["P1", "P2"], scores = [0, 0], turn = 0;
let mode = "single", difficulty = 4, selectedLevel = 1, lockBoard = false;
let usersDB = [], currentUser = null;
let isMuted = false;

const menuMusic = document.getElementById('menuMusic');
const winMusic = document.getElementById('winMusic');

// --- INITIALIZATION ---
window.onload = () => {
    loadUsersFromStorage();
    initBG();
    animateBG();
    generateLevelButtons();
    
    // Resume audio on first interaction (Browser Security)
    document.body.addEventListener('click', () => {
        if(!isMuted && menuMusic.paused) menuMusic.play().catch(()=>{});
    }, {once: true});
};

function generateLevelButtons() {
    const container = document.getElementById("levels");
    for (let i = 1; i <= 40; i++) {
        let btn = document.createElement("button");
        btn.innerText = i;
        btn.className = "level-btn" + (i === 1 ? " active" : "");
        btn.onclick = () => {
            selectedLevel = i;
            document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
            btn.className = "level-btn active";
        };
        container.appendChild(btn);
    }
}

// --- GAME LOGIC ---
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

window.startGame = () => {
    document.getElementById("menu").style.display = "none";
    document.getElementById("stats-bar").style.display = "flex";
    players[0] = document.getElementById("p1").value || "Pilot 1";
    players[1] = document.getElementById("p2").value || "Pilot 2";
    scores = [0, 0]; turn = 0;
    loadGame();
};

function loadGame() {
    const grid = document.getElementById("grid");
    const totalCards = difficulty * difficulty;
    const pairCount = totalCards / 2;

    // Build deck (Recycle symbols if difficulty exceeds symbol count)
    let gameSymbols = [];
    for(let i=0; i<pairCount; i++) {
        gameSymbols.push(symbols[i % symbols.length]);
    }
    cards = [...gameSymbols, ...gameSymbols].sort(() => Math.random() - 0.5);

    grid.style.gridTemplateColumns = `repeat(${difficulty}, min(70px, 18vw))`;
    grid.innerHTML = "";
    
    cards.forEach((sym) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="inner">
                <div class="front"></div>
                <div class="back">${sym}</div>
            </div>`;
        card.onclick = () => flip(card, sym);
        grid.appendChild(card);
    });
    updateUI();
}

function flip(card, sym) {
    if (lockBoard || card.classList.contains("flipped")) return;
    
    card.classList.add("flipped");
    flipped.push({ card, sym });

    if (flipped.length === 2) {
        lockBoard = true;
        setTimeout(checkMatch, 700);
    }
}

function checkMatch() {
    const [a, b] = flipped;
    if (a.sym === b.sym) {
        scores[turn]++;
        flipped = [];
        lockBoard = false;
        if (document.querySelectorAll(".flipped").length === cards.length) endGame();
    } else {
        setTimeout(() => {
            a.card.classList.remove("flipped");
            b.card.classList.remove("flipped");
            if (mode === "multi") turn = (turn === 0) ? 1 : 0;
            flipped = [];
            lockBoard = false;
            updateUI();
        }, 600);
    }
    updateUI();
}

function updateUI() {
    const scoreDiv = document.getElementById("score-display");
    const turnDiv = document.getElementById("turn-display");
    
    if (mode === "multi") {
        turnDiv.innerText = `Active: ${players[turn]}`;
        scoreDiv.innerText = `${players[0]}: ${scores[0]} | ${players[1]}: ${scores[1]}`;
    } else {
        turnDiv.innerText = `Mission Level ${selectedLevel}`;
        scoreDiv.innerText = `Score: ${scores[0]}`;
    }
}

function endGame() {
    menuMusic.pause();
    if(!isMuted) winMusic.play().catch(()=>{});
    
    const winnerDisplay = document.getElementById("winner-display");
    if (mode === "multi") {
        const winName = scores[0] > scores[1] ? players[0] : players[1];
        winnerDisplay.innerText = scores[0] === scores[1] ? "It's a Tie!" : `🏆 ${winName} Wins!`;
    } else {
        winnerDisplay.innerText = "Mission Complete!";
    }
    document.getElementById("victory-screen").style.display = "flex";
}

window.backToMenu = () => {
    winMusic.pause();
    if(!isMuted) menuMusic.play();
    document.getElementById("victory-screen").style.display = "none";
    document.getElementById("stats-bar").style.display = "none";
    document.getElementById("menu").style.display = "flex";
    document.getElementById("grid").innerHTML = "";
};

window.restartLevel = () => {
    winMusic.pause();
    if(!isMuted) menuMusic.play();
    document.getElementById("victory-screen").style.display = "none";
    startGame();
};

// --- BACKGROUND STAR ANIMATION ---
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let stars = [];

function initBG() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
    }));
}

function animateBG() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
    });
    requestAnimationFrame(animateBG);
}

// --- MUSIC ---
window.toggleMusic = () => {
    isMuted = !isMuted;
    document.getElementById('music-btn').textContent = isMuted ? '🔇' : '🎵';
    if(isMuted) {
        menuMusic.pause(); winMusic.pause();
    } else {
        document.getElementById("victory-screen").style.display === "none" ? menuMusic.play() : winMusic.play();
    }
};

function loadUsersFromStorage() {
    const saved = localStorage.getItem('mindflip_users');
    usersDB = saved ? JSON.parse(saved) : [];
}

// State Management
let gameState = {
    playerName: "",
    gender: "Masculino",
    race: "Humano",
    class: "Guerreiro",
    rank: "E",
    level: 1,
    xp: 0,
    maxXp: 100,
    statPoints: 0,
    attributes: { STR: 10, VIT: 10, AGI: 10, INT: 10, SEN: 10 },
    quests: [
        { id: 'pushups', name: 'FLEXÕES', goal: 100, current: 0 },
        { id: 'situps', name: 'ABDOMINAIS', goal: 100, current: 0 },
        { id: 'running', name: 'CORRIDA', goal: 10, current: 0, unit: 'km' }
    ],
    profilePic: null,
    lastUpdate: new Date().toDateString()
};

const raceData = {
    "Humano": {
        desc: "Equilibrado e versátil. Ganho de XP aumentado em 10%.",
        ability: "Vontade Inabalável: Pequena chance de resistir a danos fatais."
    },
    "Elfo": {
        desc: "Ágil e conectado à magia. Bônus natural em AGI e INT.",
        ability: "Mimetismo: Dificulta a detecção por inimigos de rank baixo."
    },
    "Orc": {
        desc: "Força bruta e resistência. Bônus massivo em STR e VIT.",
        ability: "Fúria de Sangue: Dano aumenta conforme a vida diminui."
    },
    "Morto-Vivo": {
        desc: "Incansável e sombrio. Não sofre penalidades de cansaço.",
        ability: "Toque Gélido: Seus ataques podem reduzir a agilidade do alvo."
    }
};

// DOM Refs
const overlay = document.getElementById('awakening-overlay');
const creationScreen = document.querySelector('.char-creation');
const loadingScreen = document.querySelector('.system-loading');
const mainSystem = document.getElementById('main-system');
let radarChart;

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    if (gameState.playerName) {
        overlay.classList.add('hidden');
        showMainSystem();
    } else {
        runAwakening();
    }
    setupEventListeners();
});

function runAwakening() {
    setTimeout(() => {
        document.querySelector('.awakening-text-container').classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        let prog = 0;
        const itv = setInterval(() => {
            prog += Math.floor(Math.random() * 5) + 2;
            if (prog > 101) prog = 101;
            document.querySelector('.loading-bar').style.width = prog + '%';
            document.querySelector('.loading-percentage').innerText = prog + '%';
            if (prog >= 101) {
                clearInterval(itv);
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    creationScreen.classList.remove('hidden');
                }, 800);
            }
        }, 50);
    }, 4000);
}

window.updateRaceDescription = function() {
    const race = document.getElementById('player-race').value;
    const info = raceData[race];
    document.getElementById('race-description').innerHTML = `<strong>${race}:</strong> ${info.desc}`;
};

function setupEventListeners() {
    document.getElementById('confirm-creation-btn').addEventListener('click', () => {
        const name = document.getElementById('player-name-input').value.trim();
        if (!name) return alert("INSIRA SEU NOME, JOGADOR");
        
        gameState.playerName = name.toUpperCase();
        gameState.gender = document.getElementById('player-gender').value;
        gameState.race = document.getElementById('player-race').value;
        gameState.class = document.getElementById('player-class').value;
        saveGame();
        
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.add('hidden');
            showMainSystem();
        }, 1000);
    });

    document.getElementById('profile-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                gameState.profilePic = event.target.result;
                document.getElementById('avatar-img').src = gameState.profilePic;
                saveGame();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('side-menu').classList.toggle('active');
    });

    document.querySelectorAll('.side-menu li').forEach(li => {
        li.addEventListener('click', () => {
            const screenId = li.getAttribute('data-screen');
            if (screenId === 'leaderboard' || screenId === 'settings') return alert("SISTEMA: FUNCIONALIDADE EM DESENVOLVIMENTO.");
            
            document.querySelectorAll('.system-screen').forEach(s => s.classList.remove('active', 'hidden'));
            document.querySelectorAll('.system-screen').forEach(s => {
                if(s.id !== 'screen-' + screenId) s.classList.add('hidden');
                else s.classList.add('active');
            });
            
            document.querySelectorAll('.side-menu li').forEach(l => l.classList.remove('active'));
            li.classList.add('active');
            document.getElementById('side-menu').classList.remove('active');
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active', 'hidden'));
            document.querySelectorAll('.tab-content').forEach(c => {
                if(c.id !== tab + '-content') c.classList.add('hidden');
                else c.classList.add('active');
            });
            btn.classList.add('active');
        });
    });
}

function showMainSystem() {
    mainSystem.classList.remove('hidden');
    updateUI();
    initRadar();
}

function updateUI() {
    document.getElementById('display-name').innerText = gameState.playerName;
    document.getElementById('player-rank').innerText = "RANK " + gameState.rank;
    document.getElementById('display-gender').innerText = gameState.gender;
    document.getElementById('display-race').innerText = gameState.race;
    document.getElementById('display-class').innerText = gameState.class;
    document.getElementById('display-level').innerText = gameState.level;
    document.getElementById('current-xp').innerText = gameState.xp;
    document.getElementById('next-level-xp').innerText = gameState.maxXp;
    document.getElementById('stat-points').innerText = gameState.statPoints;
    document.getElementById('xp-fill').style.width = (gameState.xp/gameState.maxXp*100) + '%';
    document.getElementById('display-ability').innerText = raceData[gameState.race].ability;
    
    if (gameState.profilePic) {
        document.getElementById('avatar-img').src = gameState.profilePic;
    }

    renderStats();
    renderQuests();
}

function renderStats() {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';
    const labels = { STR: 'FORÇA', VIT: 'VITALIDADE', AGI: 'AGILIDADE', INT: 'INTELIGÊNCIA', SEN: 'SENTIDO' };
    
    Object.keys(gameState.attributes).forEach(key => {
        const div = document.createElement('div');
        div.className = 'stat-row';
        div.innerHTML = `
            <label>${labels[key]}</label>
            <span class="stat-val">${gameState.attributes[key]}</span>
            ${gameState.statPoints > 0 ? `<button class="add-stat" onclick="addStat('${key}')">+</button>` : ''}
        `;
        container.appendChild(div);
    });
}

function renderQuests() {
    const list = document.getElementById('daily-quests-list');
    list.innerHTML = '';
    let completedCount = 0;
    
    gameState.quests.forEach(q => {
        const done = q.current >= q.goal;
        if (done) completedCount++;
        const item = document.createElement('div');
        item.className = 'quest-item';
        item.innerHTML = `
            <p>${q.name} (${q.current}/${q.goal} ${q.unit||''})</p>
            <div class="quest-controls">
                <button class="quest-btn" onclick="addQuestProgress('${q.id}')">+ PROGRESSO</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    const claim = document.getElementById('claim-reward-btn');
    if (completedCount === gameState.quests.length) claim.classList.remove('hidden');
    else claim.classList.add('hidden');
}

window.addStat = (key) => {
    if (gameState.statPoints > 0) {
        gameState.attributes[key]++;
        gameState.statPoints--;
        updateUI();
        updateRadar();
        saveGame();
    }
};

window.addQuestProgress = (id) => {
    const q = gameState.quests.find(x => x.id === id);
    const inc = id === 'running' ? 1 : 10;
    if (q.current < q.goal) {
        q.current += inc;
        updateUI();
        saveGame();
    }
};

window.claimReward = () => {
    const anim = document.getElementById('quest-cleared-animation');
    anim.classList.remove('hidden');
    
    gainXP(200);
    
    setTimeout(() => {
        anim.classList.add('hidden');
        gameState.quests.forEach(q => q.current = 0);
        updateUI();
        saveGame();
    }, 3000);
};

function gainXP(amount) {
    gameState.xp += amount;
    while(gameState.xp >= gameState.maxXp) {
        gameState.xp -= gameState.maxXp;
        gameState.level++;
        gameState.statPoints += 5;
        gameState.maxXp = Math.floor(gameState.maxXp * 1.3);
        updateRank();
    }
}

function updateRank() {
    const ranks = ["E", "D", "C", "B", "A", "S"];
    const thresholds = [0, 10, 25, 45, 70, 100];
    for(let i = thresholds.length-1; i >= 0; i--) {
        if(gameState.level >= thresholds[i]) {
            gameState.rank = ranks[i];
            break;
        }
    }
}

function initRadar() {
    const ctx = document.getElementById('attribute-radar');
    if (radarChart) radarChart.destroy();
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['FOR', 'VIT', 'AGI', 'INT', 'SEN'],
            datasets: [{
                data: Object.values(gameState.attributes),
                backgroundColor: 'rgba(0, 242, 255, 0.2)',
                borderColor: '#00f2ff',
                pointBackgroundColor: '#00f2ff',
                borderWidth: 2
            }]
        },
        options: {
            scales: { 
                r: { 
                    angleLines: { color: 'rgba(255,255,255,0.1)' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { display: false }, 
                    suggestedMin: 0,
                    suggestedMax: 20,
                    pointLabels: { color: '#00f2ff' }
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateRadar() {
    if (radarChart) {
        radarChart.data.datasets[0].data = Object.values(gameState.attributes);
        radarChart.update();
    }
}

function saveGame() { localStorage.setItem('soloSave_v3', JSON.stringify(gameState)); }
function loadGame() {
    const saved = localStorage.getItem('soloSave_v3');
    if (saved) gameState = JSON.parse(saved);
}

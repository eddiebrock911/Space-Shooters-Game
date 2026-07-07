// Space Shooter - Main Game Logic

// References to HTML elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game State Enum
const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  LEVEL_SELECT: 'LEVEL_SELECT',
  HANGAR: 'HANGAR',
  UPGRADES: 'UPGRADES',
  ACHIEVEMENTS: 'ACHIEVEMENTS',
  LEADERBOARD: 'LEADERBOARD',
  SETTINGS: 'SETTINGS',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  BOSS_WARNING: 'BOSS_WARNING'
};

let gameState = STATES.MENU;
let previousState = STATES.MENU; // For returning from settings
let gameMode = 'endless'; // 'endless' or 'story'
let currentLevel = 1;

// FPS calculation
let lastFrameTime = performance.now();
let fps = 60;
let fpsCounterEl = document.getElementById('fpsCounter');

// Screen Shake variables
let shakeTime = 0;
let shakeIntensity = 0;
let shakeType = 'low'; // none, low, high

// System variables
let keys = {};
let score = 0;
let levelScore = 0; // Score in current level
let totalKills = 0;
let runKills = 0;
let coinsCollected = 0;
let runCoins = 0;
let startTime = 0;
let playTime = 0; // Total play time in current run

// Combo System
let comboCount = 0;
let maxComboThisRun = 0;
let lastKillTime = 0;
const COMBO_COOLDOWN = 2500; // 2.5 seconds to chain kills

// Save Data (LocalStorage)
let saveData = {
  coins: 0,
  unlockedShips: ['basic'],
  selectedShip: 'basic',
  upgrades: { weapon: 1, lives: 0, speed: 0, shield: 0, magnet: 0 },
  completedLevels: [],
  achievements: [],
  highScore: 0,
  bestTime: 0,
  maxCombo: 0,
  lastDailyClaim: 0,
  dailyStreak: 0,
  missions: {
    killEnemies: { progress: 0, target: 20, completed: false, reward: 100, desc: "Kill 20 enemies in a single run" },
    collectCoins: { progress: 0, target: 50, completed: false, reward: 100, desc: "Collect 50 coins in a single run" },
    surviveTime: { progress: 0, target: 120, completed: false, reward: 150, desc: "Survive 2 minutes in a single run" },
    beatBoss: { progress: 0, target: 1, completed: false, reward: 200, desc: "Beat any Boss" }
  }
};

// Ship Configurations
const SHIPS_CONFIG = {
  basic: { name: 'BASIC JET', speed: 6, maxLives: 3, damage: 1.0, cost: 0, icon: '🚀', color: '#00ffff' },
  ufo: { name: 'UFO SAUCER', speed: 8, maxLives: 2, damage: 1.1, cost: 500, icon: '🛸', color: '#39ff14' },
  fighter: { name: 'FIGHTER F9', speed: 7, maxLives: 4, damage: 1.4, cost: 1200, icon: '✈', color: '#ff007f' },
  alien: { name: 'ALIEN DREAD', speed: 5.5, maxLives: 5, damage: 1.8, cost: 2500, icon: '👽', color: '#ffea00' },
  robot: { name: 'ROBO CARRIER', speed: 4.5, maxLives: 6, damage: 2.3, cost: 4500, icon: '🤖', color: '#ff00ff' }
};

// Player Object
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 90,
  w: 50,
  h: 50,
  speed: 6,
  lives: 3,
  maxLives: 3,
  color: '#00ffff',
  shield: 0,
  maxShield: 100,
  invulnerable: false,
  invulnTime: 0,
  shootDelay: 200,
  lastShot: 0,
  // Power-up states
  powerups: {
    speedBoost: { active: false, time: 0, duration: 8000 },
    tripleBullet: { active: false, time: 0, duration: 10000 },
    shieldInvuln: { active: false, time: 0, duration: 10000 },
    freezeEnemies: { active: false, time: 0, duration: 6000 },
    magnetCoins: { active: false, time: 0, duration: 10000 }
  }
};

// Planet Story Configs
const PLANETS = [
  { id: 1, name: 'EARTH', targetScore: 300, color: '#00ffcc', nebulaColor: 'rgba(0, 100, 200, 0.1)', desc: 'Warm up here. Watch out for fast scouts.' },
  { id: 2, name: 'MOON', targetScore: 600, color: '#aaaaaa', nebulaColor: 'rgba(100, 100, 100, 0.08)', desc: 'Low gravity field. Asteroids appear here.' },
  { id: 3, name: 'MARS', targetScore: 1000, color: '#ff5500', nebulaColor: 'rgba(200, 50, 0, 0.12)', desc: 'Red sands. Zigzag ships and tanks inbound.' },
  { id: 4, name: 'JUPITER', targetScore: 1500, color: '#ffaa00', nebulaColor: 'rgba(180, 120, 0, 0.1)', desc: 'Gas Giant storm. Shooters will engage you.' },
  { id: 5, name: 'GALAXY EDGE', targetScore: 2000, color: '#9900ff', nebulaColor: 'rgba(120, 0, 200, 0.15)', desc: 'Deep Space. Invisible & Kamikaze enemies.' },
  { id: 6, name: 'FINAL DESTROYER', targetScore: 99999, color: '#ff0055', nebulaColor: 'rgba(255, 0, 100, 0.18)', desc: 'Defeat the Supreme Boss to escape!' }
];

// Entity Arrays
let bullets = [];
let enemyBullets = [];
let enemies = [];
let asteroids = [];
let particles = [];
let coins = [];
let powerups = [];
let stars = [];
let nebulae = [];
let backgroundPlanet = { x: 0, y: 0, size: 0, color: '#fff', name: '', phase: 0 };

// Boss State
let boss = null;
let bossWarningTimer = 0;
let bossScoreCounter = 0; // For endless mode spawn triggers

// --- AUDIO CONFIG & MUTES ---
let sfxMuted = false;
let musicMuted = false;

// Joystick variables
let joystick = {
  active: false,
  startX: 0,
  startY: 0,
  curX: 0,
  curY: 0,
  maxDistance: 45,
  dx: 0,
  dy: 0
};
let controlScheme = 'keys'; // keys, mouse, touch

// Achievements Config
const ACHIEVEMENTS_CONFIG = [
  { id: 'first_kill', name: 'FIRST BLOOD', desc: 'Destroy your first enemy.', icon: '🎯' },
  { id: 'score_100', name: 'SPACE CADET', desc: 'Reach 100 points in a run.', icon: '⭐' },
  { id: 'score_1000', name: 'GALAXY HERO', desc: 'Reach 1000 points in a run.', icon: '👑' },
  { id: 'boss_killer', name: 'BOSS SLAYER', desc: 'Defeat a massive Boss ship.', icon: '👾' },
  { id: 'no_damage', name: 'UNTOUCHABLE', desc: 'Complete a boss fight without losing lives.', icon: '🛡️' },
  { id: 'enemies_100', name: 'TERMINATOR', desc: 'Destroy 100 total space hostiles.', icon: '💥' }
];

// Daily rewards items
const DAILY_REWARDS = [
  { day: 1, type: 'coins', val: 100, label: '100 Coins 🪙' },
  { day: 2, type: 'coins', val: 200, label: '200 Coins 🪙' },
  { day: 3, type: 'coins', val: 400, label: '400 Coins 🪙' },
  { day: 4, type: 'coins', val: 600, label: '600 Coins 🪙' },
  { day: 5, type: 'ship', val: 'ufo', label: 'UFO Skin 🛸' },
  { day: 6, type: 'coins', val: 1000, label: '1000 Coins 🪙' },
  { day: 7, type: 'ship', val: 'fighter', label: 'Fighter Jet ✈' }
];

// --- INITIALIZATION ---
function initGame() {
  loadGameData();
  setupInputHandlers();
  createInitialStars();
  createNebulae();
  createBackgroundPlanet();
  
  // Apply initial Settings to DOM
  document.getElementById('sfxToggle').checked = !sfxMuted;
  document.getElementById('musicToggle').checked = !musicMuted;
  document.getElementById('shakeToggle').value = shakeType;
  document.getElementById('controlSelect').value = controlScheme;
  
  // Set coin display
  updateCoinsDisplay();

  // Draw loop
  requestAnimationFrame(gameLoop);
}

// --- DATA SAVING & LOADING ---
function loadGameData() {
  const localData = localStorage.getItem('neonStrikeSave');
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      // Merge keys to avoid breaking if settings change
      saveData = { ...saveData, ...parsed };
      // Ensure sub-objects are fully merged
      if (parsed.upgrades) saveData.upgrades = { ...saveData.upgrades, ...parsed.upgrades };
      if (parsed.missions) saveData.missions = { ...saveData.missions, ...parsed.missions };
    } catch (e) {
      console.error("Error loading save data:", e);
    }
  }

  // Load system volumes/toggles
  const localSfx = localStorage.getItem('neonStrikeSfx');
  sfxMuted = localSfx === 'true';
  const localMusic = localStorage.getItem('neonStrikeMusic');
  musicMuted = localMusic === 'true';
  const localShake = localStorage.getItem('neonStrikeShake');
  if (localShake) shakeType = localShake;
  const localControls = localStorage.getItem('neonStrikeControls');
  if (localControls) controlScheme = localControls;

  // Sync settings helper
  if (window.gameAudio) {
    window.gameAudio.muted = sfxMuted;
    window.gameAudio.musicMuted = musicMuted;
  }
}

function saveGameData() {
  localStorage.setItem('neonStrikeSave', JSON.stringify(saveData));
  localStorage.setItem('neonStrikeSfx', sfxMuted);
  localStorage.setItem('neonStrikeMusic', musicMuted);
  localStorage.setItem('neonStrikeShake', shakeType);
  localStorage.setItem('neonStrikeControls', controlScheme);
}

function updateCoinsDisplay() {
  document.getElementById('hudCoins').textContent = saveData.coins;
  document.getElementById('hangarCoins').textContent = saveData.coins;
  document.getElementById('upgradesCoins').textContent = saveData.coins;
}

// --- INPUT HANDLERS ---
function setupInputHandlers() {
  // Key events
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    keys[e.code] = true;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (gameState === STATES.PLAYING) {
        pauseGame();
      } else if (gameState === STATES.PAUSED) {
        resumeGame();
      }
    }
  });
  
  document.addEventListener('keyup', e => {
    keys[e.key] = false;
    keys[e.code] = false;
  });

  // Mouse move follow control
  canvas.addEventListener('mousemove', e => {
    if (controlScheme !== 'mouse' || gameState !== STATES.PLAYING) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Smooth follow
    player.x = mouseX - player.w / 2;
    player.y = mouseY - player.h / 2;
    
    // Constrain boundaries
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
  });

  // Mobile / Touch controls
  const joystickStick = document.getElementById('joystickStick');
  const joystickZone = document.getElementById('joystickZone');

  joystickZone.addEventListener('touchstart', e => {
    if (controlScheme !== 'touch') return;
    e.preventDefault();
    joystick.active = true;
    const touch = e.touches[0];
    const rect = joystickZone.getBoundingClientRect();
    joystick.startX = rect.left + rect.width / 2;
    joystick.startY = rect.top + rect.height / 2;
  });

  joystickZone.addEventListener('touchmove', e => {
    if (!joystick.active || controlScheme !== 'touch') return;
    e.preventDefault();
    const touch = e.touches[0];
    let dx = touch.clientX - joystick.startX;
    let dy = touch.clientY - joystick.startY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > joystick.maxDistance) {
      dx = (dx / distance) * joystick.maxDistance;
      dy = (dy / distance) * joystick.maxDistance;
    }
    
    joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // Normalize multipliers (-1 to 1)
    joystick.dx = dx / joystick.maxDistance;
    joystick.dy = dy / joystick.maxDistance;
  });

  const endJoystick = () => {
    joystick.active = false;
    joystickStick.style.transform = 'translate(0px, 0px)';
    joystick.dx = 0;
    joystick.dy = 0;
  };

  joystickZone.addEventListener('touchend', endJoystick);
  joystickZone.addEventListener('touchcancel', endJoystick);
  
  // Set initial control style
  changeControlsDisplay();
}

function changeControls() {
  controlScheme = document.getElementById('controlSelect').value;
  saveGameData();
  changeControlsDisplay();
}

function changeControlsDisplay() {
  const mobileOverlay = document.getElementById('mobileControls');
  if (controlScheme === 'touch') {
    mobileOverlay.style.display = 'block';
  } else {
    mobileOverlay.style.display = 'none';
  }
}

// --- BACKGROUND GENERATION ---
function createInitialStars() {
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3
    });
  }
}

function createNebulae() {
  nebulae = [];
  // Large drifting dust circles
  for (let i = 0; i < 3; i++) {
    nebulae.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 150 + 150,
      vx: (Math.random() - 0.5) * 0.2,
      vy: Math.random() * 0.2 + 0.1,
      color: `rgba(${Math.floor(Math.random() * 100)}, 0, ${Math.floor(Math.random() * 150 + 100)}, 0.05)`
    });
  }
}

function createBackgroundPlanet() {
  backgroundPlanet = {
    x: Math.random() * (canvas.width - 200) + 100,
    y: -150,
    size: Math.random() * 80 + 60,
    speed: 0.15,
    color: '#00ffff',
    name: 'PLANET',
    phase: Math.random() * Math.PI
  };
}

// --- STATE NAVIGATORS ---
function showMainMenu() {
  hideAllScreens();
  document.getElementById('mainMenu').style.display = 'flex';
  gameState = STATES.MENU;
  if (window.gameAudio) {
    window.gameAudio.stopMusic();
  }
}

function hideAllScreens() {
  const screens = ['mainMenu', 'levelSelectMenu', 'hangarMenu', 'upgradesMenu', 'achievementsMenu', 'leaderboardMenu', 'settingsMenu', 'pauseMenu', 'gameOver'];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });
}

function startEndlessMode() {
  gameMode = 'endless';
  currentLevel = 1;
  hideAllScreens();
  initRun();
  gameState = STATES.PLAYING;
  if (window.gameAudio) {
    window.gameAudio.startMusic('normal');
  }
}

function openStorySelect() {
  hideAllScreens();
  document.getElementById('levelSelectMenu').style.display = 'flex';
  gameState = STATES.LEVEL_SELECT;
  renderStoryLevels();
}

function renderStoryLevels() {
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  
  PLANETS.forEach(p => {
    const card = document.createElement('div');
    const isLocked = p.id > 1 && !saveData.completedLevels.includes(p.id - 1);
    
    card.className = `level-card ${isLocked ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="level-num">PLANET 0${p.id}</div>
      <div class="level-name" style="color: ${p.color}">${p.name}</div>
      <div class="level-status">${isLocked ? '🔒 LOCKED' : saveData.completedLevels.includes(p.id) ? '✅ COMPLETED' : '⚡ READY'}</div>
    `;
    
    if (!isLocked) {
      card.onclick = () => startStoryLevel(p.id);
    }
    grid.appendChild(card);
  });
}

function startStoryLevel(planetId) {
  gameMode = 'story';
  currentLevel = planetId;
  hideAllScreens();
  initRun();
  gameState = STATES.PLAYING;
  if (window.gameAudio) {
    window.gameAudio.startMusic(planetId === 6 ? 'boss' : 'normal');
  }
  
  // Set planetary visuals
  const planetConf = PLANETS[planetId - 1];
  document.getElementById('hudPlanet').textContent = planetConf.name;
  document.getElementById('hudPlanet').style.color = planetConf.color;
  backgroundPlanet.color = planetConf.color;
  backgroundPlanet.name = planetConf.name;
  backgroundPlanet.y = -100;
  
  // Clear any existing boss setup
  boss = null;
  if (planetId === 6) {
    // Final Boss starts immediately
    triggerBossWarning();
  }
}

function openHangar() {
  hideAllScreens();
  document.getElementById('hangarMenu').style.display = 'flex';
  gameState = STATES.HANGAR;
  updateCoinsDisplay();
  renderHangarShips();
}

let selectedPreviewShipId = 'basic';

function renderHangarShips() {
  const list = document.getElementById('shipList');
  list.innerHTML = '';
  
  Object.keys(SHIPS_CONFIG).forEach(key => {
    const config = SHIPS_CONFIG[key];
    const isUnlocked = saveData.unlockedShips.includes(key);
    const isEquipped = saveData.selectedShip === key;
    
    const div = document.createElement('div');
    div.className = `ship-item ${selectedPreviewShipId === key ? 'selected' : ''}`;
    div.onclick = () => selectPreviewShip(key);
    
    div.innerHTML = `
      <span class="ship-item-icon">${config.icon}</span>
      <div class="ship-item-details">
        <div class="ship-item-name" style="color: ${config.color}">${config.name}</div>
        <div class="ship-item-cost">${isUnlocked ? '' : '🪙 ' + config.cost}</div>
      </div>
      <span class="ship-item-status">${isEquipped ? 'EQUIPPED' : isUnlocked ? 'OWNED' : 'LOCKED'}</span>
    `;
    list.appendChild(div);
  });

  selectPreviewShip(selectedPreviewShipId);
}

function selectPreviewShip(shipId) {
  selectedPreviewShipId = shipId;
  // Re-class active select in list
  const items = document.querySelectorAll('.ship-item');
  const shipKeys = Object.keys(SHIPS_CONFIG);
  items.forEach((item, index) => {
    if (shipKeys[index] === shipId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });

  const config = SHIPS_CONFIG[shipId];
  const isUnlocked = saveData.unlockedShips.includes(shipId);
  const isEquipped = saveData.selectedShip === shipId;

  document.getElementById('previewArt').textContent = config.icon;
  document.getElementById('previewArt').style.textShadow = `0 0 20px ${config.color}`;
  document.getElementById('previewName').textContent = config.name;
  document.getElementById('previewName').style.color = config.color;
  
  // Calculate relative stats bars (max values: speed=9, hp=7, damage=3)
  document.getElementById('statSpeed').style.width = `${(config.speed / 9) * 100}%`;
  document.getElementById('statHP').style.width = `${(config.maxLives / 7) * 100}%`;
  document.getElementById('statDamage').style.width = `${(config.damage / 3) * 100}%`;

  const btn = document.getElementById('shipBuyEquipBtn');
  if (isEquipped) {
    btn.textContent = "EQUIPPED";
    btn.disabled = true;
    btn.style.borderColor = '#555';
    btn.style.color = '#555';
    btn.style.boxShadow = 'none';
  } else if (isUnlocked) {
    btn.textContent = "EQUIP";
    btn.disabled = false;
    btn.style.borderColor = 'var(--neon-cyan)';
    btn.style.color = 'var(--neon-cyan)';
    btn.style.boxShadow = 'var(--border-glow)';
  } else {
    btn.textContent = `BUY (${config.cost})`;
    btn.disabled = saveData.coins < config.cost;
    btn.style.borderColor = 'var(--neon-yellow)';
    btn.style.color = 'var(--neon-yellow)';
    btn.style.boxShadow = '0 0 10px rgba(255, 255, 0, 0.2)';
  }
}

function buyOrEquipShip() {
  const shipId = selectedPreviewShipId;
  const config = SHIPS_CONFIG[shipId];
  const isUnlocked = saveData.unlockedShips.includes(shipId);

  if (isUnlocked) {
    saveData.selectedShip = shipId;
    if (window.gameAudio) window.gameAudio.playPowerUp();
  } else {
    if (saveData.coins >= config.cost) {
      saveData.coins -= config.cost;
      saveData.unlockedShips.push(shipId);
      saveData.selectedShip = shipId;
      if (window.gameAudio) window.gameAudio.playPowerUp();
    } else {
      if (window.gameAudio) window.gameAudio.playGameOver();
    }
  }
  saveGameData();
  renderHangarShips();
}

function openUpgrades() {
  hideAllScreens();
  document.getElementById('upgradesMenu').style.display = 'flex';
  gameState = STATES.UPGRADES;
  updateCoinsDisplay();
  renderUpgrades();
}

function renderUpgrades() {
  const list = document.getElementById('upgradesList');
  list.innerHTML = '';

  const UPGRADES_DEF = [
    { key: 'weapon', name: 'MAIN WEAPON LEVEL', desc: 'Increases bullets and fires rockets. (Max Lvl 5)', costBase: 300, max: 5 },
    { key: 'lives', name: 'STARTING HULL (LIVES)', desc: 'Adds starting lives/health. (Max Lvl 5)', costBase: 250, max: 5 },
    { key: 'speed', name: 'ENGINE BOOST (SPEED)', desc: 'Increases maneuverability speed. (Max Lvl 5)', costBase: 200, max: 5 },
    { key: 'shield', name: 'RECHARGING ENERGY SHIELD', desc: 'Gives passive shield block capacity. (Max Lvl 5)', costBase: 300, max: 5 },
    { key: 'magnet', name: 'COIN MAGNET RADIUS', desc: 'Attracts loose space gold from further away. (Max Lvl 5)', costBase: 150, max: 5 }
  ];

  UPGRADES_DEF.forEach(upg => {
    const currentTier = saveData.upgrades[upg.key] || 1;
    const isMax = currentTier >= upg.max;
    const cost = isMax ? 0 : currentTier * upg.costBase;
    
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    
    card.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-title">${upg.name}</div>
        <div class="upgrade-desc">${upg.desc}</div>
        <div class="upgrade-tier">CURRENT LEVEL: ${currentTier} / ${upg.max}</div>
      </div>
      <div class="upgrade-action">
        <span class="upgrade-cost">${isMax ? 'MAXED' : '🪙 ' + cost}</span>
        <button class="upgrade-btn ${isMax ? 'maxed' : ''}" ${isMax || saveData.coins < cost ? 'disabled' : ''} onclick="buyUpgrade('${upg.key}', ${cost})">
          ${isMax ? 'MAX' : 'BUY'}
        </button>
      </div>
    `;
    list.appendChild(card);
  });
}

function buyUpgrade(key, cost) {
  if (saveData.coins >= cost) {
    saveData.coins -= cost;
    saveData.upgrades[key] = (saveData.upgrades[key] || 1) + 1;
    if (window.gameAudio) window.gameAudio.playPowerUp();
    saveGameData();
    renderUpgrades();
  }
}

function openAchievements() {
  hideAllScreens();
  document.getElementById('achievementsMenu').style.display = 'flex';
  gameState = STATES.ACHIEVEMENTS;
  renderAchievements();
}

function renderAchievements() {
  const container = document.getElementById('achievementsList');
  container.innerHTML = '';
  
  ACHIEVEMENTS_CONFIG.forEach(ach => {
    const isUnlocked = saveData.achievements.includes(ach.id);
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-details">
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openLeaderboard() {
  hideAllScreens();
  document.getElementById('leaderboardMenu').style.display = 'flex';
  gameState = STATES.LEADERBOARD;
  renderLeaderboard();
}

function renderLeaderboard() {
  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '';

  // Mock online players + Player
  let mockList = [
    { name: 'XenonMaster', score: 3200, maxCombo: 35, bot: true },
    { name: 'CosmoRanger', score: 2450, maxCombo: 24, bot: true },
    { name: 'StarLord', score: 1900, maxCombo: 21, bot: true },
    { name: 'AlphaPilot', score: 1350, maxCombo: 18, bot: true },
    { name: 'VegaZero', score: 980, maxCombo: 14, bot: true },
    { name: 'NebulaKnight', score: 620, maxCombo: 9, bot: true },
    { name: 'SpaceNovice', score: 250, maxCombo: 5, bot: true }
  ];

  // Insert player's high score
  const playerEntry = { name: 'Player (You)', score: saveData.highScore || 0, maxCombo: saveData.maxCombo || 0, bot: false };
  mockList.push(playerEntry);
  
  // Sort descending
  mockList.sort((a, b) => b.score - a.score);

  mockList.forEach((entry, idx) => {
    const tr = document.createElement('tr');
    if (!entry.bot) {
      tr.className = 'highlight-row';
    }
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.score}</td>
      <td>x${entry.maxCombo}</td>
      <td>${entry.bot ? '📡 ONLINE' : '🚀 LOCAL'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function openSettings() {
  previousState = gameState;
  hideAllScreens();
  document.getElementById('settingsMenu').style.display = 'flex';
  gameState = STATES.SETTINGS;
}

function openPauseSettings() {
  previousState = STATES.PAUSED;
  hideAllScreens();
  document.getElementById('settingsMenu').style.display = 'flex';
  gameState = STATES.SETTINGS;
}

function toggleSound() {
  sfxMuted = !document.getElementById('sfxToggle').checked;
  if (window.gameAudio) window.gameAudio.muted = sfxMuted;
  saveGameData();
}

function toggleMusic() {
  musicMuted = !document.getElementById('musicToggle').checked;
  if (window.gameAudio) {
    window.gameAudio.musicMuted = musicMuted;
    if (gameState === STATES.PLAYING) {
      if (musicMuted) {
        window.gameAudio.stopMusic();
      } else {
        window.gameAudio.startMusic(boss ? 'boss' : 'normal');
      }
    }
  }
  saveGameData();
}

function changeShake() {
  shakeType = document.getElementById('shakeToggle').value;
  saveGameData();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// --- DAILY REWARDS SYSTEM ---
function openDailyRewards() {
  const modal = document.getElementById('dailyRewardsModal');
  modal.style.display = 'flex';
  renderDailyGrid();
}

function closeDailyRewards() {
  document.getElementById('dailyRewardsModal').style.display = 'none';
}

function renderDailyGrid() {
  const grid = document.getElementById('dailyGrid');
  grid.innerHTML = '';

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Calculate if reward can be claimed
  const lastClaim = saveData.lastDailyClaim || 0;
  const timePassed = now - lastClaim;
  
  let eligibleToClaim = false;
  let activeDay = saveData.dailyStreak || 0;

  if (timePassed >= dayMs) {
    if (timePassed < dayMs * 2) {
      // Streak continues
      activeDay = (activeDay % 7) + 1;
    } else {
      // Streak broken, reset to day 1
      activeDay = 1;
    }
    eligibleToClaim = true;
  } else {
    // Already claimed today
    eligibleToClaim = false;
  }

  DAILY_REWARDS.forEach(item => {
    const isClaimed = item.day <= (saveData.dailyStreak || 0) && !eligibleToClaim;
    const isActive = item.day === activeDay && eligibleToClaim;
    
    const card = document.createElement('div');
    card.className = `daily-day-card ${isClaimed ? 'claimed' : ''} ${isActive ? 'active-day' : ''}`;
    card.innerHTML = `
      <div>Day ${item.day}</div>
      <div class="daily-val">${item.label}</div>
      <div style="font-size: 9px; margin-top: 4px;">
        ${isClaimed ? '✅ CLAIMED' : isActive ? '⚡ READY' : '🔒 PENDING'}
      </div>
    `;
    grid.appendChild(card);
  });

  const claimBtn = document.getElementById('claimRewardBtn');
  claimBtn.disabled = !eligibleToClaim;
}

function claimDailyReward() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const lastClaim = saveData.lastDailyClaim || 0;
  const timePassed = now - lastClaim;
  
  let newStreak = saveData.dailyStreak || 0;
  if (timePassed >= dayMs && timePassed < dayMs * 2) {
    newStreak = (newStreak % 7) + 1;
  } else {
    newStreak = 1;
  }

  const rewardItem = DAILY_REWARDS[newStreak - 1];
  
  // Give reward
  if (rewardItem.type === 'coins') {
    saveData.coins += rewardItem.val;
  } else if (rewardItem.type === 'ship') {
    if (!saveData.unlockedShips.includes(rewardItem.val)) {
      saveData.unlockedShips.push(rewardItem.val);
    } else {
      saveData.coins += 500; // Coin fallback
    }
  }

  saveData.dailyStreak = newStreak;
  saveData.lastDailyClaim = now;
  
  saveGameData();
  updateCoinsDisplay();
  renderDailyGrid();
  if (window.gameAudio) window.gameAudio.playPowerUp();
  
  // Close daily notifier on main menu
  document.querySelector('.daily-reward-notifier').style.display = 'none';
}

function checkDailyRewardNotifier() {
  const lastClaim = saveData.lastDailyClaim || 0;
  const timePassed = Date.now() - lastClaim;
  const dayMs = 24 * 60 * 60 * 1000;
  const notifier = document.querySelector('.daily-reward-notifier');
  
  if (timePassed >= dayMs) {
    notifier.style.display = 'block';
  } else {
    notifier.style.display = 'none';
  }
}

// --- RUN INITIALIZER ---
function initRun() {
  score = 0;
  levelScore = 0;
  runKills = 0;
  runCoins = 0;
  comboCount = 0;
  maxComboThisRun = 0;
  lastKillTime = 0;
  startTime = Date.now();
  playTime = 0;
  bossScoreCounter = 0;
  
  bullets = [];
  enemyBullets = [];
  enemies = [];
  asteroids = [];
  particles = [];
  coins = [];
  powerups = [];
  boss = null;
  bossWarningTimer = 0;

  // Equip Selected Ship properties
  const shipType = saveData.selectedShip || 'basic';
  const config = SHIPS_CONFIG[shipType];
  
  // Permanent upgrade bonus modifiers
  const weaponUpgradeLvl = saveData.upgrades.weapon || 1;
  const livesUpgradeLvl = saveData.upgrades.lives || 0;
  const speedUpgradeLvl = saveData.upgrades.speed || 0;
  const shieldUpgradeLvl = saveData.upgrades.shield || 0;

  player.w = 50;
  player.h = 50;
  player.x = canvas.width / 2 - player.w / 2;
  player.y = canvas.height - 90;
  player.speed = config.speed + speedUpgradeLvl * 0.5;
  player.maxLives = config.maxLives + livesUpgradeLvl;
  player.lives = player.maxLives;
  player.color = config.color;
  
  player.maxShield = shieldUpgradeLvl * 20;
  player.shield = player.maxShield; // Starts fully charged
  player.invulnerable = false;
  player.invulnTime = 0;
  
  // Reset power-ups active states
  Object.keys(player.powerups).forEach(k => {
    player.powerups[k].active = false;
    player.powerups[k].time = 0;
  });

  // Weapon details
  player.shootDelay = 220 - (shipType === 'fighter' ? 40 : 0);

  // Sync HUD
  document.getElementById('hudScore').textContent = score;
  updateCoinsDisplay();
  updateHUDLivesShield();
  document.getElementById('hudCombo').classList.remove('active');
  document.getElementById('bossHealthContainer').style.display = 'none';
  document.getElementById('powerupTimer').style.display = 'none';

  // Spawn initial asteroids
  for (let i = 0; i < 3; i++) {
    spawnAsteroid(true);
  }
}

function updateHUDLivesShield() {
  document.getElementById('hudLives').textContent = player.lives;
  const livesPercent = Math.max(0, (player.lives / player.maxLives) * 100);
  document.getElementById('livesBar').style.width = `${livesPercent}%`;

  if (player.maxShield > 0) {
    const shieldPercent = Math.max(0, (player.shield / player.maxShield) * 100);
    document.getElementById('hudShield').textContent = `${Math.floor(shieldPercent)}%`;
    document.getElementById('shieldBar').style.width = `${shieldPercent}%`;
  } else {
    document.getElementById('hudShield').textContent = `0%`;
    document.getElementById('shieldBar').style.width = `0%`;
  }
}

// --- SOUND TRIGGER WRAPPERS ---
function triggerShootAudio() {
  if (window.gameAudio) window.gameAudio.playShoot();
}
function triggerExplodeAudio() {
  if (window.gameAudio) window.gameAudio.playExplosion();
}
function triggerCoinAudio() {
  if (window.gameAudio) window.gameAudio.playCoin();
}
function triggerPowerUpAudio() {
  if (window.gameAudio) window.gameAudio.playPowerUp();
}

// --- SPAWN GENERATORS ---
function spawnEnemy() {
  if (gameState !== STATES.PLAYING || boss) return;

  // Decide enemy types based on planet/level
  let allowedTypes = ['normal'];
  if (gameMode === 'story') {
    if (currentLevel >= 2) allowedTypes.push('fast');
    if (currentLevel >= 3) allowedTypes.push('zigzag', 'tank');
    if (currentLevel >= 4) allowedTypes.push('shooter');
    if (currentLevel >= 5) allowedTypes.push('invisible', 'kamikaze');
  } else {
    // Endless mode unlocks types dynamically based on current endless score
    if (score > 200) allowedTypes.push('fast');
    if (score > 500) allowedTypes.push('zigzag');
    if (score > 800) allowedTypes.push('tank');
    if (score > 1200) allowedTypes.push('shooter');
    if (score > 1600) allowedTypes.push('invisible', 'kamikaze');
  }

  const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  let w = 40;
  let h = 40;
  let hp = 1;
  let speed = Math.random() * 1.5 + 2;
  let color = '#ff0000';

  if (type === 'fast') {
    w = 28;
    h = 28;
    speed = Math.random() * 2 + 4.5;
    color = '#ffaa00';
  } else if (type === 'tank') {
    w = 60;
    h = 60;
    hp = 5 + Math.floor(currentLevel * 0.5);
    speed = 1.2;
    color = '#9900ff';
  } else if (type === 'zigzag') {
    w = 36;
    h = 36;
    speed = 2.2;
    color = '#39ff14';
  } else if (type === 'shooter') {
    w = 44;
    h = 44;
    hp = 2;
    speed = 1.6;
    color = '#ff007f';
  } else if (type === 'invisible') {
    w = 38;
    h = 38;
    speed = 2.0;
    color = '#00ffff';
  } else if (type === 'kamikaze') {
    w = 32;
    h = 32;
    speed = 2.5;
    color = '#ff5500';
  }

  enemies.push({
    type: type,
    x: Math.random() * (canvas.width - w - 20) + 10,
    y: -h,
    startX: 0, // Assigned below
    w: w,
    h: h,
    hp: hp,
    maxHp: hp,
    speed: speed,
    color: color,
    shootTimer: Math.random() * 1000,
    zigzagPhase: Math.random() * Math.PI,
    invisibleOpacity: 1.0,
    invisibleFading: true,
    kamiLocked: false,
    kamiTargetX: 0
  });

  // Assign starting X reference
  const newlyCreated = enemies[enemies.length - 1];
  newlyCreated.startX = newlyCreated.x;
}

function spawnAsteroid(fromInitial = false) {
  const size = Math.random() * 35 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size),
    y: fromInitial ? Math.random() * (canvas.height - 200) : -size,
    w: size,
    h: size,
    vx: (Math.random() - 0.5) * 1.5,
    vy: Math.random() * 1.2 + 0.8,
    hp: Math.ceil(size / 10),
    maxHp: Math.ceil(size / 10),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.03
  });
}

function spawnPowerup(x, y) {
  const roll = Math.random();
  let type = 'life';
  
  if (roll < 0.15) type = 'life';
  else if (roll < 0.3) type = 'speed';
  else if (roll < 0.45) type = 'triple';
  else if (roll < 0.6) type = 'bomb';
  else if (roll < 0.75) type = 'shield';
  else if (roll < 0.9) type = 'freeze';
  else type = 'magnet';

  const icons = { life: '❤️', speed: '⚡', triple: '🔥', bomb: '💣', shield: '🛡️', freeze: '❄️', magnet: '🧲' };
  const colors = { life: '#ff0055', speed: '#ffaa00', triple: '#ff007f', bomb: '#ff0000', shield: '#00d2ff', freeze: '#00ffff', magnet: '#ffb700' };

  powerups.push({
    type: type,
    x: x,
    y: y,
    w: 25,
    h: 25,
    vy: 1.8,
    icon: icons[type] || '🎁',
    color: colors[type] || '#fff'
  });
}

function spawnCoin(x, y) {
  // Magnet attraction helper will reference this array
  coins.push({
    x: x,
    y: y,
    w: 14,
    h: 14,
    vy: 2.2,
    vx: 0,
    spin: Math.random() * Math.PI
  });
}

// --- PARTICLE EXPLOSIONS ---
function createExplosion(x, y, color = '#ff5500', count = 15, size = 3) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 1;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * size + 1.5,
      color: color,
      life: Math.random() * 25 + 15,
      maxLife: 40
    });
  }
}

function createShockwave(x, y, radius = 50, color = '#00ffff') {
  for (let i = 0; i < 36; i++) {
    const angle = (i * 10) * Math.PI / 180;
    particles.push({
      x: x + Math.cos(angle) * (radius * 0.2),
      y: y + Math.sin(angle) * (radius * 0.2),
      vx: Math.cos(angle) * 7,
      vy: Math.sin(angle) * 7,
      size: 3.5,
      color: color,
      life: 25,
      maxLife: 25
    });
  }
}

function triggerScreenShake(duration, intensity) {
  if (shakeType === 'none') return;
  const mult = shakeType === 'high' ? 1.5 : 0.6;
  shakeTime = duration;
  shakeIntensity = intensity * mult;
}

// --- PLAYER WEAPON LOGIC ---
function shoot() {
  const now = Date.now();
  if (now - player.lastShot < player.shootDelay) return;
  player.lastShot = now;

  triggerShootAudio();

  const weaponLvl = saveData.upgrades.weapon || 1;
  const isTripleActive = player.powerups.tripleBullet.active;

  // If power-up active, force Triple Bullet spread
  if (isTripleActive || weaponLvl === 3) {
    // Triple bullet
    fireBullet(player.x + player.w / 2 - 2, player.y, 0, -10);
    fireBullet(player.x + 5, player.y + 10, -2, -9);
    fireBullet(player.x + player.w - 9, player.y + 10, 2, -9);
  } else if (weaponLvl === 1) {
    // Single Bullet
    fireBullet(player.x + player.w / 2 - 2, player.y, 0, -10);
  } else if (weaponLvl === 2) {
    // Double Bullet
    fireBullet(player.x + 10, player.y + 5, 0, -10);
    fireBullet(player.x + player.w - 14, player.y + 5, 0, -10);
  } else if (weaponLvl >= 4) {
    // Plasma Laser (Fast twin beams with glowing visuals)
    fireBullet(player.x + 8, player.y - 4, 0, -12, true);
    fireBullet(player.x + player.w - 12, player.y - 4, 0, -12, true);
    
    // Tier 5 Seeker Rockets addition
    if (weaponLvl === 5) {
      fireSeekerRocket();
    }
  }
}

function fireBullet(x, y, vx, vy, isLaser = false) {
  const dmgMult = SHIPS_CONFIG[saveData.selectedShip].damage;
  bullets.push({
    x: x,
    y: y,
    w: isLaser ? 5 : 4,
    h: isLaser ? 22 : 14,
    vx: vx,
    vy: vy,
    damage: (isLaser ? 1.4 : 1.0) * dmgMult,
    isLaser: isLaser
  });
}

let lastRocketTime = 0;
function fireSeekerRocket() {
  const now = Date.now();
  if (now - lastRocketTime < 800) return; // limit rocket spam
  lastRocketTime = now;

  bullets.push({
    x: player.x + player.w / 2 - 4,
    y: player.y + 15,
    w: 8,
    h: 16,
    vx: (Math.random() - 0.5) * 4,
    vy: -5,
    damage: 3.5,
    isRocket: true,
    smokeTimer: 0
  });
}

// --- BOSS ENGINES ---
function triggerBossWarning() {
  gameState = STATES.BOSS_WARNING;
  bossWarningTimer = 180; // 3 seconds at 60fps
  if (window.gameAudio) window.gameAudio.playBossWarning();
}

function spawnBossShip() {
  const levelMult = currentLevel * 0.8;
  const maxHp = 50 + levelMult * 40;
  
  boss = {
    x: canvas.width / 2 - 100,
    y: -120,
    targetY: 80,
    w: 200,
    h: 80,
    hp: maxHp,
    maxHp: maxHp,
    speed: 1.2,
    direction: 1, // Moving right (1) or left (-1)
    attackTimer: 0,
    attackPattern: 0, // 0 = Bullet Spray, 1 = Ring Blast, 2 = Death Laser Sweeper
    laserSweepX: 0,
    laserSweepDir: 1,
    laserActive: false,
    laserWarning: false,
    laserTimer: 0
  };

  document.getElementById('bossHealthContainer').style.display = 'flex';
  document.getElementById('bossHealthBar').style.width = '100%';

  if (window.gameAudio) {
    window.gameAudio.startMusic('boss');
  }
}

// --- COMBO SYSTEMS ---
function incrementCombo() {
  const now = Date.now();
  if (now - lastKillTime < COMBO_COOLDOWN) {
    comboCount++;
  } else {
    comboCount = 1;
  }
  lastKillTime = now;

  if (comboCount > maxComboThisRun) {
    maxComboThisRun = comboCount;
  }

  // Visual text overlay updates
  const comboEl = document.getElementById('hudCombo');
  if (comboCount >= 2) {
    comboEl.textContent = `COMBO x${comboCount}`;
    comboEl.classList.add('active');
    
    // Add extra score matching combo level
    score += comboCount * 2;
    document.getElementById('hudScore').textContent = score;
  }
}

// --- MISSIONS & ACHIEVEMENTS CHECKS ---
function checkActiveMissions(type, val = 1) {
  const m = saveData.missions;
  
  if (type === 'kill' && !m.killEnemies.completed) {
    m.killEnemies.progress += val;
    if (m.killEnemies.progress >= m.killEnemies.target) {
      completeMission('killEnemies');
    }
  }
  if (type === 'coin' && !m.collectCoins.completed) {
    m.collectCoins.progress += val;
    if (m.collectCoins.progress >= m.collectCoins.target) {
      completeMission('collectCoins');
    }
  }
  if (type === 'time' && !m.surviveTime.completed) {
    m.surviveTime.progress = val;
    if (m.surviveTime.progress >= m.surviveTime.target) {
      completeMission('surviveTime');
    }
  }
  if (type === 'boss' && !m.beatBoss.completed) {
    m.beatBoss.progress += val;
    if (m.beatBoss.progress >= m.beatBoss.target) {
      completeMission('beatBoss');
    }
  }
  
  // Update UI tips
  updateMissionHint();
}

function updateMissionHint() {
  const m = saveData.missions;
  let activeHint = "COMPLETED ALL MISSIONS!";
  
  const incomplete = Object.keys(m).find(k => !m[k].completed);
  if (incomplete) {
    const active = m[incomplete];
    activeHint = `MISSION: ${active.desc} (${active.progress}/${active.target})`;
  }
  document.getElementById('hudMissionText').textContent = activeHint;
}

function completeMission(key) {
  const m = saveData.missions[key];
  m.completed = true;
  saveData.coins += m.reward;
  saveGameData();
  updateCoinsDisplay();
  if (window.gameAudio) window.gameAudio.playPowerUp();
  createExplosion(canvas.width / 2, 50, '#ffea00', 30, 4);
}

function triggerAchievement(id) {
  if (saveData.achievements.includes(id)) return;
  saveData.achievements.push(id);
  saveGameData();
  
  // Play visual notice inside canvas
  createExplosion(player.x + player.w/2, player.y, '#39ff14', 25, 4.5);
  
  // Push custom notification message banner dynamically
  const banner = document.createElement('div');
  banner.className = 'achievement-toast';
  banner.style.position = 'absolute';
  banner.style.bottom = '20px';
  banner.style.right = '20px';
  banner.style.background = 'rgba(10, 10, 30, 0.9)';
  banner.style.border = '2px solid #39ff14';
  banner.style.padding = '12px';
  banner.style.borderRadius = '4px';
  banner.style.color = '#fff';
  banner.style.zIndex = '5000';
  banner.style.boxShadow = '0 0 15px rgba(57, 255, 20, 0.4)';
  banner.style.fontFamily = 'Orbitron, sans-serif';
  banner.style.fontSize = '12px';
  
  const config = ACHIEVEMENTS_CONFIG.find(c => c.id === id);
  banner.innerHTML = `🏆 UNLOCKED: <strong>${config.name}</strong><br><span style="font-size:10px; color:#aaa">${config.desc}</span>`;
  
  document.getElementById('gameContainer').appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

// --- COLLISION HELPER ---
function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// --- CORE GAME LOOP & SYSTEM UPDATES ---
function update() {
  if (gameState === STATES.BOSS_WARNING) {
    bossWarningTimer--;
    if (bossWarningTimer <= 0) {
      gameState = STATES.PLAYING;
      spawnBossShip();
    }
    updateStarfield();
    updateBackgroundAtmosphere();
    return;
  }

  if (gameState !== STATES.PLAYING) return;

  playTime = Math.floor((Date.now() - startTime) / 1000);
  checkActiveMissions('time', playTime);

  // Recharge Shield permanent upgrade
  const shieldUpgradeLvl = saveData.upgrades.shield || 0;
  if (shieldUpgradeLvl > 0 && player.shield < player.maxShield) {
    player.shield += 0.05; // slow recharge
    updateHUDLivesShield();
  }

  // Clear combo text indicator if cooldown passed
  if (Date.now() - lastKillTime > COMBO_COOLDOWN) {
    comboCount = 0;
    document.getElementById('hudCombo').classList.remove('active');
  }

  updatePlayerPosition();
  updateWeaponState();
  updateStarfield();
  updateBackgroundAtmosphere();
  updatePlayerBullets();
  updateEnemyBullets();
  updateEnemies();
  updateAsteroids();
  updateCoins();
  updatePowerups();
  updateParticles();
  if (boss) updateBossBehavior();
}

function updatePlayerPosition() {
  if (controlScheme === 'keys') {
    const activeSpeed = player.powerups.speedBoost.active ? player.speed * 1.5 : player.speed;
    if ((keys['ArrowLeft'] || keys['KeyA'] || keys['a']) && player.x > 0) player.x -= activeSpeed;
    if ((keys['ArrowRight'] || keys['KeyD'] || keys['d']) && player.x < canvas.width - player.w) player.x += activeSpeed;
    if ((keys['ArrowUp'] || keys['KeyW'] || keys['w']) && player.y > 100) player.y -= activeSpeed;
    if ((keys['ArrowDown'] || keys['KeyS'] || keys['s']) && player.y < canvas.height - player.h) player.y += activeSpeed;
  } else if (controlScheme === 'touch' && joystick.active) {
    const activeSpeed = player.powerups.speedBoost.active ? player.speed * 1.5 : player.speed;
    player.x += joystick.dx * activeSpeed;
    player.y += joystick.dy * activeSpeed;

    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(100, Math.min(canvas.height - player.h, player.y));
  }

  // Invulnerability timer
  if (player.invulnerable) {
    player.invulnTime--;
    if (player.invulnTime <= 0) {
      player.invulnerable = false;
    }
  }

  // Engine Fire trails (glow particles)
  if (Math.random() < 0.4) {
    particles.push({
      x: player.x + player.w / 2 + (Math.random() - 0.5) * 8,
      y: player.y + player.h - 5,
      vx: (Math.random() - 0.5) * 1.0,
      vy: Math.random() * 2 + 3,
      size: Math.random() * 2.5 + 1.0,
      color: `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.3})`,
      life: 15,
      maxLife: 20
    });
  }
}

function updateWeaponState() {
  if (controlScheme === 'keys') {
    if (keys[' '] || keys['Space']) shoot();
  } else {
    // Mouse and Joystick auto fire
    shoot();
  }
}

function updateStarfield() {
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });
}

function updateBackgroundAtmosphere() {
  // Nebula drifting
  nebulae.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
    if (n.y - n.radius > canvas.height) {
      n.y = -n.radius;
      n.x = Math.random() * canvas.width;
    }
  });

  // Background planet movement
  backgroundPlanet.y += backgroundPlanet.speed;
  backgroundPlanet.phase += 0.002;
  if (backgroundPlanet.y - backgroundPlanet.size > canvas.height) {
    createBackgroundPlanet();
  }
}

function updatePlayerBullets() {
  bullets.forEach((b, idx) => {
    // Standard movements
    b.y += b.vy;
    if (b.vx) b.x += b.vx;

    // Seeker rocket target searching
    if (b.isRocket) {
      b.smokeTimer++;
      if (b.smokeTimer % 3 === 0) {
        particles.push({
          x: b.x + b.w / 2, y: b.y + b.h, vx: (Math.random() - 0.5) * 1, vy: 1,
          size: 2, color: 'rgba(255, 100, 0, 0.8)', life: 12, maxLife: 15
        });
      }

      // Lock on closest enemy
      let closestEnemy = null;
      let minDist = 99999;
      enemies.forEach(e => {
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closestEnemy = e;
        }
      });

      if (closestEnemy) {
        const angle = Math.atan2(closestEnemy.y - b.y, closestEnemy.x - b.x);
        b.vx += Math.cos(angle) * 0.45;
        b.vy += Math.sin(angle) * 0.45;
        
        // Speed cap
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 11) {
          b.vx = (b.vx / speed) * 11;
          b.vy = (b.vy / speed) * 11;
        }
      } else {
        b.vy -= 0.2; // default fly forward acceleration
      }
    }

    if (b.y < -30 || b.y > canvas.height + 30 || b.x < -30 || b.x > canvas.width + 30) {
      bullets.splice(idx, 1);
    }
  });
}

function updateEnemyBullets() {
  enemyBullets.forEach((eb, idx) => {
    eb.y += eb.vy;
    if (eb.vx) eb.x += eb.vx;
    
    // Offscreen cleanup
    if (eb.y > canvas.height + 20 || eb.x < -20 || eb.x > canvas.width + 20) {
      enemyBullets.splice(idx, 1);
      return;
    }

    // Player collision
    if (checkCollision(eb, player)) {
      enemyBullets.splice(idx, 1);
      damagePlayer();
    }
  });
}

function updateEnemies() {
  // Spawner Logic
  // Story target checking
  const maxSpawn = 4 + currentLevel;
  const isFreeze = player.powerups.freezeEnemies.active;

  if (enemies.length < maxSpawn && !boss && Math.random() < 0.02) {
    spawnEnemy();
  }

  enemies.forEach((e, idx) => {
    const actSpeed = isFreeze ? 0.15 : e.speed;
    
    // Unique type paths
    if (e.type === 'zigzag') {
      e.zigzagPhase += 0.04;
      e.x = e.startX + Math.sin(e.zigzagPhase) * 60;
      e.y += actSpeed;
    } else if (e.type === 'invisible') {
      e.y += actSpeed;
      if (e.invisibleFading) {
        e.invisibleOpacity -= 0.02;
        if (e.invisibleOpacity <= 0.15) e.invisibleFading = false;
      } else {
        e.invisibleOpacity += 0.02;
        if (e.invisibleOpacity >= 1.0) e.invisibleFading = true;
      }
    } else if (e.type === 'kamikaze') {
      // Charges down locking player X when y reaches canvas middle
      if (!e.kamiLocked && e.y > canvas.height * 0.3) {
        e.kamiLocked = true;
        e.kamiTargetX = player.x;
      }

      if (e.kamiLocked) {
        e.y += actSpeed * 2.2;
        e.x += (e.kamiTargetX - e.x) * 0.05;
      } else {
        e.y += actSpeed;
      }
    } else {
      // Normal, Fast, Tank, Shooter standard down
      e.y += actSpeed;
    }

    // Offscreen boundary cleanup
    if (e.y > canvas.height) {
      enemies.splice(idx, 1);
      damagePlayer(); // Leak damages hull
      return;
    }

    // Ship to ship collision
    if (checkCollision(e, player)) {
      enemies.splice(idx, 1);
      damagePlayer();
      createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, 15);
      triggerExplodeAudio();
      triggerScreenShake(12, 6);
      return;
    }

    // Shooter enemy fires
    if (e.type === 'shooter' && !isFreeze) {
      e.shootTimer += 16.6; // ~1 frame at 60fps
      if (e.shootTimer >= 1800) {
        e.shootTimer = 0;
        enemyBullets.push({
          x: e.x + e.w / 2 - 2,
          y: e.y + e.h,
          w: 5,
          h: 12,
          vx: 0,
          vy: 5.5
        });
      }
    }

    // Hit by player bullets
    bullets.forEach((b, bIdx) => {
      if (checkCollision(b, e)) {
        bullets.splice(bIdx, 1);
        
        // Account for invisible fading damage evasion
        let actDmg = b.damage;
        if (e.type === 'invisible' && e.invisibleOpacity < 0.3) {
          actDmg *= 0.2; // partial dodge
        }
        
        e.hp -= actDmg;

        // Damage spark particles
        createExplosion(b.x, b.y, e.color, 4, 1.5);

        if (e.hp <= 0) {
          enemies.splice(idx, 1);
          triggerEnemyDeath(e);
        }
      }
    });
  });
}

function triggerEnemyDeath(e) {
  createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, e.type === 'tank' ? 30 : 15, e.type === 'tank' ? 5 : 3.5);
  triggerExplodeAudio();
  triggerScreenShake(e.type === 'tank' ? 15 : 8, e.type === 'tank' ? 7 : 3.5);

  // Award rewards
  const points = e.type === 'tank' ? 50 : e.type === 'fast' ? 20 : 10;
  score += points;
  levelScore += points;
  runKills++;
  totalKills++;
  saveData.highScore = Math.max(saveData.highScore, score);
  
  document.getElementById('hudScore').textContent = score;

  // Increment Combos
  incrementCombo();

  // Achievement Check
  triggerAchievement('first_kill');
  if (score >= 100) triggerAchievement('score_100');
  if (score >= 1000) triggerAchievement('score_1000');
  if (totalKills >= 100) triggerAchievement('enemies_100');

  // Mission check
  checkActiveMissions('kill', 1);

  // Coins drop
  const coinsChance = e.type === 'tank' ? 5 : Math.random() < 0.4 ? 2 : 1;
  for (let i = 0; i < coinsChance; i++) {
    spawnCoin(e.x + e.w / 2 + (Math.random() - 0.5) * 20, e.y + e.h / 2);
  }

  // Powerups drops check (15% chance)
  if (Math.random() < 0.15) {
    spawnPowerup(e.x + e.w / 2, e.y + e.h / 2);
  }

  // Story Mode Planet level progression check
  if (gameMode === 'story') {
    const planetConf = PLANETS[currentLevel - 1];
    if (levelScore >= planetConf.targetScore && !boss && currentLevel < 6) {
      triggerBossWarning();
    }
  } else {
    // Endless mode boss spawn triggers
    bossScoreCounter += points;
    if (bossScoreCounter >= 1000 && !boss) {
      bossScoreCounter = 0;
      triggerBossWarning();
    }
  }
}

function updateAsteroids() {
  if (asteroids.length < 3 && Math.random() < 0.005) {
    spawnAsteroid();
  }

  asteroids.forEach((ast, idx) => {
    ast.y += ast.vy;
    ast.x += ast.vx;
    ast.rotation += ast.rotSpeed;

    // Bounce off walls
    if (ast.x < 0 || ast.x > canvas.width - ast.w) {
      ast.vx *= -1;
    }

    if (ast.y > canvas.height + 40) {
      asteroids.splice(idx, 1);
      return;
    }

    // Player collision
    if (checkCollision(ast, player)) {
      asteroids.splice(idx, 1);
      damagePlayer();
      createExplosion(ast.x + ast.w / 2, ast.y + ast.h / 2, '#888888', 18, 4);
      triggerExplodeAudio();
      triggerScreenShake(14, 8);
      return;
    }

    // Enemy collision (Asteroids damage enemies too!)
    enemies.forEach((e, eIdx) => {
      if (checkCollision(ast, e)) {
        e.hp -= 2;
        createExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 8);
        if (e.hp <= 0) {
          enemies.splice(eIdx, 1);
          triggerEnemyDeath(e);
        }
      }
    });

    // Hit by bullets
    bullets.forEach((b, bIdx) => {
      if (checkCollision(b, ast)) {
        bullets.splice(bIdx, 1);
        ast.hp -= b.damage;
        createExplosion(b.x, b.y, '#888888', 3, 1);
        
        if (ast.hp <= 0) {
          asteroids.splice(idx, 1);
          createExplosion(ast.x + ast.w / 2, ast.y + ast.h / 2, '#888888', 15, 3.5);
          triggerExplodeAudio();
          // Drop coins or items sometimes
          if (Math.random() < 0.5) spawnCoin(ast.x + ast.w / 2, ast.y + ast.h / 2);
        }
      }
    });
  });
}

function updateCoins() {
  const isMagnet = player.powerups.magnetCoins.active;
  const magnetUpgradeLvl = saveData.upgrades.magnet || 0;
  const pullRange = isMagnet ? 250 : 50 + magnetUpgradeLvl * 25;

  coins.forEach((c, idx) => {
    // Magnet attraction calculation
    const dx = (player.x + player.w / 2) - c.x;
    const dy = (player.y + player.h / 2) - c.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < pullRange) {
      // Pull toward player
      const speed = isMagnet ? 8.5 : 4.5;
      c.x += (dx / distance) * speed;
      c.y += (dy / distance) * speed;
    } else {
      // Float down standard
      c.y += c.vy;
    }

    c.spin += 0.05;

    if (c.y > canvas.height + 20) {
      coins.splice(idx, 1);
      return;
    }

    // Collect coin
    if (checkCollision(c, player)) {
      coins.splice(idx, 1);
      saveData.coins++;
      runCoins++;
      updateCoinsDisplay();
      triggerCoinAudio();
      checkActiveMissions('coin', 1);
    }
  });
}

function updatePowerups() {
  powerups.forEach((pw, idx) => {
    pw.y += pw.vy;
    if (pw.y > canvas.height + 30) {
      powerups.splice(idx, 1);
      return;
    }

    // Pickup
    if (checkCollision(pw, player)) {
      powerups.splice(idx, 1);
      activatePowerup(pw.type);
    }
  });

  // Tick powerup durations
  const pKeys = Object.keys(player.powerups);
  let activePowerupKey = null;

  pKeys.forEach(k => {
    const pw = player.powerups[k];
    if (pw.active) {
      pw.time -= 16.6; // ~1 frame duration subtraction
      activePowerupKey = k;
      
      // Update Timer HUD
      document.getElementById('powerupTimer').style.display = 'flex';
      const label = k === 'speedBoost' ? 'SPEED ⚡' : k === 'tripleBullet' ? 'TRIPLE FIRE 🔥' : k === 'shieldInvuln' ? 'SHIELD INVULN 🛡️' : k === 'freezeEnemies' ? 'FREEZE ENEMIES ❄️' : 'MAGNET COINS 🧲';
      document.getElementById('powerupLabel').textContent = `${label}:`;
      document.getElementById('powerupBar').style.width = `${(pw.time / pw.duration) * 100}%`;

      if (pw.time <= 0) {
        pw.active = false;
        document.getElementById('powerupTimer').style.display = 'none';
      }
    }
  });

  if (!activePowerupKey) {
    document.getElementById('powerupTimer').style.display = 'none';
  }
}

function activatePowerup(type) {
  triggerPowerUpAudio();

  if (type === 'life') {
    if (player.lives < player.maxLives) {
      player.lives++;
      updateHUDLivesShield();
    }
    createShockwave(player.x + player.w/2, player.y + player.h/2, 40, '#ff0055');
  } else if (type === 'bomb') {
    // Clear screen effect
    triggerScreenShake(30, 15);
    createShockwave(canvas.width/2, canvas.height/2, 280, '#ff0000');
    
    // Clear normal enemies
    enemies.forEach(e => {
      score += 10;
      createExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 10);
      runKills++;
    });
    enemies = [];

    // Damage Boss
    if (boss) {
      boss.hp -= 20;
      if (boss.hp <= 0) destroyBoss();
    }

    // Clear enemy bullets
    enemyBullets = [];
  } else {
    // Timer based states
    const map = {
      speed: 'speedBoost',
      triple: 'tripleBullet',
      shield: 'shieldInvuln',
      freeze: 'freezeEnemies',
      magnet: 'magnetCoins'
    };
    
    const key = map[type];
    if (key) {
      // Deactivate others to avoid overlay bugs
      Object.keys(player.powerups).forEach(k => {
        player.powerups[k].active = false;
      });

      player.powerups[key].active = true;
      player.powerups[key].time = player.powerups[key].duration;
    }
  }
}

function updateParticles() {
  particles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) {
      particles.splice(idx, 1);
    }
  });
}

// --- BOSS LOGIC ---
function updateBossBehavior() {
  // Move down to target arena
  if (boss.y < boss.targetY) {
    boss.y += boss.speed;
    return;
  }

  // Left-right floating motion
  boss.x += boss.speed * boss.direction;
  if (boss.x <= 10) {
    boss.direction = 1;
  } else if (boss.x >= canvas.width - boss.w - 10) {
    boss.direction = -1;
  }

  // AI patterns
  boss.attackTimer += 16.6;
  
  if (boss.attackTimer > 2800) {
    boss.attackTimer = 0;
    // Swap patterns randomly
    boss.attackPattern = Math.floor(Math.random() * 3);
    
    if (boss.attackPattern === 2) {
      // Setup Giant Sweeping Laser warning
      boss.laserWarning = true;
      boss.laserTimer = 90; // 1.5 seconds warning
      boss.laserSweepX = boss.x + boss.w / 2;
      boss.laserSweepDir = boss.direction;
      if (window.gameAudio) window.gameAudio.playBossWarning();
    }
  }

  // Execute current pattern
  if (boss.attackPattern === 0 && Math.random() < 0.05) {
    // Bullet spray fan
    const cx = boss.x + boss.w / 2;
    const cy = boss.y + boss.h - 10;
    for (let i = -2; i <= 2; i++) {
      enemyBullets.push({
        x: cx,
        y: cy,
        w: 5,
        h: 12,
        vx: i * 1.5,
        vy: 5.5
      });
    }
  } else if (boss.attackPattern === 1 && Math.random() < 0.03) {
    // Circular missile ring blast
    const cx = boss.x + boss.w / 2;
    const cy = boss.y + boss.h - 10;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      enemyBullets.push({
        x: cx,
        y: cy,
        w: 6,
        h: 12,
        vx: Math.cos(angle) * 4.5,
        vy: Math.sin(angle) * 4.5
      });
    }
  } else if (boss.attackPattern === 2) {
    // Sweeping laser logic
    if (boss.laserWarning) {
      boss.laserTimer--;
      if (boss.laserTimer <= 0) {
        boss.laserWarning = false;
        boss.laserActive = true;
        boss.laserTimer = 120; // 2 seconds fire duration
      }
    } else if (boss.laserActive) {
      boss.laserTimer--;
      // Sweep coordinates slowly
      boss.laserSweepX += boss.laserSweepDir * 3.5;
      if (boss.laserSweepX < 30 || boss.laserSweepX > canvas.width - 30) {
        boss.laserSweepDir *= -1;
      }

      // Check laser overlap with player
      const laserWidth = 35;
      if (player.x + player.w > boss.laserSweepX - laserWidth / 2 &&
          player.x < boss.laserSweepX + laserWidth / 2 &&
          player.y > boss.y + boss.h) {
        damagePlayer();
      }

      if (boss.laserTimer <= 0) {
        boss.laserActive = false;
        boss.attackPattern = 0; // return to normal
      }
    }
  }

  // Update Health Bar in DOM
  const percent = (boss.hp / boss.maxHp) * 100;
  document.getElementById('bossHealthBar').style.width = `${percent}%`;

  // Boss hit by player bullets
  bullets.forEach((b, idx) => {
    if (checkCollision(b, boss)) {
      bullets.splice(idx, 1);
      boss.hp -= b.damage;
      createExplosion(b.x, b.y, '#7f00ff', 4, 2);

      if (boss.hp <= 0) {
        destroyBoss();
      }
    }
  });
}

function destroyBoss() {
  createShockwave(boss.x + boss.w / 2, boss.y + boss.h / 2, 100, '#ff00ff');
  createExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff007f', 60, 6);
  triggerExplodeAudio();
  triggerScreenShake(35, 18);
  
  boss = null;
  document.getElementById('bossHealthContainer').style.display = 'none';

  // Mission check
  checkActiveMissions('boss', 1);

  // Spawn massive rewards
  for (let i = 0; i < 20; i++) {
    spawnCoin(canvas.width/2 + (Math.random() - 0.5) * 120, 150 + (Math.random() - 0.5) * 50);
  }
  // Drop 2 random items
  spawnPowerup(canvas.width / 2 - 40, 160);
  spawnPowerup(canvas.width / 2 + 40, 160);

  // Score boost
  score += 500;
  document.getElementById('hudScore').textContent = score;

  // Trigger achievement
  triggerAchievement('boss_killer');

  // Verify story victory
  if (gameMode === 'story') {
    // Story win
    saveData.completedLevels.push(currentLevel);
    saveGameData();
    
    // Custom check for final planet beat
    if (currentLevel === 6) {
      endGame(true);
    } else {
      endGame(true);
    }
  } else {
    // Endless resume music
    if (window.gameAudio) {
      window.gameAudio.startMusic('normal');
    }
  }
}

// --- PLAYER DAMAGE HANDLERS ---
function damagePlayer() {
  if (player.invulnerable || gameState !== STATES.PLAYING) return;

  const activeShieldPowerup = player.powerups.shieldInvuln.active;
  if (activeShieldPowerup) return; // block 100%

  // Use shield capacity block first if available
  if (player.shield > 0) {
    player.shield -= 25; // absorbs 1/4 of total
    if (player.shield < 0) player.shield = 0;
    
    player.invulnerable = true;
    player.invulnTime = 40; // temporary flicker block
    
    createShockwave(player.x + player.w/2, player.y + player.h/2, 35, '#00ffff');
    updateHUDLivesShield();
    triggerScreenShake(12, 4);
    if (window.gameAudio) window.gameAudio.playPowerUp();
    return;
  }

  // Damage actual lives
  player.lives--;
  player.invulnerable = true;
  player.invulnTime = 80; // ~1.3 seconds invuln

  updateHUDLivesShield();
  triggerScreenShake(20, 10);
  
  // Flashing red overlay
  const flash = document.getElementById('screenFlash');
  flash.style.opacity = '0.5';
  setTimeout(() => flash.style.opacity = '0', 80);

  if (window.gameAudio) window.gameAudio.playExplosion();

  if (player.lives <= 0) {
    endGame(false);
  }
}

// --- END RUN ACTIONS ---
function endGame(victory = false) {
  gameState = STATES.GAMEOVER;
  
  if (window.gameAudio) {
    window.gameAudio.stopMusic();
    window.gameAudio.playGameOver();
  }

  hideAllScreens();
  document.getElementById('gameOver').style.display = 'flex';
  
  // Update final states
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalCoins').textContent = runCoins;
  document.getElementById('finalKills').textContent = runKills;
  document.getElementById('finalCombo').textContent = maxComboThisRun;

  // Add Coins locally
  saveData.coins += runCoins;
  saveData.highScore = Math.max(saveData.highScore, score);
  saveData.maxCombo = Math.max(saveData.maxCombo, maxComboThisRun);
  saveData.bestTime = Math.max(saveData.bestTime, playTime);
  
  saveGameData();
  updateCoinsDisplay();
}

function pauseGame() {
  gameState = STATES.PAUSED;
  document.getElementById('pauseMenu').style.display = 'flex';
}

function resumeGame() {
  hideAllScreens();
  gameState = STATES.PLAYING;
}

function restartRun() {
  hideAllScreens();
  initRun();
  gameState = STATES.PLAYING;
  if (window.gameAudio) {
    window.gameAudio.startMusic(currentLevel === 6 ? 'boss' : 'normal');
  }
}

function quitToMainMenu() {
  if (window.gameAudio) window.gameAudio.stopMusic();
  showMainMenu();
}

// --- CANVAS RENDERING ---
function drawPlayerShip() {
  const isInv = player.invulnerable && Math.floor(Date.now() / 80) % 2 === 0;
  if (isInv) return; // flicker effect

  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);

  // Setup cyber neon glow style
  ctx.shadowBlur = 15;
  ctx.shadowColor = player.color;
  ctx.fillStyle = player.color;

  const shipType = saveData.selectedShip || 'basic';

  if (shipType === 'basic') {
    // Tri jet
    ctx.beginPath();
    ctx.moveTo(0, -player.h/2);
    ctx.lineTo(-player.w/2, player.h/2);
    ctx.lineTo(0, player.h/2 - 10);
    ctx.lineTo(player.w/2, player.h/2);
    ctx.closePath();
    ctx.fill();
  } else if (shipType === 'ufo') {
    // Oval dome
    ctx.beginPath();
    ctx.ellipse(0, 0, player.w/2, player.h/3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Dome
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -5, player.w/4, Math.PI, 0);
    ctx.fill();
  } else if (shipType === 'fighter') {
    // Winged supersonic
    ctx.beginPath();
    ctx.moveTo(0, -player.h/2);
    ctx.lineTo(-player.w/3, -player.h/6);
    ctx.lineTo(-player.w/2, player.h/2);
    ctx.lineTo(-player.w/4, player.h/3);
    ctx.lineTo(0, player.h/2 - 8);
    ctx.lineTo(player.w/4, player.h/3);
    ctx.lineTo(player.w/2, player.h/2);
    ctx.lineTo(player.w/3, -player.h/6);
    ctx.closePath();
    ctx.fill();
  } else if (shipType === 'alien') {
    // Organic/insectoid side horns
    ctx.beginPath();
    ctx.moveTo(0, -player.h/2);
    ctx.lineTo(-player.w/4, -player.h/3);
    ctx.lineTo(-player.w/2, player.h/4);
    ctx.lineTo(-player.w/4, player.h/2);
    ctx.lineTo(0, player.h/3);
    ctx.lineTo(player.w/4, player.h/2);
    ctx.lineTo(player.w/2, player.h/4);
    ctx.lineTo(player.w/4, -player.h/3);
    ctx.closePath();
    ctx.fill();
  } else if (shipType === 'robot') {
    // Boxy carrier with cannons
    ctx.fillRect(-player.w/2, -player.h/4, player.w, player.h/2);
    // Cannons
    ctx.fillRect(-player.w/3, -player.h/2, 8, player.h/4);
    ctx.fillRect(player.w/3 - 8, -player.h/2, 8, player.h/4);
  }

  ctx.restore();

  // Draw permanent upgrades energy Shield bubble
  if (player.powerups.shieldInvuln.active || player.shield > 0) {
    ctx.save();
    ctx.strokeStyle = player.powerups.shieldInvuln.active ? '#ffaa00' : '#00ffff';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 18;
    ctx.shadowColor = ctx.strokeStyle;
    
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w * 0.72, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.save();
    ctx.shadowBlur = 10;
    
    if (b.isRocket) {
      // Draw rocket rect
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff5500';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      
      // Rocket fire tail
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(b.x + 2, b.y + b.h, b.w - 4, 6);
    } else if (b.isLaser) {
      // Glow laser bars
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    } else {
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    
    ctx.restore();
  });
}

function drawEnemyBullets() {
  ctx.fillStyle = '#ff0055';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff0055';
  
  enemyBullets.forEach(eb => {
    ctx.beginPath();
    ctx.arc(eb.x + eb.w/2, eb.y + eb.h/2, eb.w/2, 0, Math.PI*2);
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.save();
    
    // Handle invisible fading opacity
    if (e.type === 'invisible') {
      ctx.globalAlpha = e.invisibleOpacity;
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = e.color;
    ctx.fillStyle = e.color;

    // Draw enemy shapes based on subclasses
    ctx.translate(e.x + e.w/2, e.y + e.h/2);

    if (e.type === 'fast') {
      // Diamond speed scout
      ctx.beginPath();
      ctx.moveTo(0, -e.h/2);
      ctx.lineTo(-e.w/2, 0);
      ctx.lineTo(0, e.h/2);
      ctx.lineTo(e.w/2, 0);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'tank') {
      // Heavy hexagonal ship
      ctx.beginPath();
      ctx.moveTo(0, -e.h/2);
      ctx.lineTo(-e.w/2, -e.h/4);
      ctx.lineTo(-e.w/2, e.h/4);
      ctx.lineTo(0, e.h/2);
      ctx.lineTo(e.w/2, e.h/4);
      ctx.lineTo(e.w/2, -e.h/4);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'zigzag') {
      // Arrow spike
      ctx.beginPath();
      ctx.moveTo(0, e.h/2);
      ctx.lineTo(-e.w/2, -e.h/2);
      ctx.lineTo(0, -e.h/4);
      ctx.lineTo(e.w/2, -e.h/2);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'shooter') {
      // Double front cannon pod
      ctx.fillRect(-e.w/2, -e.h/3, e.w, e.h * 0.6);
      ctx.fillRect(-e.w/3, 0, 6, e.h/2);
      ctx.fillRect(e.w/3 - 6, 0, 6, e.h/2);
    } else if (e.type === 'kamikaze') {
      // Flame trail spiked triangular
      ctx.beginPath();
      ctx.moveTo(0, e.h/2);
      ctx.lineTo(-e.w/2, -e.h/2);
      ctx.lineTo(e.w/2, -e.h/2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Standard circular scout
      ctx.beginPath();
      ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Draw health bar above tank enemies
    if (e.type === 'tank' && e.hp < e.maxHp) {
      ctx.fillStyle = '#222';
      ctx.fillRect(e.x, e.y - 12, e.w, 4);
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(e.x, e.y - 12, (e.hp / e.maxHp) * e.w, 4);
    }
  });
}

function drawAsteroids() {
  asteroids.forEach(ast => {
    ctx.save();
    ctx.translate(ast.x + ast.w/2, ast.y + ast.h/2);
    ctx.rotate(ast.rotation);

    ctx.fillStyle = '#444';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#666';

    // Draw jagged circle asteroid shape
    ctx.beginPath();
    const points = 8;
    const r = ast.w / 2;
    for (let i = 0; i < points; i++) {
      const angle = (i * Math.PI * 2) / points;
      // jagged jitter offset
      const offset = (Math.sin(i * 3.4) + Math.cos(i * 2.1)) * (r * 0.12);
      const pr = r + offset;
      const px = Math.cos(angle) * pr;
      const py = Math.sin(angle) * pr;
      
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });
}

function drawCoins() {
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#ffea00';
  ctx.fillStyle = '#ffea00';

  coins.forEach(c => {
    ctx.save();
    ctx.translate(c.x + c.w/2, c.y + c.h/2);
    // Spinning scale effect
    ctx.scale(Math.sin(c.spin), 1.0);
    
    ctx.beginPath();
    ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw tiny inner coin symbol
    ctx.fillStyle = '#000';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);

    ctx.restore();
  });
  ctx.restore();
}

function drawPowerups() {
  powerups.forEach(pw => {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = pw.color;
    
    // Outer floating border glow box
    ctx.strokeStyle = pw.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pw.x, pw.y, pw.w, pw.h);
    
    // Draw emoji icon center
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pw.icon, pw.x + pw.w/2, pw.y + pw.h/2);

    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1.0;
}

function drawBossShip() {
  if (!boss) return;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff00ff';
  ctx.fillStyle = '#7f00ff';

  // Draw giant purple warning mothership
  ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
  
  ctx.beginPath();
  ctx.moveTo(0, -boss.h/2);
  ctx.lineTo(-boss.w/2, -boss.h/4);
  ctx.lineTo(-boss.w/2 + 20, boss.h/2);
  ctx.lineTo(-boss.w/4, boss.h/3);
  ctx.lineTo(0, boss.h/2 - 10);
  ctx.lineTo(boss.w/4, boss.h/3);
  ctx.lineTo(boss.w/2 - 20, boss.h/2);
  ctx.lineTo(boss.w/2, -boss.h/4);
  ctx.closePath();
  ctx.fill();

  // Neon glowing core circle
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(0, 0, boss.h/4, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();

  // Draw boss attacks
  if (boss.laserWarning) {
    // Draw thin warning guide line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(boss.laserSweepX, boss.y + boss.h);
    ctx.lineTo(boss.laserSweepX, canvas.height);
    ctx.stroke();
    ctx.restore();
  } else if (boss.laserActive) {
    // Draw giant glowing neon pink sweep laser beam
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = 'rgba(255, 0, 127, 0.85)';
    
    const laserWidth = 35;
    ctx.fillRect(boss.laserSweepX - laserWidth / 2, boss.y + boss.h, laserWidth, canvas.height);
    
    // Core white hot laser center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boss.laserSweepX - 6, boss.y + boss.h, 12, canvas.height);
    ctx.restore();
  }
}

function drawBackgroundAtmosphere() {
  // 1. Draw Nebulae
  nebulae.forEach(n => {
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
    grad.addColorStop(0, n.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
    ctx.fill();
  });

  // 2. Draw Planets / Moon
  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = backgroundPlanet.color;
  ctx.fillStyle = backgroundPlanet.color;

  ctx.translate(backgroundPlanet.x, backgroundPlanet.y);
  
  // Core sphere
  ctx.beginPath();
  ctx.arc(0, 0, backgroundPlanet.size, 0, Math.PI*2);
  ctx.fill();

  // Shadow overlay to make it 3D spherical
  const shadowGrad = ctx.createRadialGradient(
    -backgroundPlanet.size * 0.3, 
    -backgroundPlanet.size * 0.3, 
    backgroundPlanet.size * 0.2, 
    0, 0, backgroundPlanet.size
  );
  shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
  
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, backgroundPlanet.size + 1, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawStars() {
  stars.forEach(s => {
    // Pulsing opacity twinkle
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * (Math.random() * 0.4 + 0.6)})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
}

// --- MAIN GAME LOOP IMPLEMENTATION ---
function gameLoop() {
  // Calculate FPS
  const now = performance.now();
  const delta = now - lastFrameTime;
  lastFrameTime = now;
  fps = Math.round(1000 / delta);
  if (fpsCounterEl && Math.random() < 0.05) {
    fpsCounterEl.textContent = `FPS: ${fps}`;
  }

  // Clear context
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  
  // Apply Screen Shake translations
  if (shakeTime > 0) {
    shakeTime--;
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
  }

  // Draw background aesthetics first
  drawStars();
  drawBackgroundAtmosphere();

  // Game elements drawing
  if (gameState === STATES.PLAYING || gameState === STATES.BOSS_WARNING || gameState === STATES.PAUSED) {
    drawAsteroids();
    drawCoins();
    drawPowerups();
    drawPlayerShip();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawBossShip();
    drawParticles();
  }

  ctx.restore();

  // Run update computations
  update();

  requestAnimationFrame(gameLoop);
}

// Start everything
window.onload = () => {
  initGame();
  checkDailyRewardNotifier();
  resizeGame();
};

function resizeGame() {
  const container = document.getElementById('gameContainer');
  if (!container) return;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Calculate best fit scale
  const scaleX = (windowWidth - 20) / 800;
  const scaleY = (windowHeight - 20) / 600;
  const scale = Math.min(scaleX, scaleY, 1); // limit to max 1.0 (original size)
  
  container.style.transform = `scale(${scale})`;
  container.style.transformOrigin = 'center';
}

window.addEventListener('resize', resizeGame);


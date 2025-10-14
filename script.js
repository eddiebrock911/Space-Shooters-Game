const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let score = 0;
let lives = 10;
let gameRunning = true;
let keys = {};

// Player
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 80,
  w: 50,
  h: 50,
  speed: 6,
  color: '#00ffff'
};

// Arrays
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

// Create stars background
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2,
    speed: Math.random() * 2 + 1
  });
}

// Input handlers
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Mobile controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const shootBtn = document.getElementById('shootBtn');

// Left
leftBtn.addEventListener('mousedown', () => keys['ArrowLeft'] = true);
leftBtn.addEventListener('mouseup', () => keys['ArrowLeft'] = false);
leftBtn.addEventListener('mouseleave', () => keys['ArrowLeft'] = false);
leftBtn.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowLeft'] = true; });
leftBtn.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowLeft'] = false; });

// Right
rightBtn.addEventListener('mousedown', () => keys['ArrowRight'] = true);
rightBtn.addEventListener('mouseup', () => keys['ArrowRight'] = false);
rightBtn.addEventListener('mouseleave', () => keys['ArrowRight'] = false);
rightBtn.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowRight'] = true; });
rightBtn.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowRight'] = false; });

// Shoot
shootBtn.addEventListener('mousedown', () => keys[' '] = true);
shootBtn.addEventListener('mouseup', () => keys[' '] = false);
shootBtn.addEventListener('mouseleave', () => keys[' '] = false);
shootBtn.addEventListener('touchstart', e => { e.preventDefault(); keys[' '] = true; });
shootBtn.addEventListener('touchend', e => { e.preventDefault(); keys[' '] = false; });

// Shooting
let lastShot = 0;
const shootDelay = 200;

function shoot() {
  const now = Date.now();
  if (now - lastShot > shootDelay) {
    bullets.push({
      x: player.x + player.w / 2 - 2,
      y: player.y,
      w: 4,
      h: 15,
      speed: 10
    });
    lastShot = now;
  }
}

// Spawn enemies
setInterval(() => {
  if (gameRunning) {
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      w: 40,
      h: 40,
      speed: Math.random() * 2 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }
}, 1000);

function createExplosion(x, y) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
    });
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = player.color;
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w / 2, player.y + player.h - 10);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBullets() {
  ctx.fillStyle = '#ffff00';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ffff00';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
  ctx.shadowBlur = 0;
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = e.color;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1;
}

function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.globalAlpha = Math.random() * 0.5 + 0.5;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

function update() {
  if (!gameRunning) return;

  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y < canvas.height - player.h) player.y += player.speed;
  if (keys[' ']) shoot();

  bullets.forEach((b, i) => {
    b.y -= b.speed;
    if (b.y < 0) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed;
    if (e.y > canvas.height) {
      enemies.splice(i, 1);
      lives--;
      document.getElementById('lives').textContent = lives;
      if (lives <= 0) endGame();
    }

    if (checkCollision(player, e)) {
      enemies.splice(i, 1);
      lives--;
      document.getElementById('lives').textContent = lives;
      createExplosion(e.x + e.w / 2, e.y + e.h / 2);
      if (lives <= 0) endGame();
    }
  });

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (checkCollision(b, e)) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score += 10;
        document.getElementById('score').textContent = score;
        createExplosion(e.x + e.w / 2, e.y + e.h / 2);
      }
    });
  });

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  });
}

function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function endGame() {
  gameRunning = false;
  document.getElementById('gameOver').style.display = 'block';
  document.getElementById('finalScore').textContent = score;
}

function restartGame() {
  score = 0;
  lives = 3;
  gameRunning = true;
  bullets = [];
  enemies = [];
  particles = [];
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 80;
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('gameOver').style.display = 'none';
}

function gameLoop() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawParticles();

  update();
  requestAnimationFrame(gameLoop);
}

gameLoop();

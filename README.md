<div align="center">

<!-- Animated Space Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:000000,30:0a0a2e,60:1a0533,100:00d4ff&height=230&section=header&text=🚀%20Space%20Shooters&fontSize=58&fontColor=00d4ff&fontAlignY=38&desc=Destroy%20Enemy%20Spaceships%20%7C%20Built%20with%20Vanilla%20JS&descAlignY=60&descSize=18&animation=twinkling" width="100%"/>

<!-- Animated Typing -->
[![Typing SVG](https://readme-typing-svg.demolab.com?font=Orbitron&weight=700&size=20&pause=1000&color=00D4FF&center=true&vCenter=true&random=false&width=700&lines=💥+Shoot.+Survive.+Dominate+the+Galaxy;🛸+Dodge+Enemy+Fire+%7C+Destroy+All+Ships;⚡+Pure+JavaScript+%7C+No+Libraries+Needed;🎮+Open+in+Browser+%26+Play+Instantly!)](https://git.io/typing-svg)

<br/>

<!-- Badges -->
![JavaScript](https://img.shields.io/badge/JavaScript-66.3%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-24.4%25-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-9.3%25-E34F26?style=for-the-badge&logo=html5&logoColor=white)

<br/>

![Status](https://img.shields.io/badge/Game%20Status-Playable%20🟢-00d4ff?style=flat-square)
&nbsp;
![No Dependencies](https://img.shields.io/badge/Dependencies-Zero%20⚡-brightgreen?style=flat-square)
&nbsp;
![Platform](https://img.shields.io/badge/Platform-Browser%20🌐-blueviolet?style=flat-square)
&nbsp;
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

</div>

---

<div align="center">

```
  ██████╗  █████╗  ███╗   ███╗ ███████╗
 ██╔════╝ ██╔══██╗ ████╗ ████║ ██╔════╝
 ██║  ███╗███████║ ██╔████╔██║ █████╗  
 ██║   ██║██╔══██║ ██║╚██╔╝██║ ██╔══╝  
 ╚██████╔╝██║  ██║ ██║ ╚═╝ ██║ ███████╗
  ╚═════╝ ╚═╝  ╚═╝ ╚═╝     ╚═╝ ╚══════╝

    🚀 S P A C E   S H O O T E R S 🚀
```

</div>

---

## 🎮 About The Game

> **Space Shooters** is a fast-paced, browser-based arcade shooter where you pilot your spacecraft through hostile alien territory. Blast enemy ships, dodge incoming fire, and survive as long as possible in the infinite void of space!

Built with **pure Vanilla JavaScript** — no frameworks, no game engines, no dependencies. Just raw code, HTML5 Canvas, and skill. 🔥

---

## ✨ Features

| Feature | Description |
|---|---|
| 🚀 **Player Spaceship** | Smooth, responsive ship movement across the screen |
| 👾 **Enemy Ships** | Enemy spaceships that attack and challenge the player |
| 💥 **Shooting Mechanics** | Fire bullets to destroy enemy ships with satisfying explosions |
| ⭐ **Starfield Background** | Animated scrolling star parallax effect for deep space feel |
| 🎯 **Score System** | Track your kill count and beat your high score |
| ❤️ **Lives / Health** | Limited lives — survive as long as you can |
| 💀 **Game Over Screen** | Defeat screen with replay option |
| 📱 **Responsive Design** | Adapts to different screen sizes |
| ⚡ **Zero Dependencies** | Pure HTML + CSS + JS, runs in any browser instantly |

---

## 🕹️ How To Play

```
┌─────────────────────────────────────────┐
│          CONTROLS                       │
│                                         │
│   ←  ↑  ↓  →   Move your spaceship     │
│   [SPACE]       Fire bullets 💥         │
│   [R]           Restart game            │
│                                         │
│   🎯 OBJECTIVE:                         │
│   Destroy all enemy ships before        │
│   they destroy YOU!                     │
│                                         │
│   ⚠️  WARNING:                          │
│   Don't let enemies reach the           │
│   bottom — or it's GAME OVER!           │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Play Instantly (No Install Needed!)

```bash
# 1. Clone the repository
git clone https://github.com/eddiebrock911/Space-Shooters-Game.git

# 2. Navigate into the folder
cd Space-Shooters-Game

# 3. Open in browser
open index.html
# OR just double-click index.html — that's it! 🎮
```

> **No Node.js. No npm. No setup. Just open and play!** ⚡

---

## 📂 Project Structure

```
Space-Shooters-Game/
│
├── 🌐 index.html       # Game canvas & HTML structure
├── 🎨 style.css        # Space-themed UI, animations & layout
└── ⚡ script.js         # All game logic — engine, physics, AI
```

**Clean. Minimal. Powerful.**

---

## 🛠️ Tech Stack

<div align="center">

| Technology | Usage | Role |
|------------|-------|------|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) | Canvas Element | Game render surface |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Animations & Layout | UI styling & star effects |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Game Engine | Physics, logic, collisions, AI |

</div>

---

## 🧠 Game Architecture

```javascript
// Core Game Loop
function gameLoop() {
    update();       // → Move player, enemies, bullets
    detectCollisions(); // → Check bullet-enemy, enemy-player hits
    render();       // → Draw everything on Canvas
    requestAnimationFrame(gameLoop); // → 60 FPS smooth loop
}

// Key Systems
├── 🎮 Input Handler     → Keyboard events for movement & shooting
├── 🚀 Player Class      → Position, velocity, health, shooting
├── 👾 Enemy Class       → Spawn logic, movement patterns, AI
├── 💥 Bullet Class      → Projectile physics & lifetime
├── 💫 Particle System   → Explosion effects on kill
└── 📊 Score Manager     → Points, lives, high score tracking
```

---

## 🌟 Game Mechanics Deep Dive

```
PLAYER
  └── Moves in all 4 directions
  └── Fires bullets upward toward enemies
  └── Has limited lives (loses one on enemy collision)

ENEMIES
  └── Spawn from the top in waves
  └── Move downward toward player
  └── Increase in speed as score grows (difficulty scaling)

COLLISION DETECTION
  └── Bullet ↔ Enemy   → Enemy destroyed + score +1
  └── Enemy ↔ Player   → Player loses a life + screen flash
  └── Enemy reaches bottom → Life penalty

SCORE SYSTEM
  └── +10 points per enemy killed
  └── Bonus multiplier for rapid kills
  └── High score saved in session
```

---

## 📸 Preview

```
╔══════════════════════════════════════════╗
║  ★ . · ˚ . ✦   SCORE: 250  LIVES: ❤❤❤  ║
║  · ˚  . ★  ✦ ·  ˚  .   ·  ˚  ★  .  ·  ║
║                                          ║
║        👾  👾  👾  👾  👾               ║
║          👾  👾  👾  👾                 ║
║                                          ║
║  ˚  · ★  .  ✦   ˚  .  ·   ★  ˚  .     ║
║                  💥                      ║
║              |  ↑  |                     ║
║  ★  ˚  .     🚀  PLAYER  🚀    .  ˚  ★ ║
╚══════════════════════════════════════════╝
```

---

## 🔧 Customization Guide

Want to mod the game? Here's where to tweak:

```javascript
// In script.js — easy to customize:

const PLAYER_SPEED = 5;        // ← Make player faster/slower
const BULLET_SPEED = 8;        // ← Change bullet velocity
const ENEMY_SPEED = 2;         // ← Adjust enemy difficulty
const SPAWN_RATE = 60;         // ← Enemies per second (frames)
const SCORE_PER_KILL = 10;     // ← Points per enemy

// In style.css:
// Change background color, ship colors, explosion effects
```

---

## 🚀 Future Enhancements

```
🔲  Power-ups (shield, rapid fire, bomb)
🔲  Multiple enemy types with different behaviors  
🔲  Boss battles every 5 waves
🔲  Sound effects & background music
🔲  Mobile touch controls support
🔲  Local storage high score persistence
🔲  Multiplayer mode (2 players on same keyboard)
🔲  Animated sprite sheets for ships
```

---

## 👨‍💻 Developer

<div align="center">

| | |
|---|---|
| **Developer** | Ankit Kumar |
| **Location** | Patna, Bihar, India 🇮🇳 |
| **Portfolio** | [ankitai.onrender.com](https://ankitai.onrender.com/) |
| **Instagram** | [@__ankit._.op_](https://www.instagram.com/__ankit._.op_/) |
| **GitHub** | [eddiebrock911](https://github.com/eddiebrock911) |

</div>

---

## 📜 License

This project is open-source under the **MIT License** — free to use, modify, and distribute. Go build something epic! 🚀

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00d4ff,50:1a0533,100:000000&height=130&section=footer" width="100%"/>

**Made with ❤️ + ☕ by [Ankit Kumar](https://github.com/eddiebrock911) from Patna, Bihar 🇮🇳**

*🌟 If you liked this game, drop a star! It means the world.*

`[ GAME OVER? HIT R TO RESTART 🔄 ]`

</div>

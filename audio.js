class SpaceAudio {
  constructor() {
    this.ctx = null;
    this.musicInterval = null;
    this.musicPlaying = false;
    this.muted = false;
    this.musicMuted = false;
    this.sfxVolume = 0.3;
    this.musicVolume = 0.12;
    this.currentMusicType = null; // 'normal' or 'boss'
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  resumeContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playShoot() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playExplosion() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;
    
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
    noise.stop(this.ctx.currentTime + 0.45);
  }

  playCoin() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    
    osc.start(now);
    osc.stop(now + 0.20);
  }

  playPowerUp() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.21); // C6
    
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playGameOver() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.8);
    
    osc.start(now);
    osc.stop(now + 0.8);
  }

  playBossWarning() {
    this.resumeContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      const startTime = now + i * 0.4;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
      
      osc.frequency.setValueAtTime(220, startTime);
      osc.frequency.linearRampToValueAtTime(550, startTime + 0.35);
      
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    }
  }

  startMusic(type = 'normal') {
    this.resumeContext();
    if (!this.ctx) return;
    if (this.musicPlaying && this.currentMusicType === type) return;
    this.stopMusic();
    
    this.musicPlaying = true;
    this.currentMusicType = type;
    
    let step = 0;
    const tempo = type === 'boss' ? 140 : 115;
    const stepTime = 60 / tempo / 2; // 8th notes
    
    const normalBass = [
      55, 55, 110, 55, 55, 55, 110, 55, // A
      43.65, 43.65, 87.31, 43.65, 43.65, 43.65, 87.31, 43.65, // F
      65.41, 65.41, 130.81, 65.41, 65.41, 65.41, 130.81, 65.41, // C
      49, 49, 98, 49, 49, 49, 98, 49 // G
    ];
    
    const bossBass = [
      73.42, 73.42, 146.83, 73.42, 73.42, 73.42, 146.83, 73.42, // D
      77.78, 77.78, 155.56, 77.78, 77.78, 77.78, 155.56, 77.78, // D#
      82.41, 82.41, 164.81, 82.41, 82.41, 82.41, 164.81, 82.41, // E
      77.78, 77.78, 155.56, 77.78, 77.78, 77.78, 155.56, 77.78  // D#
    ];
    
    const bassSeq = type === 'boss' ? bossBass : normalBass;
    
    const normalMelody = [
      220, 0, 261.63, 293.66, 329.63, 0, 392.00, 440,
      0, 440, 392, 329.63, 293.66, 0, 261.63, 220
    ];
    const bossMelody = [
      293.66, 0, 311.13, 0, 349.23, 369.99, 0, 440,
      415.30, 0, 369.99, 349.23, 311.13, 293.66, 0, 0
    ];
    const melodySeq = type === 'boss' ? bossMelody : normalMelody;
    
    const playNote = (time, freq, noteType, vol, duration) => {
      if (this.musicMuted || this.muted || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = noteType;
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
    };
    
    let nextNoteTime = this.ctx.currentTime + 0.1;
    
    const scheduler = () => {
      while (nextNoteTime < this.ctx.currentTime + 0.3) {
        if (!this.musicPlaying) return;
        
        // Play Bass
        const bassFreq = bassSeq[step % bassSeq.length];
        playNote(nextNoteTime, bassFreq, 'sawtooth', this.musicVolume * 0.25, stepTime * 0.85);
        
        // Play Melody (occasionally)
        if (step % 2 === 0) {
          const melodyFreq = melodySeq[(step / 2) % melodySeq.length];
          if (melodyFreq > 0 && Math.random() > 0.4) {
            playNote(nextNoteTime, melodyFreq, 'triangle', this.musicVolume * 0.15, stepTime * 1.7);
          }
        }
        
        // Simple hi-hat (noise burst) on offbeats
        if (step % 4 === 2) {
          this.playHihat(nextNoteTime);
        }
        
        nextNoteTime += stepTime;
        step++;
      }
    };
    
    this.musicInterval = setInterval(scheduler, 100);
  }

  playHihat(time) {
    if (this.musicMuted || this.muted || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.musicVolume * 0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.03);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicType = null;
  }
}

const gameAudio = new SpaceAudio();
window.gameAudio = gameAudio;

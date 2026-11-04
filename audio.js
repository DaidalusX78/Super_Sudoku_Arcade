// ==========================================================================
// SUPER SUDOKU ARCADE - AUDIO SYNTH ENGINE & SOUND SETTING
// ==========================================================================

// --- 1. Audio Synth Engine ---
let isMuted = localStorage.getItem('superSudokuMuted') === 'true';

function initMuteButton() {
  const menuSoundText = document.getElementById('menu-sound-text');
  const menuSoundIcon = document.getElementById('menu-sound-icon');
  const menuMuteBtn = document.getElementById('menu-mute-btn');

  if (menuSoundText && menuSoundIcon) {
    if (isMuted) {
      menuSoundIcon.innerText = '🔇';
      menuSoundText.innerText = 'SOUND: OFF';
      if (menuMuteBtn) menuMuteBtn.classList.add('muted');
    } else {
      menuSoundIcon.innerText = '🔊';
      menuSoundText.innerText = 'SOUND: ON';
      if (menuMuteBtn) menuMuteBtn.classList.remove('muted');
    }
  }
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('superSudokuMuted', isMuted);
  initMuteButton();
  if (!isMuted) {
    initAudio();
    playSound('move');
  }
}

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx || isMuted) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  
  if (type === 'move') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.05);
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } else if (type === 'correct') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(987.77, now);
    oscillator.frequency.setValueAtTime(1318.51, now + 0.08);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } else if (type === 'error') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } else if (type === 'win') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.setValueAtTime(659.25, now + 0.1);
    oscillator.frequency.setValueAtTime(783.99, now + 0.2);
    oscillator.frequency.setValueAtTime(1046.50, now + 0.3);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
    oscillator.start(now);
    oscillator.stop(now + 0.6);
  } else if (type === 'gameover') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 1.5);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
    oscillator.start(now);
    oscillator.stop(now + 1.5);
  }
}

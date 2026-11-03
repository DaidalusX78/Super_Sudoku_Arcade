// ==========================================================================
// AUTOMATIC "GAME OVER" STUDIO INTRO ENGINE
// ==========================================================================

function runAutoStudioIntro() {
  const introOverlay = document.getElementById('studio-intro');
  const introAudio = document.getElementById('studio-intro-audio');

  if (!introOverlay) return;

  // 1. Force CSS reflow so keyframe animations start clean
  void introOverlay.offsetWidth;

  // 2. Immediately start the Intro Sequence
  introOverlay.classList.add('playing');

  // 3. Trigger Audio precisely when CRT Glitch completes (~4.3s)
  setTimeout(() => {
    if (introAudio) {
      introAudio.currentTime = 0;
      
      const playPromise = introAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.warn("Autoplay audio blocked. Click anywhere on screen to unblock.");
        });
      }
    }
  }, 4300);
}

// Automatically trigger intro on page load
document.addEventListener('DOMContentLoaded', runAutoStudioIntro);

// Audio Unlocker (Tap anywhere on screen if browser restricts autoplay)
document.addEventListener('click', () => {
  const introAudio = document.getElementById('studio-intro-audio');
  if (introAudio && introAudio.paused) {
    introAudio.currentTime = 0;
    introAudio.play().catch(e => console.log("Audio play error:", e));
  }
}, { once: true });

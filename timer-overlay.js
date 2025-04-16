(function () {
  // Create container for timer
  const containerDiv = document.createElement('div');
  containerDiv.id = 'timer-container';
  
  // Create circular timer structure
  containerDiv.innerHTML = `
    <div class="timer-circle-container">
      <svg class="timer-circles" viewBox="0 0 100 100">
        <circle class="timer-circle-bg" cx="50" cy="50" r="45"/>
        <circle class="timer1-progress" cx="50" cy="50" r="45"/>
        <circle class="timer2-progress" cx="50" cy="50" r="40"/>
      </svg>
      <div class="timer-content">
        <button id="timer-reset">Reset</button>
        <div id="timer-display"></div>
        <button id="timer-start">Start</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(containerDiv);

  // Get references to elements
  const timer1Progress = containerDiv.querySelector('.timer1-progress');
  const timer2Progress = containerDiv.querySelector('.timer2-progress');
  const timerDisplay = containerDiv.querySelector('#timer-display');
  const startButton = containerDiv.querySelector('#timer-start');
  const resetButton = containerDiv.querySelector('#timer-reset');

  // Calculate circle properties
  const timer1Circumference = 2 * Math.PI * 45;
  const timer2Circumference = 2 * Math.PI * 40;
  timer1Progress.style.strokeDasharray = timer1Circumference;
  timer2Progress.style.strokeDasharray = timer2Circumference;

  // Inject CSS styles
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Young+Serif&display=swap');

    #timer-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 200px;
      height: 200px;
      z-index: 9999;
    }

    .timer-circle-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .timer-circles {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .timer-circle-bg {
      fill: none;
      stroke: rgba(0, 0, 0, 0.2);
      stroke-width: 4;
    }

    .timer1-progress {
      fill: none;
      stroke: #ff4444;
      stroke-width: 4;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.1s;
    }

    .timer2-progress {
      fill: none;
      stroke: #4CAF50;
      stroke-width: 4;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.1s;
    }

    .timer-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    #timer-display {
      font-family: 'Young Serif', serif;
      font-size: 24px;
      color: #333;
      user-select: none;
    }

    #timer-start, #timer-reset {
      font-family: 'Young Serif', serif;
      padding: 5px 15px;
      border-radius: 15px;
      border: none;
      cursor: pointer;
      background: #333;
      color: white;
      transition: background 0.3s;
    }

    #timer-start:hover, #timer-reset:hover {
      background: #555;
    }

    #timer-start:disabled {
      background: #999;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  // Timer logic with state management
  const STORAGE_KEY = 'timerOverlayState';
  const timer1Duration = 25 * 60 * 1000;
  const timer2Duration = 5 * 60 * 1000;
  let interval;
  let isTimer1Active = true;
  let timer1Remaining = timer1Duration;
  let timer2Remaining = timer2Duration;
  let isRunning = false;
  let lastUpdateTime;

  // Add debug logging function
  const debug = (message) => {
    console.log(`[Timer Debug] ${message}`);
  };

  // Check localStorage availability
  function isLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      debug('localStorage not available: ' + e.message);
      return false;
    }
  }

  // Modified state management functions with error handling
  function saveState() {
    if (!isLocalStorageAvailable()) return;
    
    try {
      const state = {
        isTimer1Active,
        timer1Remaining,
        timer2Remaining,
        isRunning,
        lastUpdateTime: isRunning ? Date.now() : null,
        version: '1.0' // Add version tracking
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      debug('State saved: ' + JSON.stringify(state));
    } catch (e) {
      debug('Error saving state: ' + e.message);
    }
  }

  function loadState() {
    if (!isLocalStorageAvailable()) return false;

    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      debug('Loading saved state: ' + savedState);
      
      if (!savedState) {
        debug('No saved state found');
        return false;
      }

      const state = JSON.parse(savedState);
      
      // Validate state data
      if (!state || typeof state !== 'object') {
        debug('Invalid state format');
        return false;
      }

      isTimer1Active = state.isTimer1Active;
      timer1Remaining = state.timer1Remaining;
      timer2Remaining = state.timer2Remaining;
      isRunning = state.isRunning;
      lastUpdateTime = state.lastUpdateTime;

      // Compensate for time passed while page was closed
      if (isRunning && lastUpdateTime) {
        const timePassed = Date.now() - lastUpdateTime;
        debug(`Time passed while closed: ${timePassed}ms`);

        if (isTimer1Active) {
          timer1Remaining = Math.max(0, timer1Remaining - timePassed);
          if (timer1Remaining === 0) {
            isTimer1Active = false;
            playBuzzerSound();
          }
        } else {
          timer2Remaining = Math.max(0, timer2Remaining - timePassed);
          if (timer2Remaining === 0) {
            resetTimers();
            return false;
          }
        }
      }
      
      debug('State loaded successfully');
      return true;
    } catch (e) {
      debug('Error loading state: ' + e.message);
      return false;
    }
  }

  function updateCircleProgress(remaining, isTimer1) {
    const duration = isTimer1 ? timer1Duration : timer2Duration;
    const circumference = isTimer1 ? timer1Circumference : timer2Circumference;
    const circle = isTimer1 ? timer1Progress : timer2Progress;
    const progress = remaining / duration;
    const offset = circumference - (progress * circumference);
    circle.style.strokeDashoffset = offset;
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(isTimer1Active ? timer1Remaining : timer2Remaining);
    updateCircleProgress(timer1Remaining, true);
    updateCircleProgress(timer2Remaining, false);
    startButton.disabled = isRunning;
  }

  function resetTimers() {
    clearInterval(interval);
    timer1Remaining = timer1Duration;
    timer2Remaining = timer2Duration;
    isTimer1Active = true;
    isRunning = false;
    lastUpdateTime = null;
    updateDisplay();
    saveState();
  }

  // Replace the Audio elements with sound generation functions
  function playBuzzerSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for buzzer sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Buzzer settings
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime); // Low frequency
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    // Start and stop the sound
    oscillator.start();
    setTimeout(() => {
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    }, 400);
  }

  function playDingSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for ding sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Ding settings
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher frequency
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    // Start and stop the sound
    oscillator.start();
    setTimeout(() => {
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    }, 100);
  }

  function startTimers() {
    isRunning = true;
    startButton.disabled = true;
    lastUpdateTime = Date.now();
    saveState();

    const updateTimer = () => {
      const now = Date.now();
      const delta = now - lastUpdateTime;
      lastUpdateTime = now;

      if (isTimer1Active) {
        timer1Remaining = Math.max(0, timer1Remaining - delta);
        updateDisplay();
        
        if (timer1Remaining <= 0) {
          playBuzzerSound();
          isTimer1Active = false;
          saveState();
        }
      } else {
        timer2Remaining = Math.max(0, timer2Remaining - delta);
        updateDisplay();
        
        if (timer2Remaining <= 0) {
          playDingSound();
          resetTimers();
          startTimers();
          return;
        }
      }
      saveState();
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);
  }

  // Page visibility handling
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isRunning) {
        clearInterval(interval);
        lastUpdateTime = Date.now();
        saveState();
      }
    } else {
      if (isRunning) {
        loadState();
        startTimers();
      }
    }
  });

  // Modified initialize function with debugging
  function initialize() {
    debug('Initializing timer...');
    debug('Storage available: ' + isLocalStorageAvailable());
    
    if (loadState()) {
      debug('Restored previous state');
      updateDisplay();
      if (isRunning) {
        debug('Resuming timer');
        startTimers();
      }
    } else {
      debug('Starting fresh timer');
      resetTimers();
    }
  }

  // Event listeners
  startButton.addEventListener('click', startTimers);
  resetButton.addEventListener('click', resetTimers);

  // Add unload handler to ensure state is saved
  window.addEventListener('beforeunload', () => {
    debug('Page unloading - saving final state');
    saveState();
  });

  // Initialize on load
  initialize();
})();
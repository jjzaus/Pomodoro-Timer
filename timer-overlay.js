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

  // Timer logic
  const timer1Duration = 25 * 60 * 1000; // 25 minutes
  const timer2Duration = 5 * 60 * 1000;  // 5 minutes
  let interval;
  let isTimer1Active = true;
  let timer1Remaining = timer1Duration;
  let timer2Remaining = timer2Duration;

  // Add audio elements
  const buzzerSound = new Audio('path/to/buzzer.mp3');
  const dingSound = new Audio('path/to/ding.mp3');

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

  function resetTimers() {
    clearInterval(interval);
    timer1Remaining = timer1Duration;
    timer2Remaining = timer2Duration;
    timerDisplay.textContent = formatTime(timer1Duration);
    updateCircleProgress(timer1Remaining, true);
    updateCircleProgress(timer2Remaining, false);
    isTimer1Active = true;
    startButton.disabled = false;
  }

  function startTimers() {
    startButton.disabled = true;

    const updateTimer = () => {
      if (isTimer1Active) {
        timer1Remaining -= 1000;
        timerDisplay.textContent = formatTime(timer1Remaining);
        updateCircleProgress(timer1Remaining, true);
        
        if (timer1Remaining <= 0) {
          buzzerSound.play();
          isTimer1Active = false;
          timerDisplay.textContent = formatTime(timer2Remaining);
        }
      } else {
        timer2Remaining -= 1000;
        timerDisplay.textContent = formatTime(timer2Remaining);
        updateCircleProgress(timer2Remaining, false);
        
        if (timer2Remaining <= 0) {
          dingSound.play();
          resetTimers();
          startTimers();
          return;
        }
      }
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);
  }

  // Initialize display
  resetTimers();

  // Event listeners
  startButton.addEventListener('click', startTimers);
  resetButton.addEventListener('click', resetTimers);
})();
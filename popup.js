document.addEventListener("DOMContentLoaded", () => {
  const state = {
    birthday: JSON.parse(localStorage.getItem("birthday")) || null,
    bookmarks: JSON.parse(localStorage.getItem("bookmarks")) || [],
    todos: JSON.parse(localStorage.getItem("todos")) || [],
  };

  setupSummary();
  setupTodo();
  setupBirthdayTracker();
  setupPomodoro();
  setupHabits();
  setupSettings();

  function setupSummary() {
    const dateEl = document.getElementById("summaryDate");
    const timeEl = document.getElementById("summaryTime");
    const greetingEl = document.getElementById("greeting");
    const taskCounterEl = document.getElementById("taskCounter").querySelector("span");

    function updateTime() {
      const now = new Date();
      const hour = now.getHours();

      let greeting = "Good Morning";
      if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
      if (hour >= 17) greeting = "Good Evening";
      greetingEl.textContent = greeting + "!";

      dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      timeEl.textContent = now.toLocaleTimeString();

      const pendingTasks = state.todos.filter(todo => !todo.done).length;
      taskCounterEl.textContent = pendingTasks;
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  function setupTodo() {
    const todoForm = document.getElementById("todoForm");
    const todoInput = document.getElementById("todoInput");
    const todoStatusInput = document.getElementById("todoStatusInput");
    const todoList = document.getElementById("todoList");
    const todoFilters = document.getElementById("todoFilters");
    let currentFilter = 'open';

    const saveTodos = () => localStorage.setItem("todos", JSON.stringify(state.todos));

    const renderTodos = () => {
      todoList.innerHTML = "";

      const filteredTodos = state.todos.filter(todo => {
        if (currentFilter === 'open') return !todo.done;
        if (currentFilter === 'closed') return todo.done;
        return true;
      });

      filteredTodos.forEach(todo => {
        const index = state.todos.indexOf(todo);
        const li = document.createElement("li");
        li.className = `todo-item ${todo.done ? 'done' : ''}`;
        const statusTag = todo.status ? `<span class="todo-status">${todo.status}</span>` : '';

        li.innerHTML = `
          <div class="todo-content">
            <span class="todo-text" title="${todo.text}">${todo.text}</span>
            ${statusTag}
          </div>
          <div class="todo-actions">
            <button class="todo-edit"><i class="fas fa-pencil-alt"></i></button>
            <button class="todo-toggle"><i class="fas ${todo.done ? 'fa-undo' : 'fa-check'}"></i></button>
            <button class="todo-delete"><i class="fas fa-trash"></i></button>
          </div>
        `;

        li.querySelector('.todo-toggle').addEventListener('click', () => {
          state.todos[index].done = !state.todos[index].done;
          saveTodos();
          renderTodos();
        });

        li.querySelector('.todo-delete').addEventListener('click', () => {
          state.todos.splice(index, 1);
          saveTodos();
          renderTodos();
        });

        li.querySelector('.todo-edit').addEventListener('click', (e) => {
          const currentLi = e.currentTarget.closest('li');
          currentLi.classList.add('editing');
          const currentText = state.todos[index].text;
          const currentStatus = state.todos[index].status || '';

          currentLi.innerHTML = `
            <div class="todo-edit-view">
              <input type="text" class="todo-edit-text" value="${currentText}">
              <input type="text" class="todo-edit-status" value="${currentStatus}" placeholder="Status">
            </div>
            <div class="todo-actions">
              <button class="todo-save"><i class="fas fa-save"></i></button>
              <button class="todo-cancel"><i class="fas fa-times"></i></button>
            </div>
          `;

          currentLi.querySelector('.todo-save').addEventListener('click', () => {
            const newText = currentLi.querySelector('.todo-edit-text').value.trim();
            const newStatus = currentLi.querySelector('.todo-edit-status').value.trim();
            if (newText) {
              state.todos[index].text = newText;
              state.todos[index].status = newStatus;
              saveTodos();
            }
            renderTodos();
          });

          currentLi.querySelector('.todo-cancel').addEventListener('click', () => {
            renderTodos();
          });
        });

        todoList.appendChild(li);
      });
    };

    todoForm.addEventListener("submit", e => {
      e.preventDefault();
      const text = todoInput.value.trim();
      const status = todoStatusInput.value.trim();
      if (text) {
        state.todos.push({ text, status, done: false });
        saveTodos();
        renderTodos();
        todoForm.reset();
      }
    });

    todoFilters.addEventListener('click', e => {
      if (e.target.matches('.filter-btn')) {
        currentFilter = e.target.dataset.filter;
        todoFilters.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        renderTodos();
      }
    });

    renderTodos();
  }

  function setupBirthdayTracker() {
    const birthdayForm = document.getElementById("birthdayForm");
    const nameInput = document.getElementById("name");
    const dobInput = document.getElementById("dob");
    const birthdayDisplay = document.getElementById("birthdayDisplay");
    const birthdayInfo = document.getElementById("birthdayInfo");
    const personName = document.getElementById("personName");
    const birthdayActions = document.getElementById("birthdayActions");
    const editBirthdayBtn = document.getElementById("editBirthdayBtn");
    const deleteBirthdayBtn = document.getElementById("deleteBirthdayBtn");
    const birthdayProgress = document.getElementById("birthdayProgress");
    const daysLeft = document.getElementById("daysLeft");
    let ageUpdateInterval;

    const createAgeElements = () => {
      birthdayInfo.innerHTML = `
        <p><strong id="age-years">0</strong> years, <strong id="age-months">0</strong> months</p>
        <p><strong id="age-days">0</strong> days, <strong id="age-hours">0</strong> hours</p>
        <p><strong id="age-minutes">0</strong> minutes, <strong id="age-seconds">0</strong> seconds</p>
      `;
    };

    const updateAgeDisplay = (name, dob) => {
      clearInterval(ageUpdateInterval);
      const birthDate = new Date(dob);
      personName.textContent = name;

      if (!document.getElementById("age-years")) {
        createAgeElements();
      }

      const yearsEl = document.getElementById("age-years");
      const monthsEl = document.getElementById("age-months");
      const daysEl = document.getElementById("age-days");
      const hoursEl = document.getElementById("age-hours");
      const minutesEl = document.getElementById("age-minutes");
      const secondsEl = document.getElementById("age-seconds");

      const birthMonth = birthDate.getMonth();
      const birthDay = birthDate.getDate();

      updateAge();

      ageUpdateInterval = setInterval(updateAge, 1000);

      function updateAge() {
        const now = new Date();
        const ageMS = now - birthDate;
        const ageDate = new Date(ageMS);

        yearsEl.textContent = ageDate.getUTCFullYear() - 1970;
        monthsEl.textContent = ageDate.getUTCMonth();
        daysEl.textContent = ageDate.getUTCDate() - 1;
        hoursEl.textContent = ageDate.getUTCHours();
        minutesEl.textContent = ageDate.getUTCMinutes();
        secondsEl.textContent = ageDate.getUTCSeconds();

        const nextBirthday = new Date(now.getFullYear(), birthMonth, birthDay);
        if (nextBirthday < now) {
          nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }

        const daysUntilBirthday = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));
        const daysSinceBirthday = 365 - daysUntilBirthday;
        const progressPercent = (daysSinceBirthday / 365) * 100;

        daysLeft.textContent = daysUntilBirthday;
        birthdayProgress.style.width = `${progressPercent}%`;
      }
    };

    const renderBirthdayState = () => {
      if (state.birthday) {
        birthdayForm.classList.add('hidden');
        birthdayDisplay.classList.remove('hidden');
        updateAgeDisplay(state.birthday.name, state.birthday.dob);
      } else {
        birthdayForm.classList.remove('hidden');
        birthdayDisplay.classList.add('hidden');
        clearInterval(ageUpdateInterval);
      }
    };

    birthdayForm.addEventListener("submit", e => {
      e.preventDefault();
      state.birthday = { name: nameInput.value, dob: dobInput.value };
      localStorage.setItem("birthday", JSON.stringify(state.birthday));
      renderBirthdayState();
    });

    editBirthdayBtn.addEventListener('click', () => {
      nameInput.value = state.birthday.name;
      dobInput.value = state.birthday.dob;
      birthdayForm.classList.remove('hidden');
      birthdayDisplay.classList.add('hidden');
    });

    deleteBirthdayBtn.addEventListener('click', () => {
      state.birthday = null;
      localStorage.removeItem("birthday");
      renderBirthdayState();
    });

    renderBirthdayState();
  }

  function setupPomodoro() {
    const state = {
      pomodoro: JSON.parse(localStorage.getItem("pomodoro")) || {
        workDuration: 25,
        breakDuration: 5,
        timerState: null
      }
    };

    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const timerModeEl = document.getElementById("timerMode");
    const startTimerBtn = document.getElementById("startTimer");
    const pauseTimerBtn = document.getElementById("pauseTimer");
    const resetTimerBtn = document.getElementById("resetTimer");
    const workDurationInput = document.getElementById("workDuration");
    const breakDurationInput = document.getElementById("breakDuration");

    let timer;
    let isRunning = false;
    let isBreak = false;
    let timeLeft;
    const originalTitle = document.title;

    workDurationInput.value = state.pomodoro.workDuration;
    breakDurationInput.value = state.pomodoro.breakDuration;

    if (state.pomodoro.timerState) {
      const { isBreakSaved, timeLeftSaved, startTimeSaved, isRunningSaved } = state.pomodoro.timerState;

      isBreak = isBreakSaved;

      if (isRunningSaved && startTimeSaved) {
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - startTimeSaved) / 1000);

        timeLeft = Math.max(0, timeLeftSaved - elapsedSeconds);

        if (timeLeft <= 0) {
          isBreak = !isBreak;
          timeLeft = (isBreak ? state.pomodoro.breakDuration : state.pomodoro.workDuration) * 60;
        }

        updateDisplay();
        startTimer();
      } else {
        timeLeft = timeLeftSaved;
        updateDisplay();
        updateTimerUI(false);
      }
    } else {
      resetTimer();
    }

    function saveSettings() {
      state.pomodoro.workDuration = parseInt(workDurationInput.value);
      state.pomodoro.breakDuration = parseInt(breakDurationInput.value);
      localStorage.setItem("pomodoro", JSON.stringify(state.pomodoro));
    }

    function saveTimerState() {
      state.pomodoro.timerState = {
        isBreakSaved: isBreak,
        timeLeftSaved: timeLeft,
        startTimeSaved: isRunning ? new Date().getTime() : null,
        isRunningSaved: isRunning
      };

      localStorage.setItem("pomodoro", JSON.stringify(state.pomodoro));
    }

    function startTimer() {
      if (isRunning) return;

      isRunning = true;
      updateTimerUI(true);

      saveTimerState();

      timer = setInterval(() => {
        timeLeft--;

        if (timeLeft <= 0) {
          isBreak = !isBreak;
          resetTimer();
          playNotification();
          startTimer();
          return;
        }

        updateDisplay();
        saveTimerState();
      }, 1000);
    }

    function updateTimerUI(running) {
      startTimerBtn.disabled = running;
      pauseTimerBtn.disabled = !running;
      pauseTimerBtn.classList.toggle("disabled", !running);
      resetTimerBtn.disabled = !running && timeLeft === (isBreak ? state.pomodoro.breakDuration : state.pomodoro.workDuration) * 60;
      resetTimerBtn.classList.toggle("disabled", resetTimerBtn.disabled);
    }

    function pauseTimer() {
      if (!isRunning) return;

      isRunning = false;
      clearInterval(timer);
      updateTimerUI(false);

      document.title = originalTitle;

      saveTimerState();
    }

    function resetTimer() {
      pauseTimer();

      timeLeft = (isBreak ? state.pomodoro.breakDuration : state.pomodoro.workDuration) * 60;

      timerModeEl.textContent = isBreak ? "BREAK" : "FOCUS";
      timerModeEl.className = "timer-mode " + (isBreak ? "break" : "focus");

      updateDisplay();
      resetTimerBtn.disabled = true;
      resetTimerBtn.classList.add("disabled");

      saveTimerState();

      if (!isRunning) {
        document.title = originalTitle;
      }
    }

    function updateDisplay() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      minutesEl.textContent = minutes.toString().padStart(2, "0");
      secondsEl.textContent = seconds.toString().padStart(2, "0");

      if (isRunning) {
        document.title = `(${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}) ${isBreak ? 'Break' : 'Focus'} - KB Board`;
      }
    }

    function playNotification() {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(isBreak ? 'Break time!' : 'Focus time!', {
            body: isBreak ? 'Take a short break.' : 'Time to focus on your work.'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }

      try {
        const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
        audio.play();
      } catch (e) {
        console.log('Audio notification not available');
      }
    }

    startTimerBtn.addEventListener("click", startTimer);
    pauseTimerBtn.addEventListener("click", pauseTimer);
    resetTimerBtn.addEventListener("click", resetTimer);

    workDurationInput.addEventListener("change", () => {
      if (parseInt(workDurationInput.value) < 1) workDurationInput.value = 1;
      if (parseInt(workDurationInput.value) > 60) workDurationInput.value = 60;
      saveSettings();
      if (!isBreak && !isRunning) resetTimer();
    });

    breakDurationInput.addEventListener("change", () => {
      if (parseInt(breakDurationInput.value) < 1) breakDurationInput.value = 1;
      if (parseInt(breakDurationInput.value) > 30) breakDurationInput.value = 30;
      saveSettings();
      if (isBreak && !isRunning) resetTimer();
    });
  }

  function setupHabits() {
    const habitForm = document.getElementById("habitForm");
    const habitNameInput = document.getElementById("habitName");
    const habitsListEl = document.getElementById("habitsList");
    const completionRateEl = document.getElementById("completionRate");
    const habitsCompletedEl = document.getElementById("habitsCompleted");

    let habits = JSON.parse(localStorage.getItem("habits")) || [];

    const lastResetDate = localStorage.getItem("habitsLastReset");
    const today = new Date().toLocaleDateString();

    if (lastResetDate !== today) {
      habits = habits.map(habit => ({
        ...habit,
        completed: false
      }));

      localStorage.setItem("habitsLastReset", today);
      localStorage.setItem("habits", JSON.stringify(habits));
    }

    function saveHabits() {
      localStorage.setItem("habits", JSON.stringify(habits));
      updateStats();
    }

    function renderHabits() {
      habitsListEl.innerHTML = "";

      if (habits.length === 0) {
        habitsListEl.innerHTML = "<p class='text-center'>No habits yet. Add one to start tracking!</p>";
        return;
      }

      habits.forEach((habit, index) => {
        const li = document.createElement("li");
        li.className = `habit-item ${habit.completed ? 'completed' : ''}`;

        li.innerHTML = `
          <div class="habit-check ${habit.completed ? 'completed' : ''}" data-index="${index}">
            ${habit.completed ? '<i class="fas fa-check"></i>' : ''}
          </div>
          <span class="habit-name">${habit.name}</span>
          <span class="habit-streak">${habit.streak} day streak</span>
          <div class="habit-actions">
            <button class="habit-delete" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;

        habitsListEl.appendChild(li);
      });

      document.querySelectorAll('.habit-check').forEach(checkbox => {
        checkbox.addEventListener('click', () => {
          const index = checkbox.dataset.index;
          toggleHabit(index);
        });
      });

      document.querySelectorAll('.habit-delete').forEach(button => {
        button.addEventListener('click', () => {
          const index = button.dataset.index;
          deleteHabit(index);
        });
      });
    }

    function toggleHabit(index) {
      habits[index].completed = !habits[index].completed;

      if (habits[index].completed) {
        habits[index].streak += 1;
      } else {
        habits[index].streak = Math.max(0, habits[index].streak - 1);
      }

      saveHabits();
      renderHabits();
    }

    function deleteHabit(index) {
      if (confirm("Are you sure you want to delete this habit?")) {
        habits.splice(index, 1);
        saveHabits();
        renderHabits();
      }
    }

    function updateStats() {
      const totalHabits = habits.length;
      const completedHabits = habits.filter(habit => habit.completed).length;
      const completionRate = totalHabits > 0
        ? Math.round((completedHabits / totalHabits) * 100)
        : 0;

      completionRateEl.textContent = `${completionRate}%`;
      habitsCompletedEl.textContent = `${completedHabits}/${totalHabits}`;
    }

    habitForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = habitNameInput.value.trim();

      if (name) {
        habits.push({
          name,
          completed: false,
          streak: 0,
          created: new Date().toISOString()
        });

        saveHabits();
        renderHabits();
        habitNameInput.value = "";
      }
    });

    renderHabits();
    updateStats();
  }

  function setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    const clearDataBtn = document.getElementById('clearDataBtn');

    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('active');
      settingsOverlay.classList.add('active');
    });

    function closeSettings() {
      settingsModal.classList.remove('active');
      settingsOverlay.classList.remove('active');

      const existingMessage = settingsModal.querySelector('#importStatusMessage');
      if (existingMessage) {
        existingMessage.remove();
      }
    }

    closeSettingsBtn.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', closeSettings);

    exportDataBtn.addEventListener('click', () => {
      const exportData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          exportData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          exportData[key] = localStorage.getItem(key);
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const dateStr = new Date().toISOString().split('T')[0];

      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(dataBlob);
      downloadLink.download = `dashboard-backup-${dateStr}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });

    clearDataBtn.addEventListener('click', () => {
      if (confirm("WARNING: This will permanently delete ALL your dashboard data. This action cannot be undone. Are you sure?")) {
        if (confirm("Are you absolutely sure? All your tasks, habits, and settings will be erased.")) {
          localStorage.clear();

          showImportStatus("All data has been cleared. Refreshing page...", false);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    });

    importDataBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);

          if (!isValidBackupData(importedData)) {
            showImportStatus('Invalid backup file format. Please use a valid dashboard backup file.', false);
            return;
          }

          Object.keys(importedData).forEach(key => {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          });

          showImportStatus('Data successfully imported! Refreshing page...', true);

          setTimeout(() => {
            window.location.reload();
          }, 1500);

        } catch (error) {
          showImportStatus(`Error importing data: ${error.message}`, false);
        }
      };

      reader.readAsText(file);

      importFileInput.value = '';
    });

    function isValidBackupData(data) {
      const expectedKeys = ['todos', 'birthday', 'habits', 'pomodoro'];

      return expectedKeys.some(key => key in data);
    }

    function showImportStatus(message, isSuccess) {
      const existingMessage = settingsModal.querySelector('#importStatusMessage');
      if (existingMessage) {
        existingMessage.remove();
      }

      const statusEl = document.createElement('div');
      statusEl.id = 'importStatusMessage';
      statusEl.className = isSuccess ? 'success' : 'error';
      statusEl.textContent = message;

      const importOption = document.querySelector('.settings-option:nth-child(2)');
      importOption.appendChild(statusEl);
    }
  }
});
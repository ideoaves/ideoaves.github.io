document.addEventListener("DOMContentLoaded", () => {
    let startTime = null;
    let timerInterval = null;
    const timeDisplay = document.getElementById("time");
    const startButton = document.getElementById("startB");
    const resetButton = document.getElementById("resetB");
    const submitButton = document.getElementById("submit");
    const deleteButton = document.getElementById("delete");
    const scheduleForm = document.getElementById("schedule");
    const scheduleList = document.getElementById("schedule-list");
    const alarmAudio = document.getElementById("alarm");
    const JSTTimeDiv = document.getElementById("JST-time");
    let tasks = [];
    const storedStartTime = localStorage.getItem("startTime");
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

    if (storedStartTime) {
        startTime = parseInt(storedStartTime, 10);
        const formattedTime = new Date(startTime).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        JSTTimeDiv.textContent = `起床時間 (JST): ${formattedTime}`;
        startTimer();
    }
    if (storedTasks.length > 0) {
        tasks = storedTasks;
        updateTaskTable();
    }

    startButton.addEventListener("click", () => {
        if (!startTime) {
            startTime = Date.now();
            localStorage.setItem("startTime", startTime);
            const formattedTime = new Date(startTime).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
            JSTTimeDiv.textContent = `起床時間 (JST): ${formattedTime}`;
        }
        startTimer();
    });

    resetButton.addEventListener("click", () => {
        startTime = null;
        clearInterval(timerInterval);
        timeDisplay.textContent = "00:00:00";
        JSTTimeDiv.textContent = "起床時間 (JST): 未設定";
        tasks = [];
        updateTaskTable();
        localStorage.removeItem("startTime");
        localStorage.removeItem("tasks");
    });

    deleteButton.addEventListener("click", () => {
        tasks = [];
        updateTaskTable();
        localStorage.removeItem('tasks');
    });

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            timeDisplay.textContent = formatTime(elapsedSeconds);
            updateTaskTable();
        }, 1000);
    }

    function formatTime(seconds) {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }

    scheduleForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const timeInput = document.getElementById("time-input").value;
        const taskInput = document.getElementById("task-input").value;
        const isRelative = document.getElementById("relative-time-checkbox").checked;

        const taskTime = isRelative
            ? startTime + parseTimeToSeconds(timeInput) * 1000
            : parseAbsoluteTimeToTimestamp(timeInput);

        const task = {
            time: timeInput,
            description: taskInput,
            relative: isRelative,
            targetTime: taskTime,
            triggered: false,
        };

        tasks.push(task);
        saveTasksToLocalStorage();
        updateTaskTable();
    });

    function updateTaskTable() {
        scheduleList.innerHTML = "";
        const now = Date.now();
        tasks.forEach((task) => {
            const remaining = calculateRemainingTime(task.targetTime, now);
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${task.time}${task.relative ? "(WST)" : "(JST)"}</td>
                <td>${task.description}</td>
                <td>${task.triggered ? "Done" : remaining}</td>
            `;
            scheduleList.appendChild(row);
        });
    }

    function saveTasksToLocalStorage() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function playAlarmAndNotify(description) {
        alarmAudio.play(); // 音声要らない場合は削除！
        const notification = document.getElementById('alert');
        if (notification) {
            notification.innerHTML = `${description}のお時間です！<button onclick="closeNotification()">OK</button>`;
            notification.style.display = 'block';
        }
    }

    setInterval(() => {
        const currentTime = Date.now();
        tasks.forEach((task) => {
            if (!task.triggered && currentTime >= task.targetTime) {
                task.triggered = true;
                playAlarmAndNotify(task.description);
                saveTasksToLocalStorage();
                updateTaskTable();
            }
        });
    }, 1000);

    function calculateRemainingTime(targetTime, currentTime) {
        const diff = targetTime - currentTime;
        if (diff <= 0) return "00:00:00";
        return formatTime(Math.floor(diff / 1000));
    }

    function parseTimeToSeconds(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 3600 + minutes * 60;
    }

    function parseAbsoluteTimeToTimestamp(time) {
        const now = new Date();
        const [hours, minutes] = time.split(":").map(Number);
        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hours,
            minutes,
            0
        ).getTime();
    }
});

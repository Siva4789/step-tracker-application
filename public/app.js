document.addEventListener('DOMContentLoaded', () => {
    const todayStepsEl = document.getElementById('today-steps');
    const statusEl = document.getElementById('sensor-status');
    const permissionBtn = document.getElementById('permission-btn');
    const simulateBtn = document.getElementById('simulate-btn');
    const historyListEl = document.getElementById('history-list');

    let todaySteps = 0;
    const todayDate = new Date().toISOString().split('T')[0];

    // Fetch existing data
    async function fetchSteps() {
        try {
            const response = await fetch('/api/steps');
            const data = await response.json();
            
            historyListEl.innerHTML = '';
            let foundToday = false;

            data.forEach(item => {
                if (item.date === todayDate) {
                    todaySteps = item.count;
                    todayStepsEl.textContent = todaySteps;
                    foundToday = true;
                }
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.date}</span><strong>${item.count} steps</strong>`;
                historyListEl.appendChild(li);
            });

            if (!foundToday) {
                todaySteps = 0;
                todayStepsEl.textContent = todaySteps;
            }
        } catch (err) {
            console.error('Error fetching steps:', err);
        }
    }

    // Save steps to backend
    async function saveSteps() {
        try {
            await fetch('/api/steps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: todayDate, count: todaySteps })
            });
            fetchSteps();
        } catch (err) {
            console.error('Error saving steps:', err);
        }
    }

    function addStep() {
        todaySteps++;
        todayStepsEl.textContent = todaySteps;
        saveSteps();
    }

    // Device Motion step detection variables
    let lastAcceleration = { x: 0, y: 0, z: 0 };
    let threshold = 12; // acceleration threshold for step
    let lastStepTime = 0;

    function handleMotion(event) {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        const deltaX = Math.abs(acc.x - lastAcceleration.x);
        const deltaY = Math.abs(acc.y - lastAcceleration.y);
        const deltaZ = Math.abs(acc.z - lastAcceleration.z);

        const movement = deltaX + deltaY + deltaZ;
        const currentTime = new Date().getTime();

        if (movement > threshold && (currentTime - lastStepTime > 350)) {
            addStep();
            lastStepTime = currentTime;
        }

        lastAcceleration = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };
    }

    // Request Permission for Motion Sensors
    async function initSensors() {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const response = await DeviceMotionEvent.requestPermission();
                if (response === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    statusEl.textContent = 'Auto tracking active via device sensors';
                    statusEl.className = 'status-badge active';
                    permissionBtn.style.display = 'none';
                } else {
                    statusEl.textContent = 'Permission denied for sensors';
                }
            } catch (err) {
                console.error(err);
                statusEl.textContent = 'Error requesting sensor permission';
            }
        } else if (typeof DeviceMotionEvent !== 'undefined') {
            window.addEventListener('devicemotion', handleMotion);
            statusEl.textContent = 'Auto tracking active via device sensors';
            statusEl.className = 'status-badge active';
            permissionBtn.style.display = 'none';
        } else {
            statusEl.textContent = 'Device motion not supported on this browser';
        }
    }

    permissionBtn.addEventListener('click', initSensors);
    simulateBtn.addEventListener('click', addStep);

    // Initial fetch
    fetchSteps();
});

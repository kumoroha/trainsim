let canvas = document.getElementById('train-simulation');
let ctx = canvas.getContext('2d');
canvas.width = 1150; // Change canvas width to 1150px
canvas.height = 300;

let routes = {
    "osaka_shin_osaka": { distance: 3800, time: 180, maxAccelerationPerSec: 2.5, maxDecelerationPerSec: -4.6, ebDecelerationPerSec: -5.2 },
    "shinagawa_takanawa": { distance: 900, time: 120, maxAccelerationPerSec: 3.0, maxDecelerationPerSec: -3.2, ebDecelerationPerSec: -4.2 },
    "test_200m": { distance: 200, time: 60, maxAccelerationPerSec: 2.5, maxDecelerationPerSec: -4.6, ebDecelerationPerSec: -5.2 },
}

let selectedRoute = "osaka_shin_osaka";

let remainingTime = routes[selectedRoute].time; // 3 minutes in seconds
let remainingDistance = routes[selectedRoute].distance; // in meters
let speed = 0; // km/h
let notch = 0; // Notch position
let trainX = 0; // Train position
let trainSpeed = 0; // Train speed in pixels per frame
let paused = false;

const updateParameters = () => {
    const route = routes[selectedRoute];
    remainingTime = route.time;
    remainingDistance = route.distance;
    maxAccelerationPerSec = route.maxAccelerationPerSec;
    maxDecelerationPerSec = route.maxDecelerationPerSec;
    ebDecelerationPerSec = route.ebDecelerationPerSec;
    pixelsPerMeter = (stoppingLineX - 100) / remainingDistance;
};

let maxAccelerationPerSec = routes[selectedRoute].maxAccelerationPerSec; // Maximum acceleration in km/h per second
let maxDecelerationPerSec = routes[selectedRoute].maxDecelerationPerSec; // Maximum deceleration in km/h per second for B8
let ebDecelerationPerSec = routes[selectedRoute].ebDecelerationPerSec; // Emergency brake deceleration in km/h per second
const updateInterval = 100; // Update interval in milliseconds
const stoppingLineX = canvas.width - 20; // Position of the stopping line (20px from the right edge)
const homeStartX = 0; // Home start position (start of the canvas)
let pixelsPerMeter = (stoppingLineX - 100) / remainingDistance; // Pixels per meter based on the canvas width and total distance

const updateDashboard = () => {
    const timeDisplay = document.getElementById('remaining-time');
    timeDisplay.innerText = Math.floor(remainingTime);
    document.getElementById('remaining-distance').innerText = remainingDistance.toFixed(0) + ' m';
    document.getElementById('speed').innerText = speed.toFixed(1) + ' km/h';
    document.getElementById('notch').innerText = getNotchDisplay(notch);
};

const getNotchDisplay = (notch) => {
    if (notch > 0) {
        return `P${notch}`;
    } else if (notch < 0) {
        return notch === -9 ? 'EB' : `B${Math.abs(notch)}`;
    } else {
        return 'N';
    }
};

const updateTrainPosition = () => {
    let acceleration = 0;
    if (notch === -9) {
        acceleration = ebDecelerationPerSec; // Emergency brake
    } else if (notch < 0) {
        acceleration = maxDecelerationPerSec * (Math.abs(notch) / 8); // Adjust deceleration
    } else if (notch > 0) {
        acceleration = maxAccelerationPerSec * (notch / 5); // Adjust acceleration
    }

    // Update speed with acceleration
    speed += acceleration * (updateInterval / 1000);
    if (speed < 0) speed = 0;

    // Convert speed from km/h to pixels/frame
    trainSpeed = (speed / 3.6) * (updateInterval / 1000) * pixelsPerMeter;
    trainX += trainSpeed;
    remainingDistance -= (speed * (1000 / 3600)) * (updateInterval / 1000); // Convert speed from km/h to meters per second and adjust for interval
    if (remainingDistance < 0) remainingDistance = 0;

    // Check if the train reaches the stopping zone
    if (trainX >= stoppingLineX - 10 && trainX <= stoppingLineX + 10) {
        displayResult('合格');
    } else if (trainX > stoppingLineX + 10) {
        displayResult('不合格');
    }
};

const drawTrain = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stopping zone
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(stoppingLineX - 10, 0, 20, canvas.height);

    // Draw stopping line
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(stoppingLineX, 0);
    ctx.lineTo(stoppingLineX, canvas.height);
    ctx.stroke();

    // Draw train if it is within the home
    if (trainX >= homeStartX && trainX <= stoppingLineX) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(trainX, canvas.height / 2 - 15, 100, 30);
    }
};

const displayResult = (result) => {
    paused = true;
    const timeDisplay = document.getElementById('remaining-time');
    if (remainingTime >= 0) {
        timeDisplay.style.color = 'lightgreen';
    } else {
        timeDisplay.style.color = 'red';
    }
    document.getElementById('result').innerText = result;
    document.getElementById('result').style.display = 'block';
    document.getElementById('retry').style.display = 'block';
};

const resetGame = () => {
    updateParameters();
    speed = 0;
    notch = 0;
    trainX = 0;
    paused = false;
    document.getElementById('result').style.display = 'none';
    document.getElementById('retry').style.display = 'none';
    updateDashboard();
    drawTrain();
};

const update = () => {
    if (!paused) {
        updateTrainPosition();
        drawTrain();
        updateDashboard();
        remainingTime -= updateInterval / 1000; // Decrement remaining time
        if (remainingTime < 0) remainingTime = 0;
        if (trainX >= canvas.width - 100) {
            speed = 0; // Stop train at the end
            paused = true;
            if (remainingDistance <= 0) {
                if (trainX >= stoppingLineX - 10 && trainX <= stoppingLineX + 10) {
                    displayResult('合格');
                } else {
                    displayResult('不合格');
                }
            }
        }
    }
    setTimeout(update, updateInterval);
};

document.getElementById('notch-up').addEventListener('click', () => {
    if (notch < 5) notch++;
});

document.getElementById('notch-down').addEventListener('click', () => {
    if (notch > -9) notch--;
});

document.getElementById('pause').addEventListener('click', () => {
    paused = true;
});

document.getElementById('resume').addEventListener('click', () => {
    paused = false;
});

document.getElementById('retry').addEventListener('click', resetGame);

document.getElementById('route').addEventListener('change', (event) => {
    selectedRoute = event.target.value;
    resetGame();
});

update();

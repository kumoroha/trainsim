let canvas = document.getElementById('train-simulation');
let ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 300;

let remainingTime = 120; // 2 minutes in seconds
let remainingDistance = 7.7; // in km
let speed = 0; // km/h
let targetSpeed = 0; // km/h
let notch = 0; // Notch position
let trainX = 0; // Train position
let trainSpeed = 0; // Train speed in pixels per frame
let paused = false;
let inStation = false;
let trainEntered = false;
let scaleFactor = 1; // Scale factor for train when it enters the station

const maxAccelerationPerSec = 2.5; // Maximum acceleration in km/h per second
const maxDecelerationPerSec = -4.6; // Maximum deceleration in km/h per second for B8
const ebDecelerationPerSec = -5.2; // Emergency brake deceleration in km/h per second
const updateInterval = 100; // Update interval in milliseconds
const stoppingLineX = canvas.width - 20; // Position of the stopping line (20px from the right edge)
const stoppingZoneStart = stoppingLineX - 10; // Start of the stopping zone
const stoppingZoneEnd = stoppingLineX + 10; // End of the stopping zone
const pixelsPerKm = canvas.width / 7.7; // Pixels per km based on the canvas width and total distance

const updateDashboard = () => {
    document.getElementById('remaining-time').innerText = Math.floor(remainingTime);
    document.getElementById('remaining-distance').innerText = remainingDistance.toFixed(1) + ' km';
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
    trainSpeed = (speed / 3.6) * (updateInterval / 1000) * pixelsPerKm;
    trainX += trainSpeed;
    remainingDistance -= speed / 3600 * (updateInterval / 1000); // Convert km/h to km/frame
    if (remainingDistance < 0) remainingDistance = 0;

    // Check if the train reaches the stopping zone
    if (trainX >= stoppingZoneStart && trainX <= stoppingZoneEnd) {
        displayResult('合格');
    } else if (trainX > stoppingZoneEnd) {
        displayResult('不合格');
    }
};

const drawTrain = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stopping zone
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(stoppingZoneStart, 0, 20, canvas.height);

    // Draw stopping line
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(stoppingLineX, 0);
    ctx.lineTo(stoppingLineX, canvas.height);
    ctx.stroke();

    ctx.fillStyle = 'blue';
    ctx.fillRect(trainX, canvas.height / 2 - 15, 100, 30);
};

const displayResult = (result) => {
    paused = true;
    document.getElementById('result').innerText = result;
    document.getElementById('result').style.display = 'block';
    document.getElementById('retry').style.display = 'block';
};

const resetGame = () => {
    remainingTime = 120;
    remainingDistance = 7.7;
    speed = 0;
    notch = 0;
    trainX = 0;
    paused = false;
    inStation = false;
    trainEntered = false;
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
        if (trainX >= canvas.width - 100) speed = 0; // Stop train at the end
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

update();

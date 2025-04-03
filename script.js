let canvas = document.getElementById('train-simulation');
let ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 300;

let remainingTime = 120; // 2 minutes in seconds
let remainingDistance = 5.0; // in km
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
const stationLineX = canvas.width - 20; // Position of the station entry line (20px from the right edge)

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
    trainSpeed = speed / 3.6 * (updateInterval / 1000);
    trainX += trainSpeed;
    remainingDistance -= speed / 3600 * (updateInterval / 1000); // Convert km/h to km/frame
    if (remainingDistance < 0) remainingDistance = 0;

    // Check if the train enters the station
    if (!trainEntered && trainX >= stationLineX) {
        trainEntered = true;
        inStation = true;
        canvas.width *= 2; // Double the canvas width to simulate zooming in
        trainX = 0; // Move train to the left edge
        speed /= 2; // Adjust speed for the new scale
    }

    if (trainEntered && trainX >= (canvas.width - 100)) {
        trainX = canvas.width - 100;
    }
};

const drawTrain = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw station entry line
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(stationLineX, 0);
    ctx.lineTo(stationLineX, canvas.height);
    ctx.stroke();

    ctx.fillStyle = 'blue';
    if (inStation) {
        ctx.fillRect(trainX, canvas.height / 2 - 15 * scaleFactor, 100 * scaleFactor, 30 * scaleFactor);
        // Draw stopping line
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(canvas.width - 100, canvas.height / 2 - 30);
        ctx.lineTo(canvas.width - 100, canvas.height / 2 + 30);
        ctx.stroke();
    } else {
        ctx.fillRect(trainX, canvas.height / 2 - 15, 100, 30);
    }
};

const displayEntryMessage = () => {
    if (trainEntered) {
        if (!document.getElementById('entry-message')) {
            const entryMessage = document.createElement('div');
            entryMessage.id = 'entry-message';
            entryMessage.innerText = 'ホームに入線しました';
            document.body.appendChild(entryMessage);
        }
    }
};

const update = () => {
    if (!paused) {
        updateTrainPosition();
        drawTrain();
        updateDashboard();
        displayEntryMessage();
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

update();

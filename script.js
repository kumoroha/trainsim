let canvas = document.getElementById('train-simulation');
let ctx = canvas.getContext('2d');
canvas.width = 1150; // Change canvas width to 1150px
canvas.height = 300;

let remainingTime = 120; // 2 minutes in seconds
let remainingDistance = 7700; // in meters
let speed = 0; // km/h
let notch = 0; // Notch position
let trainX = 0; // Train position
let trainSpeed = 0; // Train speed in pixels per frame
let paused = false;

const maxAccelerationPerSec = 2.5; // Maximum acceleration in km/h per second
const maxDecelerationPerSec = -4.6; // Maximum deceleration in km/h per second for B8
const ebDecelerationPerSec = -5.2; // Emergency brake deceleration in km/h per second
const updateInterval = 100; // Update interval in milliseconds
const stoppingLineX = canvas.width - 20; // Position of the stopping line (20px from the right edge)
const homeStartX = stoppingLineX - 250; // Home start position (250m before stopping line)
const pixelsPerMeter = (stoppingLineX - 100) / 7700; // Pixels per meter based on the canvas width and total distance

const updateDashboard = () => {
    document.getElementById('remaining-time').innerText = Math.floor(remainingTime);
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
    remainingDistance -= (speed / 3.6) * (updateInterval / 1000) * 1000; // Convert km/h to meters/frame
    if (remainingDistance < 0) remainingDistance = 0;

    // Check if the train reaches the stopping zone
    if (trainX >= stoppingLineX) {
        if (trainX <= stoppingLineX) {
            remainingDistance = 0.0;
            displayResult('合格');
        } else if (trainX > stoppingLineX) {
            remainingDistance = 0.0;
            displayResult('不合格');
        }
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

    // Draw home start line
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(homeStartX, 0);
    ctx.lineTo(homeStartX, canvas.height);
    ctx.stroke();

    // Draw train if it is within the home
    if (trainX >= homeStartX && trainX <= stoppingLineX) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(trainX, canvas.height / 2 - 15, 100, 30);
    }
};

const displayResult = (result) => {
    paused = true;
    document.getElementById('result').innerText = result;
    document.getElementById('result').style.display = 'block';
    document.getElementById('retry').style.display = 'block';
};

const resetGame = () => {
    remainingTime = 120;
    remainingDistance = 7700;
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

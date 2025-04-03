let canvas = document.getElementById('train-simulation');
let ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 300;

let remainingTime = 120; // 2 minutes in seconds
let remainingDistance = 5.0; // in km
let speed = 0; // km/h
let targetSpeed = 0; // km/h
let notch = 0; // Notch position
let brake = 0; // Brake level (0-8 for regular brakes, 9 for emergency brake)
let trainX = 0; // Train position
let trainSpeed = 0; // Train speed in pixels per frame
let paused = false;
let inStation = false;

const maxAcceleration = 0.2; // Maximum acceleration in km/h per update
const maxDeceleration = -0.3; // Maximum deceleration in km/h per update
const updateInterval = 100; // Update interval in milliseconds

const updateDashboard = () => {
    document.getElementById('remaining-time').innerText = Math.floor(remainingTime);
    document.getElementById('remaining-distance').innerText = remainingDistance.toFixed(1) + ' km';
    document.getElementById('speed').innerText = speed.toFixed(1) + ' km/h';
    document.getElementById('notch').innerText = `N${notch} B${brake}`;
};

const updateTrainPosition = () => {
    let acceleration = 0;
    if (brake === 9) {
        acceleration = maxDeceleration * 2; // Emergency brake
    } else if (brake > 0) {
        acceleration = maxDeceleration * (brake / 8);
    } else if (targetSpeed > speed) {
        acceleration = maxAcceleration;
    } else if (targetSpeed < speed) {
        acceleration = maxDeceleration;
    }

    // Update speed with acceleration
    speed += acceleration * (updateInterval / 1000);
    if (speed < 0) speed = 0;
    if (speed > targetSpeed && acceleration > 0) speed = targetSpeed;
    if (speed < targetSpeed && acceleration < 0) speed = targetSpeed;

    // Convert speed from km/h to pixels/frame
    trainSpeed = speed / 3.6 * (updateInterval / 1000);
    trainX += trainSpeed;
    remainingDistance -= speed / 3600 * (updateInterval / 1000); // Convert km/h to km/frame
    if (remainingDistance < 0) remainingDistance = 0;
    if (trainX >= canvas.width - 100) {
        trainX = canvas.width - 100;
        inStation = true;
    }
};

const drawTrain = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(trainX, canvas.height / 2 - 15, inStation ? 200 : 100, 30);
    if (inStation) {
        // Draw stopping line
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(canvas.width - 100, canvas.height / 2 - 30);
        ctx.lineTo(canvas.width - 100, canvas.height / 2 + 30);
        ctx.stroke();
    }
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
    if (brake > 0) brake = 0; // Reset brake when accelerating
    targetSpeed += 1; // Increase target speed by 1 km/h
});

document.getElementById('notch-down').addEventListener('click', () => {
    if (notch > 0) notch--;
    targetSpeed -= 1; // Decrease target speed by 1 km/h
});

document.getElementById('brake').addEventListener('click', () => {
    if (brake < 9) brake++;
    if (notch > 0) notch = 0; // Reset notch when braking
    targetSpeed = Math.max(targetSpeed - 1, 0); // Decrease target speed by 1 km/h or set to 0
});

document.getElementById('pause').addEventListener('click', () => {
    paused = true;
});

document.getElementById('resume').addEventListener('click', () => {
    paused = false;
});

update();

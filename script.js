let canvas = document.getElementById('train-simulation');
let ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 200;

let remainingTime = 120; // 2 minutes in seconds
let remainingDistance = 5.0; // in km
let speed = 0; // km/h
let notch = 0; // Notch position
let trainX = 0; // Train position
let trainSpeed = 0; // Train speed in pixels per frame
let paused = false;
let inStation = false;

const updateDashboard = () => {
    document.getElementById('remaining-time').innerText = `${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')}`;
    document.getElementById('remaining-distance').innerText = remainingDistance.toFixed(1) + ' km';
    document.getElementById('speed').innerText = speed + ' km/h';
    document.getElementById('notch').innerText = notch;
};

const updateTrainPosition = () => {
    trainSpeed = speed / 3.6 * 0.1; // Convert km/h to pixels/frame
    trainX += trainSpeed;
    remainingDistance -= speed / 36000; // Convert km/h to km/frame
    if (remainingDistance < 0) remainingDistance = 0;
    if (trainX >= canvas.width - 50) {
        trainX = canvas.width - 50;
        inStation = true;
    }
};

const drawTrain = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(trainX, canvas.height / 2 - 10, inStation ? 100 : 50, 20);
    if (inStation) {
        // Draw stopping line
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(canvas.width - 50, canvas.height / 2 - 20);
        ctx.lineTo(canvas.width - 50, canvas.height / 2 + 20);
        ctx.stroke();
    }
};

const update = () => {
    if (!paused) {
        updateTrainPosition();
        drawTrain();
        updateDashboard();
        remainingTime -= 0.1; // Decrement remaining time
        if (remainingTime < 0) remainingTime = 0;
        if (trainX >= canvas.width - 50) speed = 0; // Stop train at the end
    }
    requestAnimationFrame(update);
};

document.getElementById('notch-up').addEventListener('click', () => {
    if (notch < 5) notch++;
    speed = notch * 20; // Example speed increment
});

document.getElementById('notch-down').addEventListener('click', () => {
    if (notch > 0) notch--;
    speed = notch * 20; // Example speed decrement
});

document.getElementById('brake').addEventListener('click', () => {
    speed = 0;
    notch = 0;
});

document.getElementById('pause').addEventListener('click', () => {
    paused = true;
});

document.getElementById('resume').addEventListener('click', () => {
    paused = false;
});

update();

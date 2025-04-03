let remainingTime = 120; // 2 minutes in seconds
let remainingDistance = 5.0; // in km
let speed = 0; // km/h
let notch = 0; // Notch position

const updateDashboard = () => {
    document.getElementById('remaining-time').innerText = `${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')}`;
    document.getElementById('remaining-distance').innerText = remainingDistance.toFixed(1) + ' km';
    document.getElementById('speed').innerText = speed + ' km/h';
    document.getElementById('notch').innerText = notch;
};

// Three.js setup
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(800, 600);
document.getElementById('3d-container').appendChild(renderer.domElement);

let geometry = new THREE.BoxGeometry(1, 1, 3);
let material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
let train = new THREE.Mesh(geometry, material);
scene.add(train);

camera.position.z = 5;

const animate = () => {
    requestAnimationFrame(animate);
    train.position.z -= speed / 3600; // Move train forward based on speed
    renderer.render(scene, camera);
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

animate();
updateDashboard();
setInterval(() => {
    remainingTime -= 1;
    if (remainingTime < 0) remainingTime = 0;
    remainingDistance -= speed / 3600; // Update remaining distance
    if (remainingDistance < 0) remainingDistance = 0;
    updateDashboard();
}, 1000);

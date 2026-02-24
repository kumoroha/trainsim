const PARAMS = { 
    accel_unit: 0.028, 
    brake_unit: 0.44,  
    eb_power: 0.195,   
    friction: 0.003, 
    refresh_ms: 50 
};

// 実際のJRダイヤに基づく所要時間（大阪発車を0秒とする）
const STATIONS = [
    { name: "大阪", dist: 0, arrivalSec: 0 },
    { name: "西九条", dist: 3800, arrivalSec: 360 },       // 約6分
    { name: "安治川口", dist: 5400, arrivalSec: 570 },     // 約9分30秒
    { name: "ユニバーサルシティ", dist: 6600, arrivalSec: 690 }, // 約11分30秒
    { name: "桜島", dist: 7800, arrivalSec: 810 }         // 約13分30秒
];

let speed = 0, currentPos = 0, notch = -5, isPaused = false, nextStationIdx = 1, hasStopped = false, isStationProcess = false;
let startTime = null;
let elapsedTime = 0;

// 運行時間の更新
function updateClock() {
    if (isPaused || isStationProcess) return;
    if (startTime === null && speed > 0) startTime = Date.now(); // 初回発車時に計測開始
    
    if (startTime !== null) {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
        const s = String(elapsedTime % 60).padStart(2, '0');
        document.getElementById('clock').innerText = `${m}:${s}`;
    }
}
setInterval(updateClock, 1000);

function resetGame() {
    if (confirm("最初からやり直しますか？")) {
        location.reload();
    }
}
function toggleTheme() { document.body.classList.toggle('light-mode'); }
function togglePause() { 
    isPaused = !isPaused; 
    document.getElementById('pause-btn').innerText = isPaused ? 'Resume' : 'Pause';
    document.body.classList.toggle('is-paused', isPaused);
}

function changeNotch(val) { 
    if (isPaused || isStationProcess) return; 
    if (val > 0) { 
        if (notch === -9) {
            let cLim = parseInt(document.getElementById('limit').innerText) || 95;
            if (Math.floor(speed) <= cLim) notch = -8;
        } else { notch += val; }
    } else { 
        notch += val;
        if (notch < -9) notch = -9;
    }
    if (notch > 5) notch = 5;
    updateUI(); 
}

function handleEB() {
    if (isPaused || isStationProcess) return;
    if (notch === -9) {
        let cLim = parseInt(document.getElementById('limit').innerText) || 95;
        if (Math.floor(speed) <= cLim) notch = 0;
    } else { notch = -9; }
    updateUI();
}

function updateUI() {
    const bar = document.getElementById('notch-bar'), txt = document.getElementById('notch-text'), ebBtn = document.getElementById('eb-btn');
    if (notch === -9) {
        bar.style.width = "100%"; bar.style.backgroundColor = "var(--eb-color)"; 
        txt.innerText = "EB"; txt.style.color = "var(--eb-color)"; ebBtn.classList.add('eb-on');
    } else {
        ebBtn.classList.remove('eb-on');
        if (notch > 0) { 
            bar.style.width = (notch/5)*100+"%"; bar.style.backgroundColor = "var(--accel-color)"; 
            txt.innerText = "P"+notch; txt.style.color = "var(--accel-color)"; 
        } else if (notch < 0) { 
            bar.style.width = (Math.abs(notch)/8)*100+"%"; bar.style.backgroundColor = "var(--brake-color)"; 
            txt.innerText = "B"+Math.abs(notch); txt.style.color = "var(--brake-color)"; 
        } else { 
            bar.style.width = "0%"; txt.innerText = "N"; txt.style.color = "var(--text-color)"; 
        }
    }
}

setInterval(() => {
    if (isPaused || isStationProcess) return;

    if (notch > 0) {
        speed += notch * PARAMS.accel_unit;
    } else if (notch < 0) {
        let decel = (notch === -9) ? PARAMS.eb_power : (Math.abs(notch) * (PARAMS.brake_unit / 8));
        speed -= decel;
    }
    speed -= PARAMS.friction;

    if (speed < 0.1) {
        if (speed > 0 && !hasStopped) { 
            hasStopped = true;
            let dToGoal = Math.abs(STATIONS[nextStationIdx].dist - currentPos);
            if (dToGoal <= 50) {
                processArrival();
            }
        }
        speed = 0;
    } else if (speed >= 0.5) {
        hasStopped = false;
    }
    
    currentPos += (speed / 3.6) * (PARAMS.refresh_ms / 1000);
    let nextS = STATIONS[nextStationIdx], dNext = nextS.dist - currentPos;
    
    let cLimit = 95;
    let nLimit = "--";
    let nLimDist = "--";

    if (dNext < 300) { cLimit = 25; nLimit = "終了"; nLimDist = "停車"; }
    else if (dNext < 800) { cLimit = 45; nLimit = "25"; nLimDist = Math.floor(dNext - 300); }
    else { cLimit = 95; nLimit = "45"; nLimDist = Math.floor(dNext - 800); }

    document.getElementById('speed').innerText = Math.floor(speed);
    document.getElementById('limit').innerText = cLimit;
    document.getElementById('next-limit-val').innerText = nLimit + (nLimit === "終了" ? "" : "km/h");
    document.getElementById('next-limit-dist').innerText = nLimDist;
    document.getElementById('next-name').innerText = nextS.name;

    const distEl = document.getElementById('distance');
    if (Math.abs(dNext) <= 5) { distEl.innerText = (dNext * 100).toFixed(1) + " cm"; distEl.style.color = "#fff"; }
    else { distEl.innerText = Math.floor(dNext) + " m"; distEl.style.color = ""; }

    if (Math.floor(speed) > cLimit && notch !== -9) { notch = -9; updateUI(); }
}, PARAMS.refresh_ms);

function processArrival() {
    isStationProcess = true;
    let stopDistDiff = Math.abs(STATIONS[nextStationIdx].dist - currentPos) * 100;
    
    // 時間差の計算
    let targetSec = STATIONS[nextStationIdx].arrivalSec;
    let timeDiff = elapsedTime - targetSec;
    let timeResult = "";
    if (timeDiff === 0) timeResult = "定時";
    else if (timeDiff > 0) timeResult = `${timeDiff}秒 延着`;
    else if (timeDiff < 0) timeResult = `${Math.abs(timeDiff)}秒 早着`;

    let resultText = "";
    if (stopDistDiff < 15) resultText = "EXCELLENT";
    else if (stopDistDiff < 40) resultText = "GREAT";
    else if (stopDistDiff < 150) resultText = "GOOD";
    else resultText = "BAD";

    setTimeout(() => {
        alert(
            `【停車判定】\n` +
            `結果: ${resultText}\n` +
            `誤差: ${(stopDistDiff/100).toFixed(2)}m\n\n` +
            `【ダイヤ判定】\n` +
            `結果: ${timeResult}`
        );
        
        if (nextStationIdx < STATIONS.length - 1) {
            nextStationIdx++;
            notch = -5;
            updateUI();
            isStationProcess = false;
            hasStopped = false;
        } else {
            alert("終点 桜島に到着しました。定時運行へのご協力ありがとうございました！");
        }
    }, 2000);
}
updateUI();

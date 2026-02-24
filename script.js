const PARAMS = { 
    accel_unit: 0.028, // P5で約2.5km/h/s
    brake_unit: 0.44,  // B8で約3.5km/h/s
    eb_power: 0.195,   
    friction: 0.003, 
    refresh_ms: 50 
};

const STATIONS = [
    { name: "大阪", dist: 0, arrivalSec: 0 },
    { name: "西九条", dist: 3800, arrivalSec: 360 },
    { name: "安治川口", dist: 5400, arrivalSec: 570 },
    { name: "ユニバーサルシティ", dist: 6600, arrivalSec: 690 },
    { name: "桜島", dist: 7800, arrivalSec: 810 }
];

let speed = 0, currentPos = 0, notch = -5, isPaused = false, nextStationIdx = 1, hasStopped = false, isStationProcess = false;
let startTime = null, elapsedTime = 0, pauseStartTime = null, totalPausedMs = 0;

function updateClock() {
    if (isPaused || isStationProcess) return;
    if (startTime === null && speed > 0) startTime = Date.now();
    if (startTime !== null) {
        elapsedTime = Math.floor((Date.now() - startTime - totalPausedMs) / 1000);
        let targetSec = STATIONS[nextStationIdx].arrivalSec;
        let remain = targetSec - elapsedTime;
        const clockEl = document.getElementById('clock');
        if (remain > 100) {
            clockEl.innerText = `あと${Math.floor(remain / 60)}分${remain % 60}秒`;
            clockEl.style.color = "var(--accel-color)";
        } else if (remain >= 0) {
            clockEl.innerText = `あと${remain}秒`;
            clockEl.style.color = "#ffaa00";
        } else {
            clockEl.innerText = `${Math.abs(remain)}秒 遅れ`;
            clockEl.style.color = "#ff0000";
        }
    }
}
setInterval(updateClock, 500);

function togglePause() { 
    isPaused = !isPaused; 
    const btn = document.getElementById('pause-btn');
    if (isPaused) { btn.innerText = 'Resume'; pauseStartTime = Date.now(); }
    else { btn.innerText = 'Pause'; if (pauseStartTime) totalPausedMs += (Date.now() - pauseStartTime); }
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
        notch += val; if (notch < -9) notch = -9;
    }
    if (notch > 5) notch = 5;
    updateUI(); 
}

function handleEB() {
    if (isPaused || isStationProcess) return;
    notch = (notch === -9) ? 0 : -9;
    updateUI();
}

function updateUI() {
    const bar = document.getElementById('notch-bar'), txt = document.getElementById('notch-text'), ebBtn = document.getElementById('eb-btn');
    if (notch > 0) {
        bar.style.width = (notch / 5) * 100 + "%";
        bar.style.backgroundColor = "var(--accel-color)";
        txt.innerText = "P" + notch;
        txt.style.color = "var(--accel-color)";
    } else if (notch < 0) {
        let absN = Math.abs(notch);
        bar.style.width = (absN / 9) * 100 + "%";
        if (notch === -9) {
            bar.style.backgroundColor = "var(--eb-color)";
            txt.innerText = "EB";
            txt.style.color = "var(--eb-color)";
            ebBtn.classList.add('eb-on');
        } else {
            bar.style.backgroundColor = "var(--brake-color)";
            txt.innerText = "B" + absN;
            txt.style.color = "var(--brake-color)";
            ebBtn.classList.remove('eb-on');
        }
    } else {
        bar.style.width = "0%";
        txt.innerText = "N";
        txt.style.color = "var(--text-color)";
        ebBtn.classList.remove('eb-on');
    }
}

// 信号ロジック (dNext: 次の駅までの距離)
function updateSignal(dNext) {
    const r = document.getElementById('lamp-r'), y = document.getElementById('lamp-y'), g = document.getElementById('lamp-g'), name = document.getElementById('signal-name');
    r.classList.remove('red'); y.classList.remove('yellow'); g.classList.remove('green');
    
    if (dNext < 400) { 
        r.classList.add('red'); name.innerText = "場内 (停止)"; 
    } else if (dNext < 800) { 
        y.classList.add('yellow'); name.innerText = "第1閉塞 (注意)"; 
    } else if (dNext < 1500) { 
        y.classList.add('yellow'); g.classList.add('green'); name.innerText = "第2閉塞 (減速)"; 
    } else { 
        g.classList.add('green'); name.innerText = "第3閉塞 (進行)"; 
    }
}

setInterval(() => {
    if (isPaused || isStationProcess) return;
    
    // 加減速処理
    if (notch > 0) speed += notch * PARAMS.accel_unit;
    else if (notch < 0) {
        let decel = (notch === -9) ? PARAMS.eb_power : (Math.abs(notch) * (PARAMS.brake_unit / 8));
        speed -= decel;
    }
    speed -= PARAMS.friction;
    
    if (speed < 0.1) {
        if (speed > 0 && !hasStopped) {
            hasStopped = true;
            if (Math.abs(STATIONS[nextStationIdx].dist - currentPos) <= 50) processArrival();
        }
        speed = 0;
    } else if (speed >= 0.5) { hasStopped = false; }
    
    currentPos += (speed / 3.6) * (PARAMS.refresh_ms / 1000);
    let dNext = STATIONS[nextStationIdx].dist - currentPos;
    
    updateSignal(dNext);

    let cLimit = (dNext < 300) ? 25 : (dNext < 800) ? 45 : 95;
    document.getElementById('speed').innerText = Math.floor(speed);
    document.getElementById('limit').innerText = cLimit;
    document.getElementById('next-limit-dist').innerText = (dNext < 300) ? "停車" : (dNext < 800) ? Math.floor(dNext - 300) : Math.floor(dNext - 800);
    document.getElementById('next-name').innerText = STATIONS[nextStationIdx].name;
    document.getElementById('distance').innerText = dNext < 5 ? (dNext * 100).toFixed(1) + " cm" : Math.floor(dNext) + " m";
    
    if (Math.floor(speed) > cLimit && notch !== -9) { notch = -9; updateUI(); }
}, PARAMS.refresh_ms);

function processArrival() {
    isStationProcess = true;
    let diff = Math.abs(STATIONS[nextStationIdx].dist - currentPos) * 100;
    let tDiff = elapsedTime - STATIONS[nextStationIdx].arrivalSec;
    alert(`【停車判定】\n誤差: ${(diff/100).toFixed(2)}m\nダイヤ: ${tDiff === 0 ? "定時" : tDiff > 0 ? tDiff+"秒延着" : Math.abs(tDiff)+"秒早着"}`);
    if (nextStationIdx < STATIONS.length - 1) { 
        nextStationIdx++; 
        isStationProcess = false; 
        notch = -5; 
        updateUI(); 
    }
}
function resetGame() { if (confirm("リセットしますか？")) location.reload(); }
updateUI();

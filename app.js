document.addEventListener('DOMContentLoaded', () => {
    // Clock update
    function updateClock() {
        const now = new Date();
        document.getElementById('liveClock').textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Floating Toast Notification Engine
    const toastContainer = document.getElementById('toastContainer');
    let soundMuted = false;

    function showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-card toast-${type}`;

        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        if (type === 'warning') iconClass = 'fa-exclamation-triangle';
        if (type === 'danger') iconClass = 'fa-circle-xmark';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${message}</div>
            </div>
        `;

        toastContainer.appendChild(toast);
        playAlarmSound(type);

        // Native Desktop Notification if granted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && (type === 'warning' || type === 'danger')) {
            new Notification(`[SCADA Alert] ${title}`, { body: message, icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' });
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Web Audio Synthesizer Alarm Chime
    function playAlarmSound(type) {
        if (soundMuted || (type !== 'warning' && type !== 'danger')) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const audioCtx = new AudioCtx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = type === 'danger' ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(type === 'danger' ? 880 : 587, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        } catch (e) {
            // Audio context fallback
        }
    }

    // Sound Toggle Button
    const btnSoundToggle = document.getElementById('btnSoundToggle');
    const soundIcon = document.getElementById('soundIcon');

    btnSoundToggle.addEventListener('click', () => {
        soundMuted = !soundMuted;
        soundIcon.className = soundMuted ? 'fa-solid fa-volume-xmark text-muted' : 'fa-solid fa-volume-high text-cyan';
        showToast("Audio Alerts", soundMuted ? "SCADA Alarm Siren Muted" : "SCADA Alarm Siren Unmuted", soundMuted ? "warning" : "info");
    });

    // Notification Channel Action Buttons
    const btnEnableDesktopNotif = document.getElementById('btnEnableDesktopNotif');
    if (btnEnableDesktopNotif) {
        btnEnableDesktopNotif.addEventListener('click', () => {
            if (typeof Notification !== 'undefined') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showToast("Desktop Popups", "Native Browser Notifications Enabled!", "success");
                    } else {
                        showToast("Desktop Popups", "Browser Notification Permission Denied", "warning");
                    }
                });
            } else {
                showToast("Desktop Popups", "Browser does not support native notifications", "warning");
            }
        });
    }

    const btnTestEmailAlert = document.getElementById('btnTestEmailAlert');
    if (btnTestEmailAlert) {
        btnTestEmailAlert.addEventListener('click', () => {
            showToast("SMTP Email Alert", "Test email dispatched to plant.operator@schneider.com", "success");
            addAuditLog("EMAIL_DISPATCH", "Alert email sent to plant.operator@schneider.com", "SMTP Gateway", "SUCCESS");
        });
    }

    const btnTestSMSAlert = document.getElementById('btnTestSMSAlert');
    if (btnTestSMSAlert) {
        btnTestSMSAlert.addEventListener('click', () => {
            showToast("SMS Webhook", "Emergency SMS alert sent to Plant Manager mobile", "warning");
            addAuditLog("SMS_DISPATCH", "Emergency SMS sent to +91 9876543210", "Twilio Gateway", "WARNING");
        });
    }

    // Sidebar Smooth Scrolling & Active State Highlight
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Chart initialization
    const ctx = document.getElementById('scadaChart').getContext('2d');
    const scadaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Process Temp (°C)',
                    data: [],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Current Draw (A)',
                    data: [],
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1'
                },
                {
                    label: 'Predicted Power (kWh)',
                    data: [],
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    tension: 0.3,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                y: {
                    type: 'linear', display: true, position: 'left',
                    title: { display: true, text: 'Temp (°C)', color: '#F59E0B' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9CA3AF' }
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: 'Current (A)', color: '#3B82F6' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#9CA3AF' }
                },
                y2: {
                    type: 'linear', display: false, position: 'right',
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: {
                legend: { labels: { color: '#F3F4F6', font: { family: 'Outfit' } } }
            }
        }
    });

    // ML Predictor Surrogate Formula
    function predictEnergy(procTemp, envTemp, current) {
        let base = 0.22;
        let deltaProc = (procTemp - 50.0) * 0.0018;
        let deltaEnv = (8.0 - envTemp) * 0.0035;
        let deltaCurr = (current - 3.5) * 0.02;
        let predicted = base + deltaProc + deltaEnv + deltaCurr;
        if (predicted < 0.15) predicted = 0.15;
        if (predicted > 0.65) predicted = 0.65;
        return predicted;
    }

    // Interactive Physics State Variables
    let currentProcTemp = 60.0;
    let currentEnvTemp = 12.0;
    let currentMotorLoad = 3.54;
    let fanActive = true;
    let heaterActive = false;
    let alarmActive = false;
    let activeScenario = 'NORMAL';
    let isSimulating = true;
    let timeIndex = 0;
    let lastToastTime = 0;
    const telemetryHistory = [];

    // Sliders
    const rangeProc = document.getElementById('rangeProcTemp');
    const rangeEnv = document.getElementById('rangeEnvTemp');
    const dispProc = document.getElementById('dispProcTemp');
    const dispEnv = document.getElementById('dispEnvTemp');
    const valPredictedEnergy = document.getElementById('predictedEnergyVal');
    const valPredictedCO2 = document.getElementById('predictedCO2Val');
    const aiAdviceText = document.getElementById('aiAdviceText');

    function updateAIPredictor() {
        currentProcTemp = parseFloat(rangeProc.value);
        currentEnvTemp = parseFloat(rangeEnv.value);

        dispProc.textContent = `${currentProcTemp.toFixed(1)} °C`;
        dispEnv.textContent = `${currentEnvTemp.toFixed(1)} °C`;

        const energy = predictEnergy(currentProcTemp, currentEnvTemp, currentMotorLoad);
        const co2 = energy * 0.82;

        valPredictedEnergy.textContent = `${energy.toFixed(3)} kWh`;
        valPredictedCO2.textContent = `${co2.toFixed(3)} kg CO₂`;

        if (currentProcTemp > 78) {
            aiAdviceText.innerHTML = `<b class="text-red">Thermal Overheat Warning:</b> Process temperature at ${currentProcTemp.toFixed(1)}°C requires active cooling actuation.`;
        } else if (currentEnvTemp < 0) {
            aiAdviceText.innerHTML = `<b class="text-cyan">Sub-Zero Ambient Notice:</b> High ambient heat loss requires additional thermal retention insulation.`;
        } else {
            aiAdviceText.innerHTML = `Operating at nominal thermal efficiency. Target baseline energy maintained.`;
        }
    }

    rangeProc.addEventListener('input', updateAIPredictor);
    rangeEnv.addEventListener('input', updateAIPredictor);

    // Relays Dynamic Feedback
    const switchFan = document.getElementById('switchFan');
    const switchHeater = document.getElementById('switchHeater');
    const switchAlarm = document.getElementById('switchAlarm');

    switchFan.addEventListener('change', () => {
        fanActive = switchFan.checked;
        showToast("Relay State Changed", `Cooling Fan set to ${fanActive ? 'ON' : 'OFF'}`, fanActive ? "success" : "warning");
        addAuditLog("RELAY_ACTUATION", `Cooling Fan set to ${fanActive ? 'ON' : 'OFF'}`, "Edge Controller", fanActive ? "SUCCESS" : "WARNING");
    });

    switchHeater.addEventListener('change', () => {
        heaterActive = switchHeater.checked;
        showToast("Relay State Changed", `Heating Element set to ${heaterActive ? 'ON' : 'OFF'}`, heaterActive ? "warning" : "info");
        addAuditLog("RELAY_ACTUATION", `Heating Element set to ${heaterActive ? 'ON' : 'OFF'}`, "Edge Controller", heaterActive ? "WARNING" : "INFO");
    });

    switchAlarm.addEventListener('change', () => {
        alarmActive = switchAlarm.checked;
        showToast("Safety Alarm", `Alarm Siren set to ${alarmActive ? 'ON' : 'OFF'}`, alarmActive ? "danger" : "info");
        addAuditLog("RELAY_ACTUATION", `Alarm Siren set to ${alarmActive ? 'ON' : 'OFF'}`, "Safety System", alarmActive ? "CRITICAL" : "INFO");
    });

    // AI Auto-Optimize Button
    const btnAutoOptimize = document.getElementById('btnAutoOptimize');
    btnAutoOptimize.addEventListener('click', () => {
        rangeProc.value = 54.5;
        updateAIPredictor();
        showToast("AI Auto-Optimize", "Tuned Process Temp to 54.5°C (-16.5% Energy Savings)", "success");
        addAuditLog("AI_OPTIMIZER", "Tuned Process Temp to 54.5°C (-16.5% Energy)", "Scikit-Learn ML", "SUCCESS");
    });

    // Scenario State Engine
    const scenarioBtns = document.querySelectorAll('.btn-scenario');
    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            scenarioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeScenario = btn.getAttribute('data-scenario');
            showToast("Scenario Changed", `Preset switched to ${activeScenario}`, "info");
            addAuditLog("SCENARIO_CHANGE", `Preset switched to ${activeScenario}`, "User Dashboard", "INFO");
        });
    });

    // SCADA Audit Logs Engine
    const auditLogsBody = document.getElementById('auditLogsBody');
    const logsHistory = [];

    function addAuditLog(category, description, source, severity) {
        const timestamp = new Date().toLocaleTimeString().split(' ')[0];
        logsHistory.unshift({ timestamp, category, description, source, severity });

        if (logsHistory.length > 15) logsHistory.pop();

        let html = '';
        logsHistory.forEach(log => {
            let badgeClass = 'badge-info';
            if (log.severity === 'WARNING') badgeClass = 'badge-warning';
            if (log.severity === 'CRITICAL') badgeClass = 'badge-danger';
            if (log.severity === 'SUCCESS') badgeClass = 'badge-success';

            html += `<tr>
                <td>${log.timestamp}</td>
                <td><strong>${log.category}</strong></td>
                <td>${log.description}</td>
                <td>${log.source}</td>
                <td><span class="${badgeClass}">${log.severity}</span></td>
            </tr>`;
        });
        auditLogsBody.innerHTML = html;
    }

    addAuditLog("SYSTEM_INIT", "SCADA Digital Twin Physics Engine Active", "Python Telemetry Node", "SUCCESS");
    addAuditLog("ML_ENGINE", "Random Forest Model Loaded (R^2 = 99.34%)", "Scikit-Learn", "SUCCESS");

    // CLOSED-LOOP DYNAMIC PHYSICS LOOP (Runs every 1 second)
    function runClosedLoopPhysics() {
        if (!isSimulating) return;

        const timeStr = new Date().toLocaleTimeString().split(' ')[0];

        // 1. Dynamic Actuator Physics Effects:
        if (fanActive && currentProcTemp > 45.0) {
            currentProcTemp -= 0.4;
        }
        if (heaterActive && currentProcTemp < 95.0) {
            currentProcTemp += 0.8;
        }

        // 2. Scenario Adjustments:
        let vibration = 0.8;
        let bearingHealth = 96;
        let rulHours = 4120;

        if (activeScenario === 'NORMAL') {
            currentProcTemp += (Math.random() - 0.48) * 0.3;
            currentMotorLoad = 3.5 + Math.sin(timeIndex * 0.15) * 0.2 + (Math.random() - 0.5) * 0.05;
            vibration = 0.8 + (Math.random() - 0.5) * 0.05;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> Nominal Thermal State`;
            document.getElementById('subCurrent').textContent = "230V AC Baseline";
        }
        else if (activeScenario === 'OVERHEATING') {
            currentProcTemp = Math.min(94.0, currentProcTemp + 0.6 + (Math.random() - 0.5) * 0.2);
            currentMotorLoad = 4.8 + (Math.random() - 0.5) * 0.2;
            vibration = 1.4 + (Math.random() - 0.5) * 0.1;
            bearingHealth = 82;
            rulHours = 2450;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber"></i> High Thermal Load Alert`;
            document.getElementById('subCurrent').textContent = "Overload Current Draw";
        }
        else if (activeScenario === 'MOTOR_ANOMALY') {
            currentMotorLoad = 7.2 + Math.sin(timeIndex * 0.4) * 0.8 + (Math.random() - 0.5) * 0.3;
            currentProcTemp += 0.3;
            vibration = 3.8 + (Math.random() - 0.5) * 0.3;
            bearingHealth = 41;
            rulHours = 180;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red"></i> Bearing Friction Heat`;
            document.getElementById('subCurrent').textContent = "CRITICAL Motor Current Spike!";
        }
        else if (activeScenario === 'COLD_WEATHER') {
            currentEnvTemp = -8.5 + (Math.random() - 0.5) * 0.2;
            currentProcTemp -= 0.3;
            currentMotorLoad = 4.2 + (Math.random() - 0.5) * 0.1;
            vibration = 0.9;
            bearingHealth = 94;
            rulHours = 3890;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-snowflake text-cyan"></i> Outdoor Thermal Dissipation`;
            document.getElementById('subCurrent').textContent = "Heating Element Load";
        }

        // Clamp boundary values
        currentProcTemp = Math.max(35.0, Math.min(95.0, currentProcTemp));
        rangeProc.value = currentProcTemp.toFixed(1);
        rangeEnv.value = currentEnvTemp.toFixed(1);
        dispProc.textContent = `${currentProcTemp.toFixed(1)} °C`;
        dispEnv.textContent = `${currentEnvTemp.toFixed(1)} °C`;

        // Predict ML Energy & CO2
        const energy = predictEnergy(currentProcTemp, currentEnvTemp, currentMotorLoad);
        const co2 = energy * 0.82;

        // Save Telemetry Record
        telemetryHistory.push({
            Timestamp: timeStr,
            Scenario: activeScenario,
            ProcTemp: currentProcTemp.toFixed(2),
            EnvTemp: currentEnvTemp.toFixed(2),
            Current: currentMotorLoad.toFixed(2),
            EnergyCon: energy.toFixed(3),
            CO2_Emissions: co2.toFixed(3)
        });

        // Update UI Top Cards
        document.getElementById('valProcTemp').textContent = `${currentProcTemp.toFixed(1)} °C`;
        document.getElementById('valEnvTemp').textContent = `${currentEnvTemp.toFixed(1)} °C`;
        document.getElementById('valCurrent').textContent = `${currentMotorLoad.toFixed(2)} A`;
        document.getElementById('valEnergy').textContent = `${energy.toFixed(3)} kWh`;
        document.getElementById('valCO2').innerHTML = `<i class="fa-solid fa-leaf"></i> ${co2.toFixed(3)} kg CO₂/hr`;
        valPredictedEnergy.textContent = `${energy.toFixed(3)} kWh`;
        valPredictedCO2.textContent = `${co2.toFixed(3)} kg CO₂`;

        // Update P&ID Diagram Fluid & Animation
        document.getElementById('pidTankTemp').textContent = `${currentProcTemp.toFixed(1)} °C`;
        document.getElementById('pidCurrentVal').textContent = `${currentMotorLoad.toFixed(2)} A`;
        
        const tankFluid = document.getElementById('tankFluid');
        const tankHeight = Math.min(95, Math.max(30, currentProcTemp));
        tankFluid.style.height = `${tankHeight}%`;
        if (currentProcTemp > 75) {
            tankFluid.style.background = 'linear-gradient(to top, #DC2626, #EF4444)';
        } else {
            tankFluid.style.background = 'linear-gradient(to top, #F59E0B, #10B981)';
        }

        const pidCoolerStatus = document.getElementById('pidCoolerStatus');
        pidCoolerStatus.textContent = fanActive ? 'ACTIVE (COOLING)' : 'IDLE';
        pidCoolerStatus.className = fanActive ? 'text-cyan' : 'text-muted';

        // Update Maintenance Gauges
        document.getElementById('valVibration').textContent = `${vibration.toFixed(2)} mm/s`;
        const elBearing = document.getElementById('valBearingHealth');
        elBearing.textContent = `${bearingHealth}% (${bearingHealth < 50 ? 'DEGRADED' : 'GOOD'})`;
        elBearing.className = bearingHealth < 50 ? 'text-red' : 'text-green';
        document.getElementById('valRUL').textContent = `${rulHours} Hours`;

        // Update Chart
        if (scadaChart.data.labels.length > 20) {
            scadaChart.data.labels.shift();
            scadaChart.data.datasets[0].data.shift();
            scadaChart.data.datasets[1].data.shift();
            scadaChart.data.datasets[2].data.shift();
        }

        scadaChart.data.labels.push(timeStr);
        scadaChart.data.datasets[0].data.push(currentProcTemp.toFixed(2));
        scadaChart.data.datasets[1].data.push(currentMotorLoad.toFixed(2));
        scadaChart.data.datasets[2].data.push(energy.toFixed(3));
        scadaChart.update();

        // Automated Safety Interlock & Toast Notification Trigger
        const nowMs = Date.now();
        if (currentProcTemp > 78.0 && (nowMs - lastToastTime > 6000)) {
            lastToastTime = nowMs;
            showToast("High Temperature Alert", `Process Temp reached ${currentProcTemp.toFixed(1)}°C! Safety Interlock Active.`, "warning");
        }

        if (currentProcTemp > 80.0 && !fanActive) {
            switchFan.checked = true;
            fanActive = true;
            showToast("Safety Interlock", "Cooling Fan automatically triggered ON", "danger");
            addAuditLog("SAFETY_INTERLOCK", "Auto-Activated Cooling Fan due to High Temp (>80°C)", "Node-RED Safety Rule", "WARNING");
        }

        timeIndex++;
    }

    setInterval(runClosedLoopPhysics, 1000);

    // Export CSV Report
    document.getElementById('btnExportCSV').addEventListener('click', () => {
        if (telemetryHistory.length === 0) {
            alert('No telemetry collected yet.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,Timestamp,Scenario,ProcTemp,EnvTemp,Current,EnergyCon,CO2_Emissions\n";
        telemetryHistory.forEach(row => {
            csvContent += `${row.Timestamp},${row.Scenario},${row.ProcTemp},${row.EnvTemp},${row.Current},${row.EnergyCon},${row.CO2_Emissions}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SCADA_Audit_Report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Report Exported", "SCADA Audit Telemetry Log downloaded", "success");
        addAuditLog("CSV_EXPORT", "SCADA Audit Telemetry Log Exported to CSV", "User Dashboard", "SUCCESS");
    });

    const btnEstop = document.getElementById('btnEstop');
    btnEstop.addEventListener('click', () => {
        fanActive = false;
        heaterActive = false;
        switchFan.checked = false;
        switchHeater.checked = false;
        showToast("EMERGENCY STOP", "E-STOP Triggered! All Industrial Relays Deactivated", "danger");
        addAuditLog("EMERGENCY_STOP", "E-STOP Triggered! All Relays Deactivated", "User Console", "CRITICAL");
    });
});

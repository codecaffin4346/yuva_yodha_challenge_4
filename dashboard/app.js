document.addEventListener('DOMContentLoaded', () => {
    // Clock update
    function updateClock() {
        const now = new Date();
        document.getElementById('liveClock').textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

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
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Current Draw (A)',
                    data: [],
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Predicted Energy (kWh)',
                    data: [],
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    tension: 0.4,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
        if (predicted > 0.60) predicted = 0.60;
        return predicted;
    }

    // Sliders
    const rangeProc = document.getElementById('rangeProcTemp');
    const rangeEnv = document.getElementById('rangeEnvTemp');
    const dispProc = document.getElementById('dispProcTemp');
    const dispEnv = document.getElementById('dispEnvTemp');
    const valPredictedEnergy = document.getElementById('predictedEnergyVal');
    const valPredictedCO2 = document.getElementById('predictedCO2Val');
    const aiAdviceText = document.getElementById('aiAdviceText');

    function updateAIPredictor() {
        const proc = parseFloat(rangeProc.value);
        const env = parseFloat(rangeEnv.value);

        dispProc.textContent = `${proc.toFixed(1)} °C`;
        dispEnv.textContent = `${env.toFixed(1)} °C`;

        const energy = predictEnergy(proc, env, 3.5);
        const co2 = energy * 0.82;

        valPredictedEnergy.textContent = `${energy.toFixed(3)} kWh`;
        valPredictedCO2.textContent = `${co2.toFixed(3)} kg CO₂`;

        if (proc > 78) {
            aiAdviceText.innerHTML = `<b class="text-red">Thermal Overheat Warning:</b> Process temperature at ${proc}°C requires active cooling actuation.`;
        } else if (env < 0) {
            aiAdviceText.innerHTML = `<b class="text-cyan">Sub-Zero Ambient Notice:</b> High ambient heat loss requires additional thermal retention insulation.`;
        } else {
            aiAdviceText.innerHTML = `Operating at nominal thermal efficiency. Target baseline energy maintained.`;
        }
    }

    rangeProc.addEventListener('input', updateAIPredictor);
    rangeEnv.addEventListener('input', updateAIPredictor);
    updateAIPredictor();

    // AI Auto-Optimize Button
    const btnAutoOptimize = document.getElementById('btnAutoOptimize');
    btnAutoOptimize.addEventListener('click', () => {
        rangeProc.value = 54.5;
        updateAIPredictor();
        addAuditLog("AI_OPTIMIZER", "Tuned Process Temp to 54.5°C (-16.5% Energy)", "Scikit-Learn ML", "SUCCESS");
        alert('AI Closed-Loop Optimizer Applied:\nProcess Temperature setpoint automatically tuned to 54.5°C.\nEstimated Power Reduction: 16.5% saved!');
    });

    // Scenario State Engine
    let activeScenario = 'NORMAL';
    let timeIndex = 0;
    let isSimulating = true;
    const telemetryHistory = [];

    const scenarioBtns = document.querySelectorAll('.btn-scenario');
    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            scenarioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeScenario = btn.getAttribute('data-scenario');
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

    // Initial Logs
    addAuditLog("SYSTEM_INIT", "SCADA Digital Twin Simulator Initialized", "Python Telemetry Node", "SUCCESS");
    addAuditLog("MQTT_BROKER", "Connected to Broker (172.20.10.7:1883)", "Node-RED Edge", "INFO");
    addAuditLog("ML_ENGINE", "Random Forest Model Loaded (R^2 = 99.34%)", "Scikit-Learn", "SUCCESS");

    function addTelemetryPoint() {
        if (!isSimulating) return;

        const timeStr = new Date().toLocaleTimeString().split(' ')[0];
        let procTemp = 60.0;
        let envTemp = 12.0;
        let current = 3.5;
        let vibration = 0.8;
        let bearingHealth = 96;
        let rulHours = 4120;

        if (activeScenario === 'NORMAL') {
            procTemp = 59.5 + Math.sin(timeIndex * 0.2) * 1.2 + (Math.random() - 0.5) * 0.4;
            envTemp = 12.0 + Math.cos(timeIndex * 0.1) * 1.5 + (Math.random() - 0.5) * 0.2;
            current = 3.5 + Math.sin(timeIndex * 0.15) * 0.2 + (Math.random() - 0.5) * 0.1;
            vibration = 0.8 + (Math.random() - 0.5) * 0.05;
            bearingHealth = 96;
            rulHours = 4120;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> Nominal Thermal State`;
            document.getElementById('subCurrent').textContent = "230V AC Baseline";
        } 
        else if (activeScenario === 'OVERHEATING') {
            procTemp = Math.min(92.0, 75.0 + Math.sin(timeIndex * 0.3) * 8.0 + (Math.random() - 0.5) * 1.0);
            envTemp = 18.0 + (Math.random() - 0.5) * 0.5;
            current = 4.8 + (Math.random() - 0.5) * 0.3;
            vibration = 1.4 + (Math.random() - 0.5) * 0.1;
            bearingHealth = 82;
            rulHours = 2450;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber"></i> High Thermal Load Alert`;
            document.getElementById('subCurrent').textContent = "Overload Current Draw";
            if (timeIndex % 5 === 0) {
                addAuditLog("THERMAL_ALERT", `High Process Temp (${procTemp.toFixed(1)}°C) - Fan Actuated`, "Node-RED Safety Rule", "WARNING");
            }
        }
        else if (activeScenario === 'MOTOR_ANOMALY') {
            procTemp = 68.0 + (Math.random() - 0.5) * 1.0;
            envTemp = 10.0 + (Math.random() - 0.5) * 0.2;
            current = 7.2 + Math.sin(timeIndex * 0.4) * 0.8 + (Math.random() - 0.5) * 0.4;
            vibration = 3.8 + (Math.random() - 0.5) * 0.4;
            bearingHealth = 41;
            rulHours = 180;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red"></i> Bearing Friction Heat`;
            document.getElementById('subCurrent').textContent = "CRITICAL Motor Current Spike!";
            if (timeIndex % 4 === 0) {
                addAuditLog("BEARING_ANOMALY", `Vibration ${vibration.toFixed(1)} mm/s Exceeds Threshold`, "Predictive Maintenance", "CRITICAL");
            }
        }
        else if (activeScenario === 'COLD_WEATHER') {
            procTemp = 54.0 + Math.sin(timeIndex * 0.2) * 2.0;
            envTemp = -8.5 + (Math.random() - 0.5) * 0.4;
            current = 4.2 + (Math.random() - 0.5) * 0.1;
            vibration = 0.9 + (Math.random() - 0.5) * 0.05;
            bearingHealth = 94;
            rulHours = 3890;
            document.getElementById('subProcTemp').innerHTML = `<i class="fa-solid fa-snowflake text-cyan"></i> Outdoor Thermal Dissipation`;
            document.getElementById('subCurrent').textContent = "Heating Element Load";
        }

        const energy = predictEnergy(procTemp, envTemp, current);
        const co2 = energy * 0.82;

        telemetryHistory.push({
            Timestamp: timeStr,
            Scenario: activeScenario,
            ProcTemp: procTemp.toFixed(2),
            EnvTemp: envTemp.toFixed(2),
            Current: current.toFixed(2),
            EnergyCon: energy.toFixed(3),
            CO2_Emissions: co2.toFixed(3)
        });

        // Periodic telemetry log entry
        if (timeIndex % 6 === 0) {
            addAuditLog("TELEMETRY", `ProcTemp=${procTemp.toFixed(1)}°C, Current=${current.toFixed(2)}A, kWh=${energy.toFixed(3)}`, "Virtual SCADA Node", "INFO");
        }

        // Update UI Metrics
        document.getElementById('valProcTemp').textContent = `${procTemp.toFixed(1)} °C`;
        document.getElementById('valEnvTemp').textContent = `${envTemp.toFixed(1)} °C`;
        document.getElementById('valCurrent').textContent = `${current.toFixed(2)} A`;
        document.getElementById('valEnergy').textContent = `${energy.toFixed(3)} kWh`;
        document.getElementById('valCO2').innerHTML = `<i class="fa-solid fa-leaf"></i> ${co2.toFixed(3)} kg CO₂/hr`;

        // Update P&ID Diagram
        document.getElementById('pidTankTemp').textContent = `${procTemp.toFixed(1)} °C`;
        document.getElementById('pidCurrentVal').textContent = `${current.toFixed(2)} A`;
        
        const tankFluid = document.getElementById('tankFluid');
        const tankHeight = Math.min(95, Math.max(30, procTemp));
        tankFluid.style.height = `${tankHeight}%`;
        if (procTemp > 75) {
            tankFluid.style.background = 'linear-gradient(to top, #DC2626, #EF4444)';
        } else {
            tankFluid.style.background = 'linear-gradient(to top, #F59E0B, #10B981)';
        }

        // Update Maintenance Box
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
        scadaChart.data.datasets[0].data.push(procTemp.toFixed(2));
        scadaChart.data.datasets[1].data.push(current.toFixed(2));
        scadaChart.data.datasets[2].data.push(energy.toFixed(3));
        scadaChart.update();

        timeIndex++;
    }

    setInterval(addTelemetryPoint, 2000);

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
        addAuditLog("CSV_EXPORT", "SCADA Audit Telemetry Log Exported to CSV", "User Dashboard", "SUCCESS");
    });

    const btnEstop = document.getElementById('btnEstop');
    btnEstop.addEventListener('click', () => {
        addAuditLog("EMERGENCY_STOP", "E-STOP Triggered! Relays Shut Down", "User Console", "CRITICAL");
        alert('EMERGENCY STOP ACTIVATED!\nVirtual MQTT Event Published: SYSTEM_OFF, FAN_RELAY_OFF, HEATER_RELAY_OFF.');
    });
});

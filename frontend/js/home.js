window.PQEPage = window.PQEPage || {};

(function () {
  let statusInterval = null;
  let lastBytes = null;
  let lastTime = null;
  let currentEntropyHex = '';
  let activeFormat = 'hex';

  // Format conversion helpers
  function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
      bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return new Uint8Array(bytes);
  }

  function bytesToBinary(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(2).padStart(8, '0'))
      .join(' ');
  }

  function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function bytesToBigInt(bytes) {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    try {
      return BigInt('0x' + hex).toString(10);
    } catch (e) {
      return '0';
    }
  }

  function formatEntropy(hex, format) {
    if (!hex) return '';
    const bytes = hexToBytes(hex);
    switch (format) {
      case 'bin':
        return bytesToBinary(bytes);
      case 'b64':
        return bytesToBase64(bytes);
      case 'int':
        return bytesToBigInt(bytes);
      case 'hex':
      default:
        return hex;
    }
  }

  function renderOutputBox(hex, format) {
    const outputBox = document.querySelector('[data-output-box]');
    if (!outputBox) return;

    if (!hex) {
      outputBox.innerHTML = '<span class="placeholder-text">Awaiting entropy pull...</span>';
      return;
    }

    const formatted = formatEntropy(hex, format);
    outputBox.textContent = formatted;
  }

  // Pipeline step updater
  const pipelineSteps = ['photodiode', 'differential', 'lsb', 'whitening', 'pool', 'conditioning'];

  function resetPipeline() {
    pipelineSteps.forEach((stepName) => {
      const stepEl = document.querySelector(`[data-pipeline-step="${stepName}"]`);
      if (stepEl) {
        stepEl.classList.remove('active', 'complete', 'error');
        const stateEl = stepEl.querySelector('[data-step-state]');
        if (stateEl) stateEl.textContent = 'STANDBY';
      }
    });

    const statusEl = document.querySelector('[data-pipeline-status]');
    if (statusEl) statusEl.textContent = 'Awaiting generation request';

    const counterEl = document.querySelector('[data-pipeline-counter]');
    if (counterEl) counterEl.textContent = '0 / 6';
  }

  function setPipelineStep(stepName, state, detail) {
    const stepEl = document.querySelector(`[data-pipeline-step="${stepName}"]`);
    if (!stepEl) return;

    stepEl.classList.remove('active', 'complete', 'error');
    stepEl.classList.add(state);

    const stateEl = stepEl.querySelector('[data-step-state]');
    if (stateEl) {
      stateEl.textContent = state.toUpperCase();
    }

    if (detail) {
      const detailEl = stepEl.querySelector('[data-step-detail]');
      if (detailEl) detailEl.textContent = detail;
    }

    const completedCount = document.querySelectorAll('.pipeline-step.complete').length;
    const activeCount = document.querySelectorAll('.pipeline-step.active').length;
    const counterEl = document.querySelector('[data-pipeline-counter]');
    if (counterEl) {
      counterEl.textContent = `${completedCount + activeCount} / 6`;
    }
  }

  window.PQEPage.home = async function () {
    const statusOutput = document.getElementById('status-output');
    if (!statusOutput) return;

    // Status polling routine
    const updateStatus = async () => {
      try {
        const result = await window.PQEApi.getStatus();
        const entropy = result?.entropy || {};
        const server = result?.server || {};

        // Update metric values
        const metricStatus = document.getElementById('metric-status');
        if (metricStatus) metricStatus.textContent = result?.status || 'Online';

        const metricHardware = document.getElementById('metric-hardware');
        if (metricHardware) {
          const hwAvail = Boolean(entropy.hardware_available);
          metricHardware.textContent = hwAvail ? 'Connected' : 'Unavailable';
          metricHardware.className = hwAvail ? 'metric-value highlight-green' : 'metric-value highlight-yellow';
        }

        const metricSource = document.getElementById('metric-source');
        if (metricSource) {
          metricSource.textContent = entropy.source || (entropy.source_type === 'hardware' ? 'ESP32 Hardware' : 'OpenSSL Fallback');
          metricSource.className = entropy.source_type === 'hardware' ? 'metric-value highlight-green' : 'metric-value highlight-yellow';
        }

        const metricPool = document.getElementById('metric-pool');
        if (metricPool) {
          metricPool.textContent = `${entropy.pool_size ?? 0} bytes`;
        }

        const currentBytes = entropy.total_generated || 0;
        let speedStr = 'Calculating...';

        if (entropy.speed !== undefined && entropy.speed > 0) {
          const speedKB = entropy.speed / 1024;
          speedStr = `${speedKB.toFixed(1)} KB/s`;
        } else {
          const currentTime = Date.now();
          if (lastBytes !== null && lastTime !== null) {
            const timeDiffSec = (currentTime - lastTime) / 1000;
            if (timeDiffSec > 0) {
              const bytesDiff = currentBytes - lastBytes;
              const speedKB = (bytesDiff / timeDiffSec) / 1024;
              speedStr = `${speedKB.toFixed(1)} KB/s`;
            }
          }
          lastBytes = currentBytes;
          lastTime = currentTime;
        }

        const metricSpeed = document.getElementById('metric-speed');
        if (metricSpeed) metricSpeed.textContent = speedStr;

        // Status Panel Tone & Text
        const statusPanel = document.querySelector('[data-status-panel]');
        if (statusPanel) {
          const indicator = statusPanel.querySelector('.status-indicator');
          const title = statusPanel.querySelector('[data-status-title]');
          const text = statusPanel.querySelector('[data-status-text]');

          if (entropy.hardware_available) {
            indicator.dataset.tone = 'success';
            title.textContent = 'Hardware Connected';
            text.textContent = `Dual-photodiode ADC shot noise streaming via ${entropy.source || 'Serial'}.`;
          } else {
            indicator.dataset.tone = 'warning';
            title.textContent = 'Software Fallback Active';
            text.textContent = 'ESP32 not detected. Cryptographic OpenSSL RAND_bytes source active.';
          }
        }

        // Side metrics
        const statTotal = document.getElementById('stat-total-pulled');
        if (statTotal) statTotal.textContent = `${(currentBytes / 1024).toFixed(1)} KB`;

        const statUptime = document.getElementById('stat-uptime');
        if (statUptime && server.uptime_seconds !== undefined) {
          const mins = Math.floor(server.uptime_seconds / 60);
          const secs = server.uptime_seconds % 60;
          statUptime.textContent = `${mins}m ${secs}s`;
        }

        // Detailed Raw JSON
        const rawJsonEl = document.getElementById('raw-status-json');
        if (rawJsonEl) rawJsonEl.textContent = JSON.stringify(result, null, 2);

      } catch (error) {
        const metricStatus = document.getElementById('metric-status');
        if (metricStatus) {
          metricStatus.textContent = 'Error';
          metricStatus.className = 'metric-value highlight-yellow';
        }
        const statusPanel = document.querySelector('[data-status-panel]');
        if (statusPanel) {
          const indicator = statusPanel.querySelector('.status-indicator');
          const title = statusPanel.querySelector('[data-status-title]');
          const text = statusPanel.querySelector('[data-status-text]');
          if (indicator) indicator.dataset.tone = 'danger';
          if (title) title.textContent = 'Connection Issue';
          if (text) text.textContent = error.message || 'Cannot reach PseudoQuantum backend.';
        }
      }
    };

    // Refresh button
    const refreshBtn = document.getElementById('refresh-status');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        refreshBtn.disabled = true;
        await updateStatus();
        refreshBtn.disabled = false;
      };
    }

    // Format Pills Handler
    const formatPills = document.querySelectorAll('#output-format-pills .format-pill');
    formatPills.forEach((pill) => {
      pill.onclick = () => {
        formatPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        activeFormat = pill.dataset.format || 'hex';
        renderOutputBox(currentEntropyHex, activeFormat);
      };
    });

    // Copy Output Handler
    const copyBtn = document.getElementById('btn-copy-entropy');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const outputBox = document.querySelector('[data-output-box]');
        const text = outputBox ? outputBox.textContent.trim() : '';
        if (!text || text.includes('Awaiting')) return;

        try {
          await navigator.clipboard.writeText(text);
          const orig = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = orig; }, 1500);
        } catch (e) {
          console.warn('Clipboard copy failed:', e);
        }
      };
    }

    // Generate Entropy Handler
    const genBtn = document.getElementById('btn-generate-entropy');
    if (genBtn) {
      genBtn.onclick = async () => {
        const byteSelect = document.getElementById('generator-byte-count');
        const count = byteSelect ? parseInt(byteSelect.value, 10) : 32;

        const statBatchCount = document.getElementById('stat-batch-count');
        if (statBatchCount) statBatchCount.textContent = `${count} B`;

        genBtn.disabled = true;
        resetPipeline();

        const statusLabel = document.querySelector('[data-pipeline-status]');
        const telemetry = document.querySelector('[data-pipeline-telemetry]');
        if (statusLabel) statusLabel.textContent = 'Sampling hardware shot noise...';

        const startTime = performance.now();

        try {
          // Animate Stage 01
          setPipelineStep('photodiode', 'active', 'Reading ADC pins 34 & 35...');
          if (telemetry) telemetry.textContent = `[ADC] Triggered acquisition for ${count * 8} quantum bits...`;
          await new Promise((r) => setTimeout(r, 60));

          // Animate Stage 02
          setPipelineStep('photodiode', 'complete', 'Noise acquired');
          setPipelineStep('differential', 'active', 'Subtracting Ch1 - Ch2 analog noise...');
          if (telemetry) telemetry.textContent = `[CMRR] Common mode optical/50Hz noise cancelled.`;
          await new Promise((r) => setTimeout(r, 60));

          // Animate Stage 03
          setPipelineStep('differential', 'complete', 'Common-mode rejected');
          setPipelineStep('lsb', 'active', 'Extracting LSBs from 12-bit ADC data...');
          if (telemetry) telemetry.textContent = `[LSB] Extracted least significant bits from digitized noise.`;
          await new Promise((r) => setTimeout(r, 60));

          // Animate Stage 04
          setPipelineStep('lsb', 'complete', 'LSBs isolated');
          setPipelineStep('whitening', 'active', 'Backend LFSR polynomial XOR whitening...');
          if (telemetry) telemetry.textContent = `[LFSR Whitening] C++ backend whitened raw ADC stream (Galois polynomial 0x80000057).`;
          await new Promise((r) => setTimeout(r, 60));

          // Animate Stage 05 & Call API
          setPipelineStep('whitening', 'complete', 'LFSR whitened');
          setPipelineStep('pool', 'active', 'Querying thread-safe entropy buffer...');

          const entropyResponse = await window.PQEApi.getEntropy(count);
          const hex = entropyResponse?.data || entropyResponse?.hex || entropyResponse?.entropy || (typeof entropyResponse === 'string' ? entropyResponse : '');

          const durationMs = Math.round(performance.now() - startTime);
          const statBatchTime = document.getElementById('stat-batch-time');
          if (statBatchTime) statBatchTime.textContent = `${durationMs} ms`;

          setPipelineStep('pool', 'complete', `${count} bytes pooled`);
          setPipelineStep('conditioning', 'active', 'Conditioning output...');

          currentEntropyHex = hex;
          renderOutputBox(hex, activeFormat);

          setPipelineStep('conditioning', 'complete', 'Ready');
          if (statusLabel) statusLabel.textContent = `Generated ${count} bytes in ${durationMs}ms`;
          if (telemetry) telemetry.textContent = `[SUCCESS] Output conditioned. Dispatched ${count} bytes (${count * 8} bits) from pool buffer.`;

        } catch (err) {
          console.error('Generation failed:', err);
          setPipelineStep('conditioning', 'error', err.message);
          if (statusLabel) statusLabel.textContent = 'Generation error';
          if (telemetry) telemetry.textContent = `[ERROR] ${err.message}`;
        } finally {
          genBtn.disabled = false;
          updateStatus();
        }
      };
    }

    // Initial status fetch & timer
    updateStatus();
    if (statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(updateStatus, 2000);
  };
})();

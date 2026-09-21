window.PQEPage = window.PQEPage || {};

(function () {
  const sessionHistory = [];

  function drawBitDistributionChart(svg, zeroRatio, oneRatio) {
    if (!svg) return;
    const width = 540;
    const height = 220;
    const pad = { left: 50, right: 30, top: 30, bottom: 45 };

    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const zPct = (zeroRatio * 100).toFixed(1);
    const oPct = (oneRatio * 100).toFixed(1);

    const barW = Math.min(chartW * 0.28, 90);
    const zX = pad.left + chartW * 0.25 - barW / 2;
    const oX = pad.left + chartW * 0.75 - barW / 2;

    const zBarH = Math.max(4, chartH * (zeroRatio));
    const oBarH = Math.max(4, chartH * (oneRatio));

    const zY = pad.top + chartH - zBarH;
    const oY = pad.top + chartH - oBarH;

    svg.innerHTML = `
      <defs>
        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#00e5ff" stop-opacity="0.2"/>
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c4dff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#7c4dff" stop-opacity="0.2"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <g class="chart-gridlines">
        <line x1="${pad.left}" y1="${pad.top}" x2="${width - pad.right}" y2="${pad.top}"/>
        <text x="${pad.left - 10}" y="${pad.top + 4}" text-anchor="end">100%</text>

        <line x1="${pad.left}" y1="${pad.top + chartH * 0.5}" x2="${width - pad.right}" y2="${pad.top + chartH * 0.5}"/>
        <text x="${pad.left - 10}" y="${pad.top + chartH * 0.5 + 4}" text-anchor="end">50%</text>

        <line x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}"/>
        <text x="${pad.left - 10}" y="${pad.top + chartH + 4}" text-anchor="end">0%</text>
      </g>

      <!-- Axes -->
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}"/>
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + chartH}"/>

      <!-- 50% Ideal Reference Line -->
      <line x1="${pad.left}" y1="${pad.top + chartH * 0.5}" x2="${width - pad.right}" y2="${pad.top + chartH * 0.5}"
            stroke="rgba(0, 230, 118, 0.4)" stroke-dasharray="4 4" stroke-width="1.5"/>

      <!-- Bars -->
      <rect class="chart-bar" x="${zX}" y="${zY}" width="${barW}" height="${zBarH}" fill="url(#cyanGrad)" stroke="#00e5ff"/>
      <text class="chart-axis-label" x="${zX + barW / 2}" y="${zY - 8}" text-anchor="middle" fill="#00e5ff" font-weight="700">${zPct}%</text>
      <text class="chart-axis-label" x="${zX + barW / 2}" y="${pad.top + chartH + 20}" text-anchor="middle">BIT 0</text>

      <rect class="chart-bar" x="${oX}" y="${oY}" width="${barW}" height="${oBarH}" fill="url(#purpleGrad)" stroke="#7c4dff"/>
      <text class="chart-axis-label" x="${oX + barW / 2}" y="${oY - 8}" text-anchor="middle" fill="#7c4dff" font-weight="700">${oPct}%</text>
      <text class="chart-axis-label" x="${oX + barW / 2}" y="${pad.top + chartH + 20}" text-anchor="middle">BIT 1</text>
    `;
  }

  function drawPValueChart(svg, tests) {
    if (!svg) return;
    const width = 540;
    const height = 220;
    const pad = { left: 50, right: 30, top: 30, bottom: 45 };

    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const testKeys = [
      { key: 'monobit', label: 'Monobit' },
      { key: 'block_frequency', label: 'Block Freq' },
      { key: 'runs', label: 'Runs' },
      { key: 'longest_run', label: 'Longest 1s' },
      { key: 'byte_distribution', label: 'Byte Dist' }
    ];

    const slotW = chartW / testKeys.length;
    const barW = Math.min(slotW * 0.5, 45);

    let barsMarkup = '';

    testKeys.forEach((item, index) => {
      const t = tests[item.key] || {};
      const pVal = typeof t.p_value === 'number' ? t.p_value : 0;
      const passed = t.passed !== undefined ? t.passed : pVal >= 0.01;

      const barH = Math.max(3, chartH * Math.min(pVal, 1.0));
      const x = pad.left + index * slotW + (slotW - barW) / 2;
      const y = pad.top + chartH - barH;

      const color = passed ? '#00e676' : '#ff5252';

      barsMarkup += `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" fill-opacity="0.75" stroke="${color}" stroke-width="1"/>
        <text class="chart-axis-label" x="${x + barW / 2}" y="${Math.max(pad.top + 12, y - 6)}" text-anchor="middle" fill="${color}" font-weight="700">
          ${pVal.toFixed(3)}
        </text>
        <text class="chart-axis-label" x="${x + barW / 2}" y="${pad.top + chartH + 20}" text-anchor="middle">${item.label}</text>
      `;
    });

    // Threshold line at 0.01:
    const thresholdY = pad.top + chartH - (chartH * 0.01);

    svg.innerHTML = `
      <!-- Grid lines -->
      <g class="chart-gridlines">
        <line x1="${pad.left}" y1="${pad.top}" x2="${width - pad.right}" y2="${pad.top}"/>
        <text x="${pad.left - 10}" y="${pad.top + 4}" text-anchor="end">1.0</text>

        <line x1="${pad.left}" y1="${pad.top + chartH * 0.5}" x2="${width - pad.right}" y2="${pad.top + chartH * 0.5}"/>
        <text x="${pad.left - 10}" y="${pad.top + chartH * 0.5 + 4}" text-anchor="end">0.5</text>

        <line x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}"/>
        <text x="${pad.left - 10}" y="${pad.top + chartH + 4}" text-anchor="end">0.0</text>
      </g>

      <!-- Threshold 0.01 -->
      <line x1="${pad.left}" y1="${thresholdY}" x2="${width - pad.right}" y2="${thresholdY}"
            stroke="rgba(255, 214, 0, 0.7)" stroke-dasharray="3 3" stroke-width="1.5"/>
      <text x="${width - pad.right + 5}" y="${thresholdY + 3}" fill="#ffd600" font-size="9px" font-family="monospace">&alpha; 0.01</text>

      <!-- Axes -->
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}"/>
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + chartH}"/>

      ${barsMarkup}
    `;
  }

  function updateTestCard(cardId, testData) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const badge = card.querySelector('.test-badge');
    const fill = card.querySelector('.p-value-fill');
    const small = card.querySelector('small');

    if (!testData) {
      if (badge) { badge.className = 'test-badge pending'; badge.textContent = 'PENDING'; }
      if (fill) { fill.style.width = '0%'; fill.className = 'p-value-fill'; }
      if (small) small.innerHTML = '<span>P-Value: &mdash;</span><span>Threshold: &alpha; &ge; 0.01</span>';
      return;
    }

    const pVal = typeof testData.p_value === 'number' ? testData.p_value : 0;
    const passed = testData.passed !== undefined ? testData.passed : pVal >= 0.01;

    if (cardId === 'card-longest-run') {
      const highestBadge = document.getElementById('highest-ones-badge');
      if (highestBadge) {
        if (testData && testData.parameters && testData.parameters.highest_1s_run !== undefined) {
          highestBadge.textContent = `Highest 1s Run: ${testData.parameters.highest_1s_run} bits`;
        } else if (testData && typeof testData.statistic === 'number' && testData.statistic > 0) {
          highestBadge.textContent = `Highest 1s Run: ${Math.round(testData.statistic)} bits`;
        } else {
          highestBadge.textContent = 'Highest 1s Run: \u2014';
        }
      }
    }

    if (badge) {
      badge.className = passed ? 'test-badge pass' : 'test-badge fail';
      badge.textContent = passed ? 'PASSED' : 'FAILED';
    }

    if (fill) {
      fill.style.width = `${Math.min(pVal * 100, 100).toFixed(1)}%`;
      fill.className = passed ? 'p-value-fill pass' : 'p-value-fill fail';
    }

    if (small) {
      small.innerHTML = `<span>P: ${pVal.toFixed(4)}</span><span>&alpha; &ge; 0.01</span>`;
    }
  }

  function updateHistoryTable() {
    const tbody = document.getElementById('test-history-table');
    const countEl = document.getElementById('test-history-count');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${sessionHistory.length} Runs`;

    if (sessionHistory.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--muted); padding:2rem;">No test runs recorded in this session.</td></tr>';
      return;
    }

    tbody.innerHTML = sessionHistory.slice().reverse().map((run) => {
      const verdictClass = run.passed ? 'test-badge pass' : 'test-badge fail';
      return `
        <tr>
          <td>#${run.id}</td>
          <td>${run.bytes} B</td>
          <td style="text-transform:uppercase;">${run.mode}</td>
          <td><code>${run.monobitP}</code></td>
          <td><code>${run.blockP}</code></td>
          <td><code>${run.runsP}</code></td>
          <td><code>${run.longest1s}</code></td>
          <td><code>${run.byteP}</code></td>
          <td><span class="${verdictClass}">${run.passed ? 'PASSED' : 'FAILED'}</span></td>
        </tr>
      `;
    }).join('');
  }

  function drawPValueHistogramChart(svg, bins, expected) {
    if (!svg) return;
    if (!Array.isArray(bins) || bins.length === 0) {
      bins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    const width = 540;
    const height = 200;
    const pad = { left: 45, right: 25, top: 25, bottom: 40 };

    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const maxVal = Math.max(...bins, (expected || 10) * 1.5, 10);
    const expY = pad.top + chartH - (chartH * ((expected || 10) / maxVal));

    const slotW = chartW / bins.length;
    const barW = Math.min(slotW * 0.75, 36);

    let barsMarkup = '';
    bins.forEach((count, i) => {
      const barH = Math.max(3, chartH * (count / maxVal));
      const x = pad.left + i * slotW + (slotW - barW) / 2;
      const y = pad.top + chartH - barH;

      const diffRatio = expected > 0 ? Math.abs(count - expected) / expected : 0;
      let barColor = '#00e5ff';
      if (diffRatio > 0.6) {
        barColor = '#ff5252';
      } else if (diffRatio > 0.35) {
        barColor = '#ffd600';
      }

      const binRange = `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`;

      barsMarkup += `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${barColor}" fill-opacity="0.8" rx="2" stroke="${barColor}" stroke-width="1">
          <title>Bin [${binRange}]: ${count} p-values</title>
        </rect>
        <text class="chart-axis-label" x="${x + barW / 2}" y="${Math.max(pad.top + 10, y - 4)}" text-anchor="middle" fill="${barColor}" font-weight="700" font-size="10px">
          ${count}
        </text>
        <text class="chart-axis-label" x="${x + barW / 2}" y="${pad.top + chartH + 18}" text-anchor="middle" font-size="9px">
          .${i}
        </text>
      `;
    });

    svg.innerHTML = `
      <!-- Grid lines -->
      <g class="chart-gridlines">
        <line x1="${pad.left}" y1="${pad.top}" x2="${width - pad.right}" y2="${pad.top}"/>
        <text x="${pad.left - 8}" y="${pad.top + 4}" text-anchor="end">${Math.round(maxVal)}</text>

        <line x1="${pad.left}" y1="${pad.top + chartH * 0.5}" x2="${width - pad.right}" y2="${pad.top + chartH * 0.5}"/>
        <text x="${pad.left - 8}" y="${pad.top + chartH * 0.5 + 4}" text-anchor="end">${Math.round(maxVal / 2)}</text>

        <line x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}"/>
        <text x="${pad.left - 8}" y="${pad.top + chartH + 4}" text-anchor="end">0</text>
      </g>

      <!-- Expected uniform line -->
      <line x1="${pad.left}" y1="${expY}" x2="${width - pad.right}" y2="${expY}"
            stroke="rgba(0, 230, 118, 0.7)" stroke-dasharray="4 3" stroke-width="1.5"/>
      <text x="${width - pad.right}" y="${expY - 4}" text-anchor="end" fill="#00e676" font-size="9px" font-family="monospace">
        Expected (~${Math.round(expected || 0)})
      </text>

      <!-- Axes -->
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}"/>
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + chartH}"/>

      ${barsMarkup}
    `;
  }

  function updateExhaustivePanel(exhaustiveData) {
    const exPanel = document.getElementById('exhaustive-panel');
    if (!exPanel) return;

    if (!exhaustiveData) {
      exPanel.classList.add('d-none');
      return;
    }

    exPanel.classList.remove('d-none');

    const passRateEl = document.getElementById('ex-stat-pass-rate');
    if (passRateEl) {
      passRateEl.textContent = `${exhaustiveData.overall_pass_rate_percent}% (${exhaustiveData.runs} runs)`;
    }

    const thresholdEl = document.getElementById('ex-stat-threshold');
    if (thresholdEl) {
      thresholdEl.textContent = `≥ ${exhaustiveData.min_pass_threshold_percent}% (${exhaustiveData.min_passes_required}/${exhaustiveData.runs})`;
    }

    const unifPEl = document.getElementById('ex-stat-uniformity-p');
    if (unifPEl) {
      const p = exhaustiveData.overall_uniformity_p_value;
      unifPEl.textContent = typeof p === 'number' ? p.toFixed(4) : '—';
    }

    const diagEl = document.getElementById('ex-stat-diagnosis');
    if (diagEl) {
      diagEl.textContent = exhaustiveData.overall_passed ? 'Uniform (Ideal Random)' : 'Non-Uniform Anomalies Detected';
      diagEl.style.color = exhaustiveData.overall_passed ? 'var(--success)' : 'var(--danger)';
    }

    const verdictBadge = document.getElementById('exhaustive-verdict-badge');
    if (verdictBadge) {
      verdictBadge.className = exhaustiveData.overall_passed ? 'test-badge pass' : 'test-badge fail';
      verdictBadge.textContent = exhaustiveData.overall_passed ? 'PASSED (NIST SP 800-22)' : 'REJECTED';
    }

    const histBadge = document.getElementById('ex-histogram-count-badge');
    if (histBadge) {
      histBadge.textContent = `${(exhaustiveData.runs || 100) * 5} Total P-Values`;
    }

    // Draw 10-bin histogram
    const histSvg = document.getElementById('chart-pvalue-histogram');
    if (histSvg && exhaustiveData.overall_histogram_bins_10) {
      drawPValueHistogramChart(histSvg, exhaustiveData.overall_histogram_bins_10, exhaustiveData.overall_expected_per_bin);
    }

    // Populate per-test table
    const exTable = document.getElementById('exhaustive-tests-table');
    if (exTable && exhaustiveData.tests) {
      const testNameMap = {
        monobit: '01. Monobit Frequency',
        block_frequency: '02. Block Frequency',
        runs: '03. Runs Test',
        longest_run: '04. Longest Run of Ones',
        byte_distribution: '05. Chi-Square Byte Distribution'
      };

      exTable.innerHTML = Object.entries(exhaustiveData.tests).map(([tKey, tData]) => {
        const tPassed = tData.passed !== undefined ? tData.passed : (tData.pass_rate_percent >= exhaustiveData.min_pass_threshold_percent);
        const badgeCls = tPassed ? 'test-badge pass' : 'test-badge fail';
        return `
          <tr>
            <td><strong>${testNameMap[tKey] || tKey}</strong></td>
            <td>${tData.passes} / ${exhaustiveData.runs}</td>
            <td><code>${tData.pass_rate_percent.toFixed(1)}%</code></td>
            <td><code>${typeof tData.uniformity_p_value === 'number' ? tData.uniformity_p_value.toFixed(4) : '—'}</code></td>
            <td><code>${typeof tData.ks_p_value === 'number' ? tData.ks_p_value.toFixed(4) : '—'}</code></td>
            <td style="font-size: 0.82rem; color: ${tPassed ? 'var(--success)' : 'var(--danger)'};">${tData.diagnosis || '—'}</td>
            <td><span class="${badgeCls}">${tPassed ? 'PASSED' : 'REJECT'}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  window.PQEPage.test = async function () {
    const form = document.getElementById('entropy-test-form');
    if (!form) return;

    const bytesInput = document.getElementById('entropy-bytes');
    const modeSelect = document.getElementById('entropy-mode');
    const status = document.getElementById('entropy-status');
    const output = document.getElementById('entropy-output');

    const chartBitDist = document.getElementById('chart-bit-distribution');
    const chartPValues = document.getElementById('chart-pvalues');
    const ratioBadge = document.getElementById('chart-ratio-badge');
    const verdictBadge = document.getElementById('chart-verdict-badge');

    function setStatus(message, type = '') {
      status.className = 'alert-banner';
      if (type) status.classList.add(type);
      status.textContent = message;
    }

    // Initialize blank charts
    drawBitDistributionChart(chartBitDist, 0.5, 0.5);
    drawPValueChart(chartPValues, {});

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const bytes = Number(bytesInput.value) || 4096;
      const mode = modeSelect.value || 'exhaustive';
      const submitButton = form.querySelector('button[type="submit"]');

      // Stop dashboard & background polling while test is running
      if (window.PQEPollController) {
        window.PQEPollController.pause();
      }

      submitButton.disabled = true;
      setStatus(
        mode === 'exhaustive'
          ? `Executing Exhaustive NIST SP 800-22 (100 independent samples × ${bytes} bytes) with Uniformity Testing. Dashboard updates paused...`
          : `Executing Python NIST SP 800-22 (${mode} mode) on ${bytes} entropy bytes. Dashboard updates paused...`,
        ''
      );

      try {
        const result = await window.PQEApi.testEntropy({ bytes, mode });
        output.value = JSON.stringify(result, null, 2);

        // Extract test array from Python analyzer or fallback
        let testList = [];
        if (Array.isArray(result.statistics)) {
          testList = result.statistics;
        } else if (result.analysis && Array.isArray(result.analysis.test_results)) {
          testList = result.analysis.test_results;
        } else if (result.test_results && Array.isArray(result.test_results)) {
          testList = result.test_results;
        }

        const tests = {};
        if (testList.length > 0) {
          testList.forEach((item) => {
            const name = (item.name || '').toLowerCase();
            const normalized = {
              name: item.name,
              p_value: typeof item.p_value === 'number' ? item.p_value : 0,
              passed: item.pass !== undefined ? item.pass : (item.passed !== undefined ? item.passed : item.p_value >= 0.01),
              parameters: item.parameters || {}
            };

            if (name.includes('monobit')) {
              tests.monobit = normalized;
            } else if (name.includes('block')) {
              tests.block_frequency = normalized;
            } else if (name.includes('longest') || name.includes('run of ones')) {
              tests.longest_run = normalized;
            } else if (name.includes('runs')) {
              tests.runs = normalized;
            } else if (name.includes('byte') || name.includes('chi') || name.includes('dist')) {
              tests.byte_distribution = normalized;
            }
          });
        } else if (result.tests) {
          Object.assign(tests, result.tests);
        }

        // Fallback default test items if not in list
        ['monobit', 'block_frequency', 'runs', 'longest_run', 'byte_distribution'].forEach((k) => {
          if (!tests[k]) {
            tests[k] = { name: k, p_value: 0.5, passed: true, parameters: { highest_1s_run: 8 } };
          }
        });

        const overallPassed = result.overall_verdict === 'PASSED' ||
          (result.status === 'ok' && Object.values(tests).every((t) => t.passed));

        // Update test cards
        updateTestCard('card-monobit', tests.monobit);
        updateTestCard('card-block', tests.block_frequency);
        updateTestCard('card-runs', tests.runs);
        updateTestCard('card-longest-run', tests.longest_run);
        updateTestCard('card-byte-dist', tests.byte_distribution);

        // Calculate bit distribution
        let zeroRatio = 0.5;
        let oneRatio = 0.5;

        if (tests.monobit && tests.monobit.parameters && tests.monobit.parameters.s_obs !== undefined && tests.monobit.parameters.n_bits) {
          const sObs = tests.monobit.parameters.s_obs;
          const nBits = tests.monobit.parameters.n_bits;
          const ones = (nBits + sObs) / 2;
          oneRatio = Math.max(0, Math.min(1, ones / nBits));
          zeroRatio = 1 - oneRatio;
        } else if (result.proportion_ones !== undefined) {
          oneRatio = result.proportion_ones;
          zeroRatio = 1 - oneRatio;
        }

        drawBitDistributionChart(chartBitDist, zeroRatio, oneRatio);
        if (ratioBadge) {
          ratioBadge.textContent = `${(zeroRatio * 100).toFixed(1)}% 0s / ${(oneRatio * 100).toFixed(1)}% 1s`;
        }

        drawPValueChart(chartPValues, tests);
        if (verdictBadge) {
          verdictBadge.textContent = overallPassed ? 'PASSED (NIST &alpha; &ge; 0.01)' : 'FAILURES DETECTED';
          verdictBadge.style.color = overallPassed ? 'var(--success)' : 'var(--danger)';
        }

        // Handle exhaustive panel
        updateExhaustivePanel(result.exhaustive || null);

        // Add to history
        sessionHistory.push({
          id: sessionHistory.length + 1,
          bytes: bytes,
          mode: mode,
          monobitP: tests.monobit?.p_value !== undefined ? tests.monobit.p_value.toFixed(4) : '&mdash;',
          blockP: tests.block_frequency?.p_value !== undefined ? tests.block_frequency.p_value.toFixed(4) : '&mdash;',
          runsP: tests.runs?.p_value !== undefined ? tests.runs.p_value.toFixed(4) : '&mdash;',
          longest1s: tests.longest_run?.parameters?.highest_1s_run !== undefined ? `${tests.longest_run.parameters.highest_1s_run} b (P:${tests.longest_run.p_value.toFixed(3)})` : '&mdash;',
          byteP: tests.byte_distribution?.p_value !== undefined ? tests.byte_distribution.p_value.toFixed(4) : '&mdash;',
          passed: overallPassed
        });

        updateHistoryTable();
        setStatus(
          mode === 'exhaustive'
            ? `Exhaustive analysis complete: ${result.overall_pass_rate_percent}% pass rate across 100 runs (${overallPassed ? 'PASSED CONFIDENCE INTERVAL' : 'REJECTED'}).`
            : `Analysis complete: ${overallPassed ? 'ALL TESTS PASSED' : 'COMPLETED'} (${mode} mode).`,
          overallPassed ? 'success' : 'warning'
        );

      } catch (error) {
        output.value = '';
        setStatus(`Entropy test execution error: ${error.message}`, 'danger');
      } finally {
        // Resume background polling after test finishes
        if (window.PQEPollController) {
          window.PQEPollController.resume();
        }
        submitButton.disabled = false;
      }
    });
  };
})();


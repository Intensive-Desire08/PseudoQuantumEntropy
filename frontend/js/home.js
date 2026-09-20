window.PQEPage = window.PQEPage || {};

let statusInterval = null;
let lastBytes = null;
let lastTime = null;

window.PQEPage.home = async function () {
  const output = document.getElementById('status-output');
  if (!output) return;

  output.innerHTML = '<div class="col-12"><div class="alert alert-light border">Loading status...</div></div>';

  const updateStatus = async () => {
    try {
      const result = await window.PQEApi.getStatus();
      const entropy = result?.entropy || {};
      const server = result?.server || {};
  
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
      
      const sourceClass = (entropy.source_type === 'hardware') ? 'text-success font-weight-bold' : 'text-warning font-weight-bold';

      output.innerHTML = `
        <div class="col-md-3">
          <div class="card status-card h-100">
            <div class="card-body">
              <div class="label">Status</div>
              <div class="value">${result?.status || 'unknown'}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card status-card h-100">
            <div class="card-body">
              <div class="label">Hardware Available</div>
              <div class="value">${String(entropy.hardware_available ?? 'unknown')}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card status-card h-100">
            <div class="card-body">
              <div class="label">Entropy Source</div>
              <div class="value ${sourceClass}">${entropy.source || 'unknown'}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card status-card h-100">
            <div class="card-body">
              <div class="label">Pool Size</div>
              <div class="value">${entropy.pool_size ?? '0'} bytes</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 mt-3">
          <div class="card status-card h-100">
            <div class="card-body">
              <div class="label">Speed</div>
              <div class="value">${speedStr}</div>
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Detailed Response</h5>
              <pre class="json-output">${JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      output.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            Failed to load status: ${error.message}
          </div>
        </div>
      `;
    }
  };

  // Initial update
  await updateStatus();

  // Clear existing interval if any
  if (statusInterval) {
    clearInterval(statusInterval);
  }

  // Poll every 2 seconds
  statusInterval = setInterval(updateStatus, 2000);
};

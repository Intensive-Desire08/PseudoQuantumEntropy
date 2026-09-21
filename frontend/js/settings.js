window.PQEPage = window.PQEPage || {};

window.PQEPage.settings = function () {
  const form = document.getElementById('settings-form');
  if (!form) return;

  const portInput = document.getElementById('settings-port');
  const baudInput = document.getElementById('settings-baud');
  const sourceInput = document.getElementById('settings-source');
  const status = document.getElementById('settings-status');
  const reseedBtn = document.getElementById('btn-reseed-pool');

  function setStatus(message, type = '') {
    status.className = 'alert-banner';
    if (type) status.classList.add(type);
    status.textContent = message;
  }

  // Save settings form handler
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      port: portInput ? portInput.value.trim() : '',
      baud_rate: baudInput ? (Number(baudInput.value) || 115200) : 115200,
      source_type: sourceInput ? sourceInput.value.trim() : '',
      reseed: false
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setStatus('Applying updated configuration parameters...', '');

    try {
      await window.PQEApi.settings(payload);
      setStatus('Settings updated and persisted successfully.', 'success');
    } catch (error) {
      setStatus(`Configuration update error: ${error.message}`, 'danger');
    } finally {
      submitButton.disabled = false;
    }
  });

  // Reseed button handler
  if (reseedBtn) {
    reseedBtn.addEventListener('click', async () => {
      reseedBtn.disabled = true;
      setStatus('Triggering hardware entropy source reseed...', '');

      try {
        const res = await window.PQEApi.reseed();
        const msg = res?.message || 'Entropy pool reseeded successfully with fresh hardware noise.';
        setStatus(`Entropy pool ${msg.toLowerCase().includes('reseed') || msg.toLowerCase().includes('refill') ? 'reseeded successfully' : msg}.`, 'success');
      } catch (error) {
        setStatus(`Reseed trigger error: ${error.message}`, 'danger');
      } finally {
        reseedBtn.disabled = false;
      }
    });
  }

  // Load initial settings asynchronously
  window.PQEApi.getSettings()
    .then((settings) => {
      if (portInput) portInput.value = settings.port || settings.serial_port || '';
      if (baudInput) baudInput.value = settings.baud_rate || settings.baud || 115200;
      if (sourceInput) sourceInput.value = settings.source_type || settings.source_name || settings.source || '';
      setStatus('Active hardware and backend configuration loaded.', 'success');
    })
    .catch((error) => {
      setStatus(`Failed to retrieve settings: ${error.message}`, 'danger');
    });
};

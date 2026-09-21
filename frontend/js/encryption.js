window.PQEPage = window.PQEPage || {};

window.PQEPage.encryption = function () {
  const form = document.getElementById('encryption-form');
  if (!form) return;

  const fileInput = document.getElementById('encryption-file');
  const dropZone = document.getElementById('encryption-drop-zone');
  const fileBadge = document.getElementById('file-info-badge');
  const passwordInput = document.getElementById('encryption-password');
  const modeSelect = document.getElementById('encryption-mode');
  const status = document.getElementById('encryption-status');
  const downloadLink = document.getElementById('encryption-download');

  const transparencyDiv = document.getElementById('encryption-transparency');
  const outKey = document.getElementById('encryption-out-key');
  const outIv = document.getElementById('encryption-out-iv');
  const outTag = document.getElementById('encryption-out-tag');

  const hiddenKey = document.getElementById('encryption-key');
  const hiddenIv = document.getElementById('encryption-iv');
  const hiddenTag = document.getElementById('encryption-tag');

  function setStatus(message, type = '') {
    status.className = 'alert-banner';
    if (type) status.classList.add(type);
    status.textContent = message;
  }

  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function hex2buf(hexString) {
    const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function updateFileBadge(file) {
    if (!fileBadge) return;
    if (file) {
      fileBadge.textContent = `Selected: ${file.name} (${formatBytes(file.size)})`;
      fileBadge.style.display = 'inline-flex';
    } else {
      fileBadge.style.display = 'none';
      fileBadge.textContent = '';
    }
  }

  // Drag & drop handlers
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach((type) => {
      dropZone.addEventListener(type, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        updateFileBadge(fileInput.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        updateFileBadge(fileInput.files[0]);
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      setStatus('Please select or drop a file first.', 'warning');
      return;
    }

    const password = passwordInput.value.trim();
    if (!password) {
      setStatus('Please enter a secret passphrase.', 'warning');
      return;
    }

    const mode = modeSelect.value;
    setStatus(mode === 'encrypt' ? 'Deriving key & encrypting with AES-256-GCM...' : 'Verifying authentication tag & decrypting...', '');

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hexData = buf2hex(arrayBuffer);

      let payload = { password: password };
      if (mode === 'encrypt') {
        payload.data = hexData;
      } else {
        payload.ciphertext = hexData;
      }

      const response = await window.PQEApi.request(mode === 'encrypt' ? '/encrypt' : '/decrypt', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Populate transparency details
      const keyVal = response.key || '';
      const ivVal = response.iv || '';
      const tagVal = response.tag || '';

      ['encryption-key', 'encryption-out-key'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = keyVal;
      });

      ['encryption-iv', 'encryption-out-iv'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = ivVal;
      });

      ['encryption-tag', 'encryption-out-tag'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = tagVal;
      });

      if (mode === 'encrypt') {
        setStatus('Encryption complete. AES-256-GCM ciphertext authenticated and ready to download.', 'success');
        const outBuf = hex2buf(response.ciphertext);
        const blob = new Blob([outBuf], { type: 'application/octet-stream' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${file.name}.pqe`;
        downloadLink.classList.remove('d-none');
        downloadLink.textContent = `Download Encrypted File (${file.name}.pqe)`;
      } else {
        setStatus('Decryption complete. Integrity authentication tag matched perfectly.', 'success');
        const outBuf = hex2buf(response.plaintext);
        const blob = new Blob([outBuf], { type: 'application/octet-stream' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = file.name.endsWith('.pqe') ? file.name.slice(0, -4) : `decrypted_${file.name}`;
        downloadLink.classList.remove('d-none');
        downloadLink.textContent = `Download Decrypted File (${downloadLink.download})`;
      }
    } catch (error) {
      if (downloadLink) downloadLink.classList.add('d-none');
      setStatus(`Cipher operation error: ${error.message}`, 'danger');
    } finally {
      submitButton.disabled = false;
    }
  });
};

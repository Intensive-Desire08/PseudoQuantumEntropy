window.PQEPage = window.PQEPage || {};

window.PQEPage.encryption = function () {
  const form = document.getElementById('encryption-form');
  if (!form) return;

  const fileInput = document.getElementById('encryption-file');
  const passwordInput = document.getElementById('encryption-password');
  const modeSelect = document.getElementById('encryption-mode');
  const status = document.getElementById('encryption-status');
  const downloadLink = document.getElementById('encryption-download');

  const transparencyDiv = document.getElementById('encryption-transparency');
  const outKey = document.getElementById('encryption-out-key');
  const outIv = document.getElementById('encryption-out-iv');
  const outTag = document.getElementById('encryption-out-tag');

  function setStatus(message, type = 'secondary') {
    status.className = `alert alert-${type} mt-3`;
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      setStatus('Please select a file first.', 'warning');
      return;
    }

    const password = passwordInput.value.trim();
    if (!password) {
      setStatus('Please enter a password.', 'warning');
      return;
    }

    const mode = modeSelect.value;

    setStatus(mode === 'encrypt' ? 'Encrypting...' : 'Decrypting...', 'secondary');
    transparencyDiv.style.display = 'none';

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
      outKey.value = response.key || '';
      outIv.value = response.iv || '';
      outTag.value = response.tag || '';
      transparencyDiv.style.display = 'block';

      if (mode === 'encrypt') {
        setStatus(`Encryption complete.`, 'success');
        const outBuf = hex2buf(response.ciphertext);
        const blob = new Blob([outBuf], { type: 'application/octet-stream' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${file.name}.pqe`;
        downloadLink.classList.remove('d-none');
      } else {
        setStatus('Decryption complete.', 'success');
        const outBuf = hex2buf(response.plaintext);
        const blob = new Blob([outBuf], { type: 'application/octet-stream' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = file.name.endsWith('.pqe') ? file.name.slice(0, -4) : file.name;
        downloadLink.classList.remove('d-none');
      }
    } catch (error) {
      downloadLink.classList.add('d-none');
      setStatus(error.message, 'danger');
    } finally {
      submitButton.disabled = false;
    }
  });
};

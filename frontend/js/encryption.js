window.PQEPage = window.PQEPage || {};

window.PQEPage.encryption = function () {
  const form = document.getElementById('encryption-form');
  if (!form) return;

  const fileInput = document.getElementById('encryption-file');
  const modeSelect = document.getElementById('encryption-mode');
  const status = document.getElementById('encryption-status');
  const downloadLink = document.getElementById('encryption-download');

  function setStatus(message, type = 'secondary') {
    status.className = `alert alert-${type} mt-3`;
    status.textContent = message;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      setStatus('Please select a file first.', 'warning');
      return;
    }

    const mode = modeSelect.value;
    const formData = new FormData();
    formData.append('file', file);

    if (mode === 'encrypt') {
      setStatus('Encrypting...', 'secondary');
    } else {
      setStatus('Decrypting...', 'secondary');
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const result = mode === 'encrypt'
        ? await window.PQEApi.encrypt(formData)
        : await window.PQEApi.decrypt(formData);

      const blob = result instanceof Blob ? result : new Blob([result], { type: 'application/octet-stream' });
      const outputName = mode === 'encrypt'
        ? `${file.name}.enc`
        : file.name.replace(/\.(.*)$/i, '.dec.$1');

      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = outputName;
      downloadLink.classList.remove('d-none');
      setStatus(`${mode === 'encrypt' ? 'Encryption' : 'Decryption'} complete.`, 'success');
    } catch (error) {
      downloadLink.classList.add('d-none');
      setStatus(error.message, 'danger');
    } finally {
      submitButton.disabled = false;
    }
  });
};

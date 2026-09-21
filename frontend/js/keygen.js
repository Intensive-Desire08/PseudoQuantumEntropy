window.PQEPage = window.PQEPage || {};

window.PQEPage.keygen = function () {
  const form = document.getElementById('keygen-form');
  if (!form) return;

  const output = document.getElementById('keygen-output');
  const status = document.getElementById('keygen-status');
  const copyButton = document.getElementById('copy-key-btn');
  const randomSaltBtn = document.getElementById('btn-random-salt');
  const saltInput = document.getElementById('keygen-salt');

  function setStatus(message, type = '') {
    status.className = 'alert-banner';
    if (type) status.classList.add(type);
    status.textContent = message;
  }

  // Random salt generator using live entropy
  if (randomSaltBtn && saltInput) {
    randomSaltBtn.addEventListener('click', async () => {
      randomSaltBtn.disabled = true;
      try {
        const entropy = await window.PQEApi.getEntropy(16);
        const hex = entropy?.data || entropy?.entropy || (typeof entropy === 'string' ? entropy : '');
        if (hex) {
          saltInput.value = hex;
          setStatus('Random 128-bit hardware-backed salt generated.', 'success');
        }
      } catch (err) {
        // Fallback to crypto.getRandomValues if backend offline
        const arr = new Uint8Array(16);
        window.crypto.getRandomValues(arr);
        saltInput.value = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        setStatus('Generated browser random salt.', '');
      } finally {
        randomSaltBtn.disabled = false;
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const password = document.getElementById('keygen-password').value.trim();
    const salt = saltInput.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    setStatus('Deriving 256-bit key using PBKDF2-HMAC-SHA256 (100,000 iterations)...', '');

    try {
      const result = await window.PQEApi.keygen({
        password,
        salt,
        iterations: 100000,
        key_size: 32
      });

      const key = result?.key || result?.data || '';
      output.value = key;
      setStatus('Key generated successfully via PBKDF2-SHA256 (256-bit).', 'success');
    } catch (error) {
      output.value = '';
      setStatus(`Key generation error: ${error.message}`, 'danger');
    } finally {
      submitButton.disabled = false;
    }
  });

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      if (!output.value) {
        setStatus('No key available to copy. Generate a key first.', 'warning');
        return;
      }

      try {
        await navigator.clipboard.writeText(output.value);
        const orig = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setStatus('Derived key copied to clipboard.', 'success');
        setTimeout(() => { copyButton.textContent = orig; }, 1500);
      } catch (error) {
        setStatus('Copy failed. You can copy directly from the textarea.', 'warning');
      }
    });
  }
};

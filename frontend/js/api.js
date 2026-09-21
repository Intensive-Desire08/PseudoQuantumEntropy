window.PQEApi = {
  API_BASE_URL: (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : 'http://localhost:8080',

  async request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isFormData = options.body instanceof FormData;
    const expectsBlob = options.responseType === 'blob' || options.raw === true;

    const headers = new Headers(options.headers || {});

    if (!isFormData && options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${this.API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      mode: 'cors'
    });

    if (expectsBlob) {
      if (!response.ok) {
        const text = await response.text();
        let payload = null;
        try {
          payload = JSON.parse(text);
        } catch (error) {
          payload = text;
        }

        const message =
          (payload && typeof payload === 'object' && payload.error) ||
          (payload && typeof payload === 'object' && payload.message) ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return response.blob();
    }

    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        (payload && typeof payload === 'object' && payload.error) ||
        (payload && typeof payload === 'object' && payload.message) ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return payload;
  },

  async getStatus() {
    return this.request('/status');
  },

  async getHealth() {
    return this.request('/health');
  },

  async getEntropy(bytes = 32) {
    return this.request(`/entropy?bytes=${encodeURIComponent(bytes)}`);
  },

  async keygen(payload = {}) {
    const requestBody = {
      password: payload.password || '',
      salt: payload.salt || '',
      key_size: payload.key_size || 32,
      salt_size: payload.salt_size || 32,
      iterations: payload.iterations || 100000
    };

    return this.request('/keygen', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  },

  async generateKey(payload = {}) {
    return this.keygen(payload);
  },

  async testEntropy(payload = {}) {
    const requestBody = {
      bytes: payload.bytes || 4096,
      mode: payload.mode || 'exhaustive'
    };

    return this.request('/test', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  },

  async getSettings() {
    return this.request('/settings');
  },

  async settings(payload = {}) {
    return this.request('/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateSettings(payload = {}) {
    return this.settings(payload);
  },

  async reseed() {
    return this.request('/reseed', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  async encrypt(formDataOrPayload) {
    const isFormData = formDataOrPayload instanceof FormData;
    return this.request('/encrypt', {
      method: 'POST',
      body: isFormData ? formDataOrPayload : JSON.stringify(formDataOrPayload)
    });
  },

  async decrypt(formDataOrPayload) {
    const isFormData = formDataOrPayload instanceof FormData;
    return this.request('/decrypt', {
      method: 'POST',
      body: isFormData ? formDataOrPayload : JSON.stringify(formDataOrPayload)
    });
  }
};

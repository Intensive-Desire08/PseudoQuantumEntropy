# ⚡ PseudoQuantum Entropy Service

A hybrid hardware-software entropy system that captures photodiode shot noise via an ESP32, processes it through a modular C++17 backend, validates randomness with NIST statistical tests, and exposes cryptographic applications through a web interface. Since the entropy contains both quantum-origin shot noise and unavoidable classical noise, it's called *PseudoQuantum* — honest labeling over marketing hype.

## 📦 Technologies

- **C++17** — Backend (Boost.Asio, OpenSSL, cpp-httplib, nlohmann/json)
- **CMake + vcpkg** — Build system & package management
- **Arduino / ESP32** — Hardware firmware
- **Python 3.11+** — Statistical analyzer (NumPy, SciPy)
- **HTML / CSS / JS** — Frontend SPA (Bootstrap 5.3)
- **Playwright** — E2E testing

## 🦄 Features

- **Dual-photodiode entropy source** — Two independent ADC channels with LSB extraction and Von Neumann whitening on the ESP32
- **Automatic hardware detection** — Hardware-first entropy with seamless OpenSSL `RAND_bytes()` fallback
- **Thread-safe entropy pool** — Background collection, buffered access, periodic refill
- **AES-256-GCM encryption/decryption** — Authenticated encryption with IV generation and integrity tags
- **Cryptographic key generation** — 256-bit keys with PBKDF2-SHA256 derivation (100K iterations)
- **NIST STS validation** — Quick mode (Monobit, Block Frequency, Runs, Byte Distribution) and Full NIST STS analysis
- **REST API** — All operations exposed via clean HTTP endpoints
- **Single-page application** — Home, Encryption, Key Generation, Settings, and Entropy Test pages
- **Pluggable architecture** — Abstract `IEntropySource` interface for swapping entropy providers
- **Cross-platform** — Windows primary, Linux/macOS compatible

## 🎯 Why I Built This

I wanted a project that pushed me beyond typical college-level work — something that combined hardware, systems programming, and cryptography into a single cohesive system. Full-stack C++ development is almost nonexistent in academic projects, and building a modular entropy service felt like the perfect challenge.

Starting from scratch with my own custom CMake framework meant wrestling with dependencies the hard way — no pre-built templates, no shortcuts. Every library had to be integrated manually, every build quirk had to be debugged. But that struggle taught me more about C++ build systems and dependency management than any tutorial could.

The architecture is intentionally modular. The frontend is just a thin interface — the backend can be split off and reused independently in other projects. This design decision came from wanting both efficiency and flexibility. If I need entropy or crypto services in a CLI tool, embedded system, or another web app, the core modules are ready to go.

This project also gave me the opportunity to work across multiple languages: C++17 for performance-critical systems, Python for statistical analysis, and JavaScript for the UI. And to be honest, this is my first actual full-stack individual project — built from the ground up with the assistance of an AI coding agent, which made the scope feel achievable while still being deeply educational.

The result is a system I'm genuinely proud of: hardware-first, efficient, extensible, and portfolio-ready.

## 🏗️ Architecture

```
  ┌───────────────────────────────────────────────┐
  │        FRONTEND (Bootstrap 5 SPA)             │
  │  Home │ Encryption │ KeyGen │ Settings │ Test │
  └──────────────────┬────────────────────────────┘
                     │ HTTP REST API
                     ▼
  ┌───────────────────────────────────────────────┐
  │            C++ BACKEND (cpp-httplib)          │
  │                                               │
  │   Entropy Collector ──► Entropy Pool          │
  │     ├─ SerialEntropySource (Boost.Asio)       │
  │     └─ OpenSSLEntropySource (fallback)        │
  │                            │                  │
  │          ┌─────────────────┼──────────┐       │
  │          ▼                 ▼          ▼       │
  │     KeyGenerator      Encryptor    Hasher     │
  │     (PBKDF2-SHA256)   (AES-GCM)   (SHA-256)   │
  │                                               │
  │   Python Analyzer (subprocess, JSON I/O)      │
  └──────────────────┬────────────────────────────┘
                     │ Serial USB (115200 baud)
                     ▼
  ┌───────────────────────────────────────────────┐
  │         ESP32 HARDWARE                        │
  │  Dual Photodiodes → ADC → LSB → Von Neumann   │
  │  Output: [0xAA][Random Byte] per frame        │
  └───────────────────────────────────────────────┘
```

## 📸 Screenshots

<p align="center">
  <img src="screenshots/home-page.png" alt="Home — System Status" width="720" />
</p>

<p align="center">
  <img src="screenshots/encryption-page.png" alt="AES-GCM Encryption Page" width="720" />
</p>

<p align="center">
  <img src="screenshots/keygen-page.png" alt="Key Generation Page" width="720" />
</p>

<p align="center">
  <img src="screenshots/entropy-test-page.png" alt="NIST Entropy Test Page" width="720" />
</p>

<p align="center">
  <img src="screenshots/settings-page.png" alt="Settings Page" width="720" />
</p>

## 🍿 Video

`<placeholder — video demo coming soon>`

## 🚦 Running the Project

### Prerequisites

- **CMake 3.16+** and a C++17 compiler (MSVC / GCC / Clang)
- **vcpkg** installed and `VCPKG_ROOT` environment variable set
- **Python 3.11+** with pip
- **Node.js** (for Playwright E2E tests only)
- *(Optional)* ESP32 Dev Module + dual photodiode circuit for hardware entropy

### Build & Run

```bash
# Clone
git clone https://github.com/Intensive-Desire08/PseudoQuantumEntropy.git
cd PseudoQuantumEntropy

# Configure & build
cmake --preset default
cmake --build build --config Release

# Run the backend (serves frontend on http://localhost:8080)
./build/bin/Release/PseudoQuantumEntropy.exe

# (Optional) Custom config path
./build/bin/Release/PseudoQuantumEntropy.exe path/to/config.json
```

### Python Analyzer (standalone)

```bash
cd analyzer
pip install -r requirements.txt
echo "random_bytes" | python entropy_analyzer.py --mode quick
echo "random_bytes" | python entropy_analyzer.py --mode full
```

### ESP32 Firmware

1. Open `hardware/PQHardware.ino` in Arduino IDE
2. Select Board → **ESP32 Dev Module**
3. Upload via USB

### E2E Tests

```bash
npm install
npx playwright test
npx playwright show-report
```

## 🔌 API Endpoints

|  Method  |  Endpoint        |    Description                      |
|----------|------------------|-------------------------------------|
|  `GET`   | `/status`        | System status (source, pool, uptime)|
|  `GET`   | `/health`        | Health check                        |
|  `GET`   |`/entropy?bytes=N`| Retrieve N raw entropy bytes        |
|  `POST`  | `/keygen`        | Generate cryptographic key          |
|  `POST`  | `/encrypt`       | AES-256-GCM file encryption         |
|  `POST`  | `/decrypt`       | AES-256-GCM file decryption         |
|  `POST`  | `/test`          | Run entropy statistical analysis    |
|`GET/POST`| `/settings`      | Get / update backend configuration  |
|  `POST`  | `/reseed`        | Reseed entropy source               |

## 📁 Project Structure

```
PseudoQuantumEntropy/
├── hardware/           # ESP32 firmware (PQHardware.ino)
├── backend/
│   ├── src/
│   │   ├── entropy/    # IEntropySource, Serial, OpenSSL sources
│   │   ├── crypto/     # KeyGenerator, Encryptor, Hasher
│   │   ├── utilities/  # Hex/Base64 helpers
│   │   ├── WebServer   # REST API (cpp-httplib)
│   │   └── main.cpp    # Entry point & graceful shutdown
│   ├── include/        # Header-only libs (httplib.h, json.hpp)
│   └── tests/          # Unit & E2E tests
├── analyzer/           # Python NIST STS analyzer
├── frontend/           # SPA (HTML/CSS/JS + Bootstrap 5)
├── config/             # Runtime JSON configuration
├── scripts/            # Build & run scripts
└── docs/               # Documentation
```

## 🤝 Contributing

Contributions are welcome. Fork the repo, create a feature branch, and open a PR.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE.md) file for details.

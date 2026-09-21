**NOTE: The executable is located at .\build\bin\PseudoQuantumEntropy.exe**

# CONTEXT.md — PseudoQuantum Entropy Service

> **Version:** 1.0
> **Last Updated:** 2026-09-21
> **Source of Truth:** This file is the PRIMARY reference for all development work.

---

## 📋 Project Identity

| Field | Value |
|---|---|
| **Project** | PseudoQuantum Entropy Service |
| **Version** | v1.0  |
| **Type** | Hybrid hardware-software entropy system with cryptographic applications |
| **Repository** | `Intensive-Desire08/PseudoQuantumEntropy` |
| **Languages** | C++17 (backend), C++/Arduino (firmware), Python 3.11+ (analyzer), HTML/CSS/JS (frontend) |
| **Primary Goal** | Modular hardware-backed entropy service for cryptographic key generation and AES-GCM image encryption/decryption |
| **Entropy Source** | Dual-photodiode quantum shot noise (ESP32 Continuous DMA ADC → 4-bit nibble differential extraction → Host C++ Galois LFSR whitening [~14.7 KB/s] or NIST SP 800-90B SHA-256 conditioning [~7.3 KB/s]) |
| **Why "PseudoQuantum"** | Generated entropy contains both quantum-origin shot noise and unavoidable classical noise — not a pure QRNG |

---

## 🎯 Current Status & Milestone

| Metric | Status |
|---|---|
| **Current Stage** | **v1.0 Release** — All core modules implemented and integrated |
| **Backend** | ✅ Fully implemented — builds and runs |
| **Hardware Firmware** | ✅ Complete (`PQHardware/PQHardware.ino`) — continuous DMA sampling @ 921,600 baud |
| **Python Analyzer** | ✅ Complete (quick + full NIST STS modes) |
| **Frontend** | ✅ Complete dark-mode SPA — all pages with dynamic whitening & source switching (22KB custom CSS) |
| **Build System** | ✅ CMake + vcpkg configured and working (`cmake --preset default`) |
| **Tests** | ✅ 4 Playwright E2E test suites in `tests/` |
| **Documentation** | ✅ README.md complete, LICENSE.md added, `docs/report_text.txt` present |
| **Last Successful Run** | 2026-09-21 (Hardware TRNG & OpenSSL fallback mode on port 8080) |

---

## ✅ Completed Features (v1.0)

- [x] Dual-photodiode entropy sampling via continuous DMA ADC & differential noise extraction (ESP32 firmware)
- [x] High-throughput serial protocol at 921,600 baud with `[0xAA][0x55][64B]` framing
- [x] Dual host-side whitening algorithms: 32-bit Galois LFSR (~14.7 KB/s) & NIST SP 800-90B SHA-256 (~7.3 KB/s)
- [x] Runtime source & whitening toggle in Settings UI with live config persistence
- [x] Non-invasive COM queue monitoring (`ClearCommError`) preventing ESP32 auto-reset on button pause
- [x] OpenSSL software fallback entropy source (`RAND_bytes()`) with smooth auto-reconnect
- [x] Abstract entropy interface (`IEntropySource`) with pluggable sources
- [x] Entropy collector with auto-detection (hardware-first, OpenSSL fallback)
- [x] Thread-safe entropy pool with background collection, circular overwrite, and periodic refill
- [x] AES-256-GCM encryption / decryption module
- [x] Cryptographic key generation (256-bit, PBKDF2-SHA256 derivation)
- [x] SHA-256 hashing and integrity verification module
- [x] HTTP REST API server (cpp-httplib) with all planned endpoints
- [x] Python statistical analyzer (Quick: Monobit, Block Frequency, Runs, Byte Distribution)
- [x] Python full NIST STS analysis mode
- [x] Frontend SPA: Home, Encryption, Key Generation, Settings, Entropy Test, How It Works pages
- [x] Configuration system (JSON-based, CLI override, multi-path search)
- [x] Thread-safe logger with file + console output and severity levels
- [x] Helper/utility module (hex/base64 encoding, conversions)
- [x] Graceful shutdown with signal handling (Windows `Ctrl+C` + POSIX `SIGINT/SIGTERM`)
- [x] Cross-platform support (Windows primary, Linux/macOS compatible)
- [x] README.md completed and LICENSE.md added
- [x] Full dark-mode design system with Inter font, glassmorphism panels, and micro-animations (22KB CSS)
- [x] `scripts/` directory (`build.sh`, `run.sh`, `run.bat`)
- [x] Logging configuration (`config/logging_config.json`)
- [x] Playwright E2E test suites (4 spec files)

## 📋 Planned Features (Post-v1.0)

- [ ] Full `docs/` directory (`ARCHITECTURE.md`, `API.md`, `USER_GUIDE.md`)
- [ ] `frontend/assets/` directory (icons, images)
- [ ] Chart.js integration for entropy visualization
- [ ] Extended frontend terminal output display
- [ ] Comprehensive NIST STS tests beyond current set
- [ ] Hardware stress testing and long-duration entropy collection
- [ ] Additional cryptographic applications (file signing, secure password generation)
- [ ] Password-only `.pqe` file encryption format (see design spec below)
- [ ] Unit tests for C++ backend (EntropyPool, crypto modules)

---

## 🧩 Active Modules (with file paths)

### Hardware Layer
| Module | File | Status | Description |
|---|---|---|---|
| ESP32 Firmware | `PQHardware/PQHardware.ino` | ✅ | Continuous DMA ADC sampling, 4-bit differential noise extraction, 66-byte binary packet streaming at 921,600 baud |

### Backend — Entropy Layer
| Module | Files | Status | Description |
|---|---|---|---|
| IEntropySource | `backend/src/entropy/IEntropySource.h` | ✅ | Abstract interface for all entropy providers |
| SerialEntropySource | `backend/src/entropy/SerialEntropySource.cpp/h` | ✅ | ESP32 serial comm via Boost.Asio & Win32 API, `[0xAA][0x55]` framing, Galois LFSR / SHA-256 whitening |
| OpenSSLEntropySource | `backend/src/entropy/OpenSSLEntropySource.cpp/h` | ✅ | Software fallback using `RAND_bytes()` |
| EntropyCollector | `backend/src/EntropyCollector.cpp/h` | ✅ | Source selection, hardware detection, runtime switching, non-resetting pause monitor |
| EntropyPool | `backend/src/EntropyPool.cpp/h` | ✅ | Thread-safe buffer, background collection, sliding-window speed calculation, holdoff reset |

### Backend — Cryptographic Layer
| Module | Files | Status | Description |
|---|---|---|---|
| KeyGenerator | `backend/src/crypto/KeyGenerator.cpp/h` | ✅ | 256-bit keys, PBKDF2-SHA256, salt generation |
| Encryptor | `backend/src/crypto/Encryptor.cpp/h` | ✅ | AES-256-GCM encrypt/decrypt, IV generation, auth tag |
| Hasher | `backend/src/crypto/Hasher.cpp/h` | ✅ | SHA-256 hashing, integrity verification |

### Backend — Infrastructure
| Module | Files | Status | Description |
|---|---|---|---|
| WebServer | `backend/src/WebServer.cpp/h` | ✅ | cpp-httplib HTTP server, REST API, static file serving |
| Config | `backend/src/Config.cpp/h` | ✅ | JSON config load/save, defaults, env overrides |
| Logger | `backend/src/Logger.cpp/h` | ✅ | Thread-safe, timestamped, TRACE→OFF levels |
| Helpers | `backend/src/utilities/Helpers.cpp/h` | ✅ | Hex/Base64 encoding, conversion utilities |
| main.cpp | `backend/src/main.cpp` | ✅ | Entry point, init sequence, main loop, graceful shutdown |

### Python Analyzer
| Module | Files | Status | Description |
|---|---|---|---|
| entropy_analyzer.py | `analyzer/entropy_analyzer.py` | ✅ | CLI entry point, stdin reader, JSON output |
| nist_tests.py | `analyzer/nist_tests.py` | ✅ | Monobit, Block Frequency, Runs, Byte Distribution + Full STS |
| main.py | `analyzer/main.py` | ✅ | Standalone HTTP-based NIST test runner (hits `/test` endpoint) |
| test_results_schema.json | `analyzer/test_results_schema.json` | ✅ | JSON schema for analysis results |

### Frontend
| Module | Files | Status | Description |
|---|---|---|---|
| index.html | `frontend/index.html` | ✅ | SPA shell (834 lines), Inter font, dark-mode design, all 6 pages |
| app.js | `frontend/js/app.js` | ✅ | Navigation, initialization, global state |
| api.js | `frontend/js/api.js` | ✅ | Backend communication, fetch wrapper |
| home.js | `frontend/js/home.js` | ✅ | System status display, telemetry grid, pipeline animation |
| encryption.js | `frontend/js/encryption.js` | ✅ | File upload, encrypt/decrypt UI |
| keygen.js | `frontend/js/keygen.js` | ✅ | Key generation, password-based derivation |
| settings.js | `frontend/js/settings.js` | ✅ | Backend configuration UI (source & whitening selection) |
| test.js | `frontend/js/test.js` | ✅ | NIST entropy analysis test UI with results visualization |
| style.css | `frontend/css/style.css` | ✅ | Complete dark-mode design system (22KB, 1263 lines) — design tokens, glassmorphism, animations |

### E2E Tests
| Module | Files | Status | Description |
|---|---|---|---|
| site-audit.spec.ts | `tests/site-audit.spec.ts` | ✅ | Core site audit — all pages, nav, form elements |
| modern-ui-features.spec.ts | `tests/modern-ui-features.spec.ts` | ✅ | Modern UI feature validation |
| exhaustive-nist.spec.ts | `tests/exhaustive-nist.spec.ts` | ✅ | Exhaustive NIST test suite validation |
| example.spec.ts | `tests/example.spec.ts` | ✅ | Example/template test |

---

## 🔧 Technology Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| **Language (Backend)** | C++17 | MSVC (Windows), GCC/Clang (Linux) |
| **Build System** | CMake 3.16+ | Root `CMakeLists.txt` → `backend/CMakeLists.txt` |
| **Package Manager** | vcpkg | Manifest mode (`vcpkg.json`) |
| **HTTP Server** | cpp-httplib | Header-only (`backend/include/httplib.h`) |
| **JSON** | nlohmann/json | Header-only (`backend/include/json.hpp`) + vcpkg |
| **Serial I/O** | Boost.Asio | vcpkg (`boost-asio`, `boost-system`) |
| **Cryptography** | OpenSSL | vcpkg — AES-GCM, PBKDF2, SHA-256, RAND_bytes |
| **Firmware** | Arduino / ESP32 | `Serial.begin(921600)`, ADC pins 34/35, Continuous DMA mode |
| **Analyzer** | Python 3.11+ | numpy ≥1.26, scipy ≥1.11, matplotlib ≥3.8 |
| **Frontend** | HTML5 / CSS3 / JS | Inter font (Google Fonts), vanilla JS, custom dark-mode design system |
| **E2E Testing** | Playwright (TypeScript) | `^1.62.1` via npm |

---

## 📐 Critical Design Decisions

| Decision | Rationale |
|---|---|
| **"PseudoQuantum" naming** | Honest labeling — shot noise has quantum origin but classical noise cannot be fully eliminated |
| **Dual photodiodes (pins 34, 35)** | Two independent entropy channels reduce correlation bias |
| **4-bit differential noise nibble extraction** | `(val1 ^ val2) & 0x0F` extracts uncorrelated noise from paired DMA ADC readings |
| **66-byte chunked framing `[0xAA][0x55][64B]`** | Robust binary serial framing with dual sync marker and sliding auto-resynchronization |
| **Interface-based entropy abstraction** | `IEntropySource` allows hot-swapping sources without touching consumer code |
| **Auto-detect with hardware-first** | Best entropy when hardware is available, seamless fallback otherwise |
| **OpenSSL as fallback (not stdlib)** | `RAND_bytes()` is cryptographically secure, unlike `std::rand()` |
| **Thread-safe entropy pool** | Decouples slow hardware collection from fast consumer requests |
| **Subprocess for Python analyzer** | Isolation — Python crash cannot kill the backend; JSON stdin/stdout is language-agnostic |
| **cpp-httplib (header-only)** | Zero-dependency HTTP server, easy to embed, HTTPS-capable with OpenSSL |
| **Single-page application (SPA)** | All pages in one `index.html`, hash-based routing, minimal network requests |
| **AES-256-GCM (not CBC)** | Authenticated encryption — provides both confidentiality and integrity |
| **PBKDF2 with 100,000 iterations** | Defense against brute-force key derivation attacks |
| **Config search path cascade** | Executable can run from build dir or project root without config path issues |
| **Dual whitening algorithms** | LFSR (fast, ~14.7 KB/s) for real-time use; SHA-256 (NIST-compliant, ~7.3 KB/s) for standards compliance |

---

## 🔌 Communication Protocols (SPECS)

### Hardware ↔ C++ Backend
| Parameter | Value |
|---|---|
| Medium | Serial (USB) |
| Baud Rate | **921600** (default; step-down fallbacks: 460800, 115200) |
| Protocol | Binary |
| Frame Format | `[0xAA][0x55][64 raw bytes]` (66 bytes per frame) |
| Validation | 2-byte sync marker `[0xAA][0x55]` verification with sliding resync |
| Whitening | Backend 32-bit Galois LFSR (`0x80200003`, taps 32/22/2/1, ~14.7 KB/s) or SHA-256 (NIST SP 800-90B, ~7.3 KB/s) |
| Fallback | Automatic non-invasive switch to OpenSSL if paused or disconnected |
| ESP32 ADC Pins | GPIO 34 (Channel 1, ADC1_CH6), GPIO 35 (Channel 2, ADC1_CH7) in Continuous DMA mode |
| LED Pins | GPIO 4 (Green), GPIO 5 (Red) |

### C++ Backend ↔ Python Analyzer
| Parameter | Value |
|---|---|
| Medium | Subprocess (stdin/stdout pipe) |
| Protocol | JSON |
| Input | Raw entropy bytes via stdin |
| Output | JSON analysis results via stdout |
| CLI Args | `--mode quick|full`, `--bytes N` |
| Modes | Quick (4 tests) / Full (complete NIST STS) |

### C++ Backend ↔ Frontend
| Parameter | Value |
|---|---|
| Medium | HTTP REST API |
| Format | JSON request/response |
| Port | **8080** (configurable via `config/backend_config.json`) |
| Host | `0.0.0.0` (all interfaces) |
| File Upload | `multipart/form-data` |
| Max Upload | 10 MB |
| Frontend Serving | Backend serves static files directly |

### REST API Endpoints
| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/` | `serveStaticFile` | Serve frontend SPA |
| `GET` | `/status` | `handleStatus` | System status (source, pool, uptime) |
| `GET` | `/health` | `handleHealth` | Health check |
| `GET` | `/entropy?bytes=N` | `handleGetEntropy` | Retrieve N entropy bytes |
| `POST` | `/keygen` | `handleKeyGen` | Generate cryptographic key |
| `POST` | `/encrypt` | `handleEncrypt` | AES-GCM encrypt |
| `POST` | `/decrypt` | `handleDecrypt` | AES-GCM decrypt |
| `POST` | `/test` | `handleTest` | Run entropy statistical analysis |
| `GET` | `/settings` | `handleGetSettings` | Get current config |
| `POST` | `/settings` | `handleSettings` | Update config |
| `POST` | `/reseed` | `handleReseed` | Reseed entropy source |

---

## 📁 Active File Structure (with status markers)

```
PseudoQuantumEntropy/
│
├── [✅] .gitignore
├── [✅] CMakeLists.txt                    # Root CMake (delegates to backend/)
├── [✅] CMakePresets.json                 # CMake presets for vcpkg toolchain
├── [✅] vcpkg.json                        # Package manifest (boost-asio, openssl, nlohmann-json)
├── [✅] package.json                      # Node dependencies (Playwright)
├── [✅] tsconfig.json                     # TypeScript config for Playwright
├── [✅] playwright.config.ts              # Playwright configuration
├── [✅] README.md                         # Project documentation
├── [✅] LICENSE.md                        # MIT License
├── [✅] CONTEXT.md                        # THIS FILE
│
├── PQHardware/                            # ESP32 firmware
│   └── [✅] PQHardware.ino                # Dual photodiode, DMA ADC, 4-bit differential extraction
│
├── backend/
│   ├── [✅] CMakeLists.txt                # Backend build config
│   ├── [✅] CMakePresets.json             # Backend-specific CMake presets
│   ├── include/
│   │   ├── [✅] httplib.h                 # cpp-httplib (header-only, ~754KB)
│   │   ├── [✅] json.hpp                  # nlohmann/json (header-only, ~953KB)
│   │   └── [✅] build_config.h.in         # Build metadata template
│   └── src/
│       ├── [✅] main.cpp                  # Entry point (338 lines)
│       ├── [✅] WebServer.cpp/h           # HTTP server + routes
│       ├── [✅] EntropyCollector.cpp/h    # Source selection & validation
│       ├── [✅] EntropyPool.cpp/h         # Thread-safe entropy buffer
│       ├── [✅] Logger.cpp/h              # Thread-safe logging
│       ├── [✅] Config.cpp/h              # Configuration management
│       ├── entropy/
│       │   ├── [✅] IEntropySource.h      # Abstract interface (118 lines)
│       │   ├── [✅] SerialEntropySource.cpp/h  # Hardware serial source
│       │   └── [✅] OpenSSLEntropySource.cpp/h # Software fallback
│       ├── crypto/
│       │   ├── [✅] KeyGenerator.cpp/h    # 256-bit key generation
│       │   ├── [✅] Encryptor.cpp/h       # AES-256-GCM encrypt/decrypt
│       │   └── [✅] Hasher.cpp/h          # SHA-256 hashing
│       └── utilities/
│           └── [✅] Helpers.cpp/h         # Hex, Base64, conversions
│
├── analyzer/
│   ├── [✅] entropy_analyzer.py           # CLI analyzer entry point
│   ├── [✅] nist_tests.py                 # Statistical test implementations
│   ├── [✅] main.py                       # Standalone HTTP NIST test runner
│   ├── [✅] requirements.txt              # numpy, scipy, matplotlib
│   └── [✅] test_results_schema.json      # JSON output schema
│
├── frontend/
│   ├── [✅] index.html                    # SPA shell (834 lines, Inter font, dark-mode)
│   ├── css/
│   │   └── [✅] style.css                 # Complete dark-mode design system (22KB, 1263 lines)
│   └── js/
│       ├── [✅] app.js                    # Navigation & init
│       ├── [✅] api.js                    # Backend API client
│       ├── [✅] home.js                   # System status page with pipeline animation
│       ├── [✅] encryption.js             # Encrypt/decrypt page
│       ├── [✅] keygen.js                 # Key generation page
│       ├── [✅] settings.js               # Settings page (source & whitening selection)
│       └── [✅] test.js                   # NIST entropy analysis page with results viz
│
├── config/
│   ├── [✅] backend_config.json           # Runtime config (serial, entropy, http, crypto)
│   └── [✅] logging_config.json           # Logging configuration
│
├── tests/                                 # Playwright E2E test suites
│   ├── [✅] site-audit.spec.ts            # Core site audit tests
│   ├── [✅] modern-ui-features.spec.ts    # Modern UI feature tests
│   ├── [✅] exhaustive-nist.spec.ts       # Exhaustive NIST validation tests
│   └── [✅] example.spec.ts              # Example/template test
│
├── logs/
│   └── [✅] backend.log                   # Runtime logs
│
├── docs/
│   └── [✅] report_text.txt               # Technical report / architecture spec
│
├── scripts/
│   ├── [✅] build.sh                      # CMake build script
│   ├── [✅] run.sh                        # Run script for Linux/macOS
│   └── [✅] run.bat                       # Run script for Windows
│
├── screenshots/                           # UI screenshots (used in README.md)
│   ├── [✅] home-page.png
│   ├── [✅] encryption-page.png
│   ├── [✅] keygen-page.png
│   ├── [✅] entropy-test-page.png
│   ├── [✅] settings-page.png
│   ├── [✅] modern-generator-completed.png
│   ├── [✅] modern-how-it-works.png
│   ├── [✅] modern-nist-analysis.png
│   ├── [✅] modern-settings.png
│   └── [✅] exhaustive-nist-results.png
│
├── scratch/                               # Temporary workspace files (ignored by git)
└── build/                                 # CMake build output (auto-generated)
```

### Discrepancies: Report vs. Actual Codebase

| Item | Report Spec | Actual Codebase | Notes |
|---|---|---|---|
| `docs/` directory | Full docs (`ARCHITECTURE.md`, `API.md`, etc.) | Only `report_text.txt` present | Structured docs not yet created |
| `frontend/assets/` | Listed in spec | ❌ Missing | No icon or image assets present |
| Hardware directory name | `hardware/` in original spec | `PQHardware/` | Renamed; CONTEXT.md and README now reflect this |
| Chart.js integration | Listed in spec | ❌ Not implemented | No charting library present |

---

## 🔧 Key Configuration Values

```jsonc
// config/backend_config.json
{
  "serial": {
    "port": "COM3",
    "baud_rate": 921600,
    "timeout_ms": 5000
  },
  "entropy": {
    "source": "hardware",             // "hardware" | "openssl" | "auto"
    "whitening": "lfsr",              // "lfsr" (~14.7 KB/s) | "sha256" (~7.3 KB/s)
    "pool_buffer_size": 8192,
    "pool_refill_threshold": 4096
  },
  "http": {
    "port": 8080
  },
  "crypto": {
    "key_size": 256,
    "salt_size": 32,
    "iterations": 100000              // PBKDF2 iterations
  },
  "analysis": {
    "test_mode": "quick",             // "quick" | "full"
    "test_size": 1024
  },
  "server": {
    "frontend_path": "./frontend",
    "max_upload_size": 10485760       // 10 MB
  }
}
```

---

## 🚀 Quick Development Commands

```bash
# === BUILD (from project root) ===
# Configure with vcpkg (first time)
cmake --preset=default

# Build
cmake --build build --config Release

# === RUN ===
# From build output directory:
./build/bin/PseudoQuantumEntropy.exe

# With custom config:
./build/bin/PseudoQuantumEntropy.exe path/to/config.json

# === PYTHON ANALYZER (standalone test) ===
cd analyzer
pip install -r requirements.txt
echo "random_bytes_here" | python entropy_analyzer.py --mode quick
echo "random_bytes_here" | python entropy_analyzer.py --mode full

# === PYTHON ANALYZER (HTTP, requires running backend) ===
python analyzer/main.py

# === FRONTEND (direct access) ===
# Open http://localhost:8080 after starting the backend
# Backend serves frontend files automatically

# === E2E TESTING (Playwright) ===
# Make sure the backend is running first!
npx playwright test
npx playwright show-report

# === FIRMWARE ===
# Open PQHardware/PQHardware.ino in Arduino IDE
# Select Board: ESP32 Dev Module
# Upload via USB at 921600 baud
```

### ⚡ Hardware Serial Protocol & Baud Rate Guide

- **Current Default Baud Rate**: `921600` (set in `PQHardware.ino`, `config/backend_config.json`, and `SerialEntropySource.h`).
- **Framing Protocol**: 66-byte chunked packet with 2-byte sync header: `[0xAA][0x55][64 raw bytes]`.
- **Sampling Method (Continuous DMA Mode)**:
  - Uses ESP32 Hardware SAR ADC1 in **Continuous DMA Mode** (`esp_adc/adc_continuous.h` in Arduino ESP32 Core 3.x / ESP-IDF v5).
  - Background DMA sampling rate: **60,000 Hz (60 kHz)** on GPIO 34 (ADC1_CH6) and GPIO 35 (ADC1_CH7).
  - Zero CPU polling overhead: ADC conversions write directly into DMA memory buffers in RAM.
  - CPU extracts 4-bit differential noise nibbles (`(val1 ^ val2) & 0x0F`) from DMA buffers and transmits 64-byte payload frames over Serial at 921,600 baud.
  - Expected throughput: **~30–60 KB/s** (saturating the serial line well above the 12 KB/s minimum threshold).
  - Whitening and debiasing performed on backend via 32-bit Galois LFSR (`0x80200003`, taps 32/22/2/1) or SHA-256 block extraction.

#### ⚠️ Hardware Baud Rate Troubleshooting:
If the ESP32 fails to communicate, reports frequent desyncs/timeouts, or drops bytes:
1. **Low-Quality USB Micro Cables / Unpowered Hubs**: Some cheap USB Micro cables or unpowered USB hubs experience signal reflection and bit errors above 500,000 baud.
2. **Step-Down Options**: If you experience framing/sync issues, step down the baud rate in **both** files to match:
   - **460800 baud** (recommended intermediate step):
     - In `PQHardware.ino`: `Serial.begin(460800);`
     - In `config/backend_config.json`: `"baud_rate": 460800`
   - **115200 baud** (fail-safe baseline):
     - In `PQHardware.ino`: `Serial.begin(115200);`
     - In `config/backend_config.json`: `"baud_rate": 115200`

---

## 📝 Recent Changes Log

| Date | Change | Details |
|---|---|---|
| 2026-09-21 | **v1.0 CONTEXT.md Overhaul** | Complete rewrite of CONTEXT.md fixing 44 inconsistencies: version standardized to v1.0 across all files (CMakeLists.txt, vcpkg.json, WebServer.h, package.json), hardware directory corrected to `PQHardware/`, test locations fixed to root `tests/` with 4 Playwright specs, style.css/index.html stats corrected, LFSR polynomial corrected to `0x80200003`, Playwright version updated to `^1.62.1`, firmware baud/protocol references unified. Also fixed README.md architecture diagram, SerialEntropySource.h stale docstring, and package.json metadata. |
| 2026-09-21 | Dynamic UI Text (LFSR vs SHA-256) & How It Works Docs | Updated frontend (`index.html` & `home.js`) to dynamically update the Home page subtitle and Stage 04 pipeline card (`Backend LFSR Whitening` vs. `Backend SHA-256 Whitening`, with algorithm-specific descriptions and standby detail tags) based on active `/status` telemetry. Expanded the "How It Works" (`#about`) Algorithmic Layer documentation to describe both 32-bit Galois LFSR (~14.7 KB/s) and SHA-256 (NIST SP 800-90B, ~7.3 KB/s) side by side. Verified `config/backend_config.json` defaults to `"source": "hardware"` and `"whitening": "lfsr"`. |
| 2026-09-21 | Bugfix: Fallback System State & OpenSSL Speed Freeze | Fixed JavaScript Temporal Dead Zone `ReferenceError` where `currentBytes` was accessed on source change before its `const` initialization in `home.js`. System state metric now accurately displays `Active` (green) for hardware, `Fallback` (yellow) for OpenSSL fallback, and `Disconnected` for network failure. Added adaptive speed unit formatting (`MB/s` for OpenSSL, `KB/s` for hardware). |
| 2026-09-21 | Settings Screen: Dynamic Whitening & Source Selection | Added UI dropdowns in Settings (`#settings`) and backend REST endpoints (`GET/POST /settings`) for runtime selection of Whitening Algorithm (32-bit Galois LFSR @ ~14.7 KB/s vs. SHA-256 Block Extraction @ ~7.3 KB/s) and Entropy Source Provider (Hardware ESP32 TRNG vs. OpenSSL Software Fallback). Settings persist to `config/backend_config.json`. Live pipeline animation on Home dynamically displays LFSR or SHA-256 conditioning based on active state. |
| 2026-09-21 | Dual Whitening Selection (LFSR & SHA-256) | Implemented both 32-bit Galois LFSR polynomial XOR (`whitenPayloadLFSR`, 1:1 ratio, ~14.7 KB/s) and NIST SP 800-90B SHA-256 block extraction (`whitenPayloadSHA256`, 2:1 ratio, ~7.3 KB/s) as separate functions in `SerialEntropySource`. Provided `WhiteningAlgorithm` enum flag with getter/setter. Defaulted/hardcoded to `WhiteningAlgorithm::LFSR` so hardware throughput stays above the Gateway continuous encryption threshold (12 KB/s minimum). |
| 2026-09-21 | Hardware Sampling Speedup & DMA Implementation | Solved the 3 KB/s bottleneck caused by Arduino's `analogRead()` (~45 µs per call). Updated `PQHardware.ino` to use ESP-IDF Continuous DMA ADC mode with `adc_continuous_read()`, yielding ~30–60 KB/s continuous throughput via background hardware sampling. |
| 2026-09-21 | Speed Accuracy & Switch Reset Holdoff | Replaced instantaneous microsecond batch timing with a 1-second sliding window for real continuous hardware speed (~25–50 KB/s). Implemented a 1-second reset holdoff in `EntropyPool::resetSpeed()` so switching between sources cleanly renders `0.0 KB/s` before ramping up. |
| 2026-09-21 | Fix ESP32 Auto-Restart on Pause | Resolved the issue where the ESP32 automatically restarted 2 seconds after pausing via the button. Backend now keeps the COM port open while paused, using `ClearCommError` / `hasIncomingData()` to monitor `cbInQue` with zero port toggles or resets. |
| 2026-09-21 | Live Speed & Button Pause Fallback Fix | Replaced collection freeze when pool is full with circular FIFO overwrite in `EntropyPool::addBytes()`. Added 1200ms silence detection to `SerialEntropySource::isAvailable()` and disabled Windows DTR/RTS auto-reset during COM port probes. |
| 2026-09-21 | Fix Hardware/OpenSSL Flapping & Ping-Pong | Resolved rapid switching between hardware and OpenSSL. Removed false idle timeout in `isAvailable()`, slowed `sourceMonitorLoop` check to 1 second with 2-second hysteresis, increased probe timeout to 1500ms. |
| 2026-09-21 | Git Ignore Cleanup & Scratch Directory Usage | Updated `.gitignore` to ignore `.cache/`, `.playwright-mcp/`, Playwright test caches/reports, and `scratch/` folder. |
| 2026-09-21 | 921600 Baud & 64B Chunk Protocol | Upgraded serial baud rate to 921,600 and implemented 66-byte chunked framing `[0xAA][0x55][64B payload]` with sliding auto-resynchronization. |
| 2026-09-21 | High-Throughput Buffered Serial & Non-Blocking Pool | Added 2KB internal `rxBuffer` to `SerialEntropySource` to batch OS serial reads. Decoupled `EntropyPool::collectEntropy()` from the pool mutex. |
| 2026-09-21 | Backend LFSR Whitening Offload | Moved 32-bit Galois LFSR whitening from ESP32 firmware to backend (`SerialEntropySource`). ESP32 now streams raw sampled bytes directly. |
| 2026-09-21 | Dynamic Hardware Fallback Fix | Fixed dynamic switching and speed freeze on ESP32 disconnect. Active ClearCommError health check in `SerialEntropySource::isAvailable()`. |
| 2026-09-20 | Encryption UX plan | Designed password-only `.pqe` file format — salt+IV+tag embedded in file header; frontend shows internals for transparency |
| 2026-08-28 | README & License | Completed README.md and added MIT License |
| 2026-08-27 | Playwright E2E Tests | Initialized Playwright, added test suites |
| 2026-08-26 | `CONTEXT.md` created | First version, full project audit |
| 2026-08-22 | Backend first run | Confirmed working — OpenSSL mode, port 8080 |
| — | All core modules completed | Backend, firmware, analyzer, frontend SPA |

---

## 🔮 Immediate Next Steps (Priority Order)

### 🔐 [NEXT — TOP PRIORITY] Password-Only File Encryption UX

**Goal:** Make encryption and decryption feel seamless — the user only needs a password. The frontend still surfaces internal cryptographic details (IV, Tag, Key) for educational transparency, but they are no longer *required inputs*.

#### Design

- **Encrypt flow:**
  1. User selects a file and enters a password.
  2. Backend internally generates a random **salt** (32 bytes) and a random **IV** (12 bytes).
  3. `PBKDF2-HMAC-SHA256(password, salt, 100 000 iterations)` → 32-byte AES key.
  4. `AES-256-GCM(plaintext, key, IV)` → ciphertext + 16-byte authentication tag.
  5. A `.pqe` (PseudoQuantum Encrypted) file is assembled with the layout:
     `[salt (32B) | IV (12B) | Tag (16B) | ciphertext]`
  6. The frontend displays the derived **Key**, **IV**, and **Tag** as hex strings for educational visibility.
  7. The assembled `.pqe` file is offered as a download — **this is the only thing the user keeps**.

- **Decrypt flow:**
  1. User uploads the `.pqe` file and enters the same password.
  2. Backend reads the header: extracts salt (bytes 0–31), IV (bytes 32–43), Tag (bytes 44–59), ciphertext (bytes 60+).
  3. Re-derives the key: `PBKDF2-HMAC-SHA256(password, salt, 100 000 iterations)`.
  4. `AES-256-GCM-Decrypt(ciphertext, key, IV, tag)` → plaintext (or error if tag mismatch).
  5. Frontend displays the derived **Key**, **IV**, and **Tag** as hex for transparency.
  6. Decrypted file is offered as a download.

#### What stays the same
- The **"Password → Key" tab** on the Key Generation page remains as-is — it is an educational demo.
- The frontend **Encryption page** continues to show the IV, Tag, and Key after each operation.
- The backend `KeyGenerator` and `Encryptor` classes are **not changed** — the new logic lives in the `/encrypt` and `/decrypt` API handlers in `WebServer.cpp`.

#### API changes needed
| Endpoint | Before | After |
|---|---|---|
| `POST /encrypt` | Accepts raw key + IV + plaintext | Accepts password + file; returns `.pqe` file |
| `POST /decrypt` | Accepts raw key + IV + tag + ciphertext | Accepts password + `.pqe` file; returns original file |

#### Files to modify
- `backend/src/WebServer.cpp` — Update `/encrypt` and `/decrypt` handlers to implement the self-contained `.pqe` format.
- `frontend/js/encryption.js` — Update UI to accept password input instead of raw key/IV, display derived internals as read-only info.
- `frontend/index.html` — Update encryption page form fields accordingly.

---

1. **[NEXT]** Implement password-only encryption UX with `.pqe` self-contained file format (see plan above).
2. **Write unit tests** — Add C++ unit tests for EntropyPool and crypto modules (consider Catch2 or doctest via vcpkg).
3. **Create structured docs** — Write `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/USER_GUIDE.md`.
4. **Test hardware integration** — Verify ESP32 serial communication end-to-end with actual hardware.

---

## 🎓 Academic Standard / Pre-Beta Checklist

Based on the repository audit, the following deliverables are required to bring the repository to a production-ready academic standard:

### 1. README & Documentation
- [x] **README.md** — Complete with architecture diagram, screenshots, build instructions
- [ ] **System Architecture Diagram**: Add Mermaid/ASCII flow chart showing the data pipeline (`Hardware Harvester` -> `SerialEntropySource` -> `EntropyPool` -> `Crypto / WebServer` -> `NIST Analyzer`).
- [ ] **Hardware Schematic & Pinout**: Document circuit setup (photodiodes, analog pins, pull-ups, power).
- [ ] **Mathematical / Entropy Model**: Explain differential extraction, SHA-256 whitening, pool mixing.
- [ ] **NIST SP 800-22 Test Results**: Add markdown summary table displaying p-values and pass/fail statuses.
- [ ] **Restructure `docs/`**: Convert `docs/report_text.txt` to `docs/technical_report.md` and format it properly.
- [ ] **API Reference**: Document REST endpoints in `docs/api_reference.md`.

### 2. Licensing & Third-Party Attributions
- [ ] **Third-Party Notices**: Append attributions for `httplib.h` (Yuji Hirose) and `json.hpp` (Niels Lohmann) to `LICENSE.md` or `README.md`.

### 3. C++ Backend Unit Testing
- [ ] **Unit Tests**: Add a `tests/backend/` directory utilizing Catch2, GoogleTest, or doctest (via `vcpkg`).
- [ ] **Core Primitives Tests**: Write tests for `EntropyPool` thread synchronization, hashing/whitening output correctness, and `Config` parsing.

### 4. GitHub Actions CI/CD Pipeline
- [ ] **CI Pipeline**: Create `.github/workflows/ci.yml`.
- [ ] **Automated Builds**: Build backend on Ubuntu and Windows runners using `CMakePresets.json`.
- [ ] **Automated Tests**: Run `analyzer/nist_tests.py` against mock generated entropy on every push.

### 5. Hardware Documentation Assets
- [ ] **Schematic Diagram**: Place a circuit diagram or breadboard render (`PQHardware/schematic.png` or Fritzing layout) inside `PQHardware/`.
- [ ] **Hardware README**: Add `PQHardware/README.md` specifying supported boards and flashing instructions.

---

## 🔄 How to Keep CONTEXT.md Updated

### When to Update
- After completing any module or feature
- After adding/removing/renaming files
- After changing configuration values or protocols
- After major refactoring or architecture changes
- At the start of each new development session (review & update status)

### What to Update
1. **Status markers** — Change `[📋]` → `[🔄]` → `[✅]` as work progresses
2. **Active Modules table** — Add new modules, update status column
3. **Recent Changes Log** — Add dated entries for significant changes
4. **Immediate Next Steps** — Reprioritize after each completed task
5. **Discrepancies table** — Remove resolved items, add new ones
6. **Version & Date** — Update header on every edit

### How to Version
```markdown
> **Version:** 1.X  ← increment minor on each update
> **Last Updated:** YYYY-MM-DD  ← always today's date
```

### Golden Rule
> **This file is the single source of truth.** Before starting any work, read CONTEXT.md. After finishing any work, update CONTEXT.md. Every developer, AI assistant, or collaborator should consult this document first.

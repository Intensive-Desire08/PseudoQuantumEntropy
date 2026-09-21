**NOTE: The executable is located at .\build\bin\PseudoQuantumEntropy.exe**\n\n# CONTEXT.md — PseudoQuantum Entropy Service

> **Version:** 0.2 alpha build
> **Last Updated:** 2026-09-20
> **Source of Truth:** This file is the PRIMARY reference for all development work.

---

## 📋 Project Identity

| Field | Value |
|---|---|
| **Project** | PseudoQuantum Entropy Service |
| **Version** | v0.2.alpha.build.01  |
| **Type** | Hybrid hardware-software entropy system with cryptographic applications |
| **Repository** | `Intensive-Desire08/PseudoQuantumEntropy` |
| **Languages** | C++17 (backend), C++/Arduino (firmware), Python 3.11+ (analyzer), HTML/CSS/JS (frontend) |
| **Primary Goal** | Modular hardware-backed entropy service for cryptographic key generation and AES-GCM image encryption/decryption |
| **Entropy Source** | Dual-photodiode shot noise (ESP32 ADC → LSB extraction → Von Neumann whitening) |
| **Why "PseudoQuantum"** | Generated entropy contains both quantum-origin shot noise and unavoidable classical noise — not a pure QRNG |

---

## 🎯 Current Status & Milestone

| Metric | Status |
|---|---|
| **Current Stage** | **Integration & Polish** — All core modules implemented |
| **Backend** | ✅ Fully implemented — builds and runs (confirmed via logs) |
| **Hardware Firmware** | ✅ Complete (`PQTHardware.ino`) |
| **Python Analyzer** | ✅ Complete (quick + full NIST STS modes) |
| **Frontend** | ✅ Functional SPA — all pages present |
| **Build System** | ✅ CMake + vcpkg configured and working |
| **Tests** | ⚠️ Skeleton only (`test_1.cpp` is empty) |
| **Documentation** | ⚠️ Minimal — `README.md` is placeholder, no `docs/` directory |
| **Last Successful Run** | 2026-08-22 (OpenSSL fallback mode on port 8080) |

---

## ✅ Completed Features (v1.0)

- [x] Dual-photodiode entropy sampling with Von Neumann whitening (ESP32 firmware)
- [x] Serial entropy source with sync marker `0xAA` protocol
- [x] OpenSSL software fallback entropy source (`RAND_bytes()`)
- [x] Abstract entropy interface (`IEntropySource`) with pluggable sources
- [x] Entropy collector with auto-detection (hardware-first, OpenSSL fallback)
- [x] Thread-safe entropy pool with background collection and periodic refill
- [x] AES-256-GCM encryption / decryption module
- [x] Cryptographic key generation (256-bit, PBKDF2-SHA256 derivation)
- [x] SHA-256 hashing and integrity verification module
- [x] HTTP REST API server (cpp-httplib) with all planned endpoints
- [x] Python statistical analyzer (Quick: Monobit, Block Frequency, Runs, Byte Distribution)
- [x] Python full NIST STS analysis mode
- [x] Frontend SPA: Home, Encryption, Key Generation, Settings, Entropy Test pages
- [x] Configuration system (JSON-based, CLI override, multi-path search)
- [x] Thread-safe logger with file + console output and severity levels
- [x] Helper/utility module (hex/base64 encoding, conversions)
- [x] Graceful shutdown with signal handling (Windows `Ctrl+C` + POSIX `SIGINT/SIGTERM`)
- [x] Cross-platform support (Windows primary, Linux/macOS compatible)
- [x] README.md completed and LICENSE.md added

## 🔄 In-Progress Features

- [ ] **Unit / Integration Tests** — `backend/tests/test_1.cpp` exists but is empty
- [ ] **Frontend styling** — Minimal custom CSS (`style.css` is 789 bytes), relies heavily on Bootstrap defaults

## 📋 Planned Features (Post-v1.0)

- [ ] Full `docs/` directory (`ARCHITECTURE.md`, `API.md`, `USER_GUIDE.md`)
- [x] `scripts/` directory (`build.sh`, `run.sh`, `run.bat`)
- [ ] `config/logging_config.json` (separate logging config)
- [ ] `frontend/assets/` directory (icons, images)
- [ ] Chart.js integration for entropy visualization
- [ ] Dark/Light theme toggle (CSS infra is not present yet)
- [ ] Extended frontend terminal output display
- [ ] Comprehensive NIST STS tests beyond current set
- [ ] Hardware stress testing and long-duration entropy collection
- [ ] Additional cryptographic applications (file signing, secure password generation)

---

## 🧩 Active Modules (with file paths)

### Hardware Layer
| Module | File | Status | Description |
|---|---|---|---|
| ESP32 Firmware | `hardware/PQHardware.ino` | ✅ | Dual photodiode, LSB extraction, Von Neumann whitening, serial output |

### Backend — Entropy Layer
| Module | Files | Status | Description |
|---|---|---|---|
| IEntropySource | `backend/src/entropy/IEntropySource.h` | ✅ | Abstract interface for all entropy providers |
| SerialEntropySource | `backend/src/entropy/SerialEntropySource.cpp/h` | ✅ | ESP32 serial comm via Boost.Asio, sync marker parsing |
| OpenSSLEntropySource | `backend/src/entropy/OpenSSLEntropySource.cpp/h` | ✅ | Software fallback using `RAND_bytes()` |
| EntropyCollector | `backend/src/EntropyCollector.cpp/h` | ✅ | Source selection, hardware detection, validation |
| EntropyPool | `backend/src/EntropyPool.cpp/h` | ✅ | Thread-safe buffer, background collection, periodic refill |

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
| test_results_schema.json | `analyzer/test_results_schema.json` | ✅ | JSON schema for analysis results |

### Frontend
| Module | Files | Status | Description |
|---|---|---|---|
| index.html | `frontend/index.html` | ✅ | SPA shell with Bootstrap 5.3.3, all pages |
| app.js | `frontend/js/app.js` | ✅ | Navigation, initialization, global state |
| api.js | `frontend/js/api.js` | ✅ | Backend communication, fetch wrapper |
| home.js | `frontend/js/home.js` | ✅ | System status display |
| encryption.js | `frontend/js/encryption.js` | ✅ | File upload, encrypt/decrypt UI |
| keygen.js | `frontend/js/keygen.js` | ✅ | Key generation, password-based derivation |
| settings.js | `frontend/js/settings.js` | ✅ | Backend configuration UI |
| test.js | `frontend/js/test.js` | ✅ | Entropy analysis test UI (extra — not in original spec) |
| style.css | `frontend/css/style.css` | 🔄 | Minimal — needs expansion for themes and custom styling |

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
| **Firmware** | Arduino / ESP32 | `Serial.begin(115200)`, ADC pins 34/35 |
| **Analyzer** | Python 3.11+ | numpy ≥1.26, scipy ≥1.11, matplotlib ≥3.8 |
| **Frontend** | HTML5 / CSS3 / JS | Bootstrap 5.3.3 (CDN), vanilla JS |
| **E2E Testing** | Playwright (TypeScript) | **v1.40.0** (Pinned to bypass subagent driver download errors) |

---

## 📐 Critical Design Decisions

| Decision | Rationale |
|---|---|
| **"PseudoQuantum" naming** | Honest labeling — shot noise has quantum origin but classical noise cannot be fully eliminated |
| **Dual photodiodes (pins 34, 35)** | Two independent entropy channels reduce correlation bias |
| **Von Neumann whitening in firmware** | Removes bias at the source before serial transmission — the most critical debiasing step |
| **Sync marker protocol `[0xAA][byte]`** | Simple, robust framing for binary serial data at high baud rates |
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
| **Playwright Version Pinning** | Pinned to `v1.40.0` since newer driver versions occasionally cause 404 download errors during automated AI subagent runs |

---

## 🔌 Communication Protocols (SPECS)

### Hardware ↔ C++ Backend
| Parameter | Value |
|---|---|
| Medium | Serial (USB) |
| Baud Rate | **115200** |
| Protocol | Binary |
| Frame Format | `[0xAA][Random Byte]` (2 bytes per frame) |
| Validation | Sync marker `0xAA` verification before accepting data byte |
| Fallback | Automatic switch to OpenSSL if hardware not detected |
| ESP32 ADC Pins | GPIO 34 (Channel 1), GPIO 35 (Channel 2) |
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
├── [✅] playwright.config.ts              # Playwright configuration
├── [✅] README.md                         # Project documentation
├── [✅] LICENSE.md                        # MIT License
├── [✅] CONTEXT.md                        # THIS FILE
│
├── hardware/                              # ESP32 firmware
│   └── [✅] PQHardware.ino                # Dual photodiode, LSB extraction, Von Neumann whitening
│
├── backend/
│   ├── [✅] CMakeLists.txt                # Backend build config (260 lines, full)
│   ├── [✅] CMakePresets.json
│   ├── include/
│   │   ├── [✅] httplib.h                 # cpp-httplib (header-only, 754KB)
│   │   ├── [✅] json.hpp                  # nlohmann/json (header-only, 953KB)
│   │   └── [✅] build_config.h.in         # Build metadata template
│   ├── src/
│   │   ├── [✅] main.cpp                  # Entry point (322 lines)
│   │   ├── [✅] WebServer.cpp/h           # HTTP server + routes (832 + 272 lines)
│   │   ├── [✅] EntropyCollector.cpp/h    # Source selection & validation
│   │   ├── [✅] EntropyPool.cpp/h         # Thread-safe entropy buffer
│   │   ├── [✅] Logger.cpp/h              # Thread-safe logging
│   │   ├── [✅] Config.cpp/h              # Configuration management
│   │   ├── entropy/
│   │   │   ├── [✅] IEntropySource.h      # Abstract interface (118 lines)
│   │   │   ├── [✅] SerialEntropySource.cpp/h  # Hardware serial source
│   │   │   └── [✅] OpenSSLEntropySource.cpp/h # Software fallback
│   │   ├── crypto/
│   │   │   ├── [✅] KeyGenerator.cpp/h    # 256-bit key generation
│   │   │   ├── [✅] Encryptor.cpp/h       # AES-256-GCM encrypt/decrypt
│   │   │   └── [✅] Hasher.cpp/h          # SHA-256 hashing
│   └── utilities/
│   │       └── [✅] Helpers.cpp/h         # Hex, Base64, conversions
│   └── tests/
│       ├── [🔄] test_1.cpp               # EMPTY — backend C++ tests not written yet
│       └── [✅] site-audit.spec.ts       # Playwright E2E site audit test suite
│
├── analyzer/
│   ├── [✅] entropy_analyzer.py           # CLI analyzer entry point
│   ├── [✅] nist_tests.py                 # Statistical test implementations (260 lines)
│   ├── [✅] requirements.txt              # numpy, scipy, matplotlib
│   └── [✅] test_results_schema.json      # JSON output schema
│
├── frontend/
│   ├── [✅] index.html                    # SPA shell (192 lines, Bootstrap 5.3.3)
│   ├── css/
│   │   └── [🔄] style.css                # Minimal (789 bytes) — needs expansion
│   └── js/
│       ├── [✅] app.js                    # Navigation & init
│       ├── [✅] api.js                    # Backend API client
│       ├── [✅] home.js                   # System status page
│       ├── [✅] encryption.js             # Encrypt/decrypt page
│       ├── [✅] keygen.js                 # Key generation page
│       ├── [✅] settings.js               # Settings page
│       └── [✅] test.js                   # Entropy test page (bonus — not in original spec)
│
├── config/
│   ├── [✅] backend_config.json           # Runtime config (serial, entropy, http, crypto)
│   └── [✅] logging_config.json           # Logging configuration
│
├── logs/
│   └── [✅] backend.log                   # Runtime logs (active, 123 lines)
│
├── build/                                 # CMake build output (auto-generated)
│
├── scripts/
│   ├── [✅] build.sh                      # CMake build script
│   ├── [✅] run.sh                        # Run script for Linux/macOS
│   └── [✅] run.bat                       # Run script for Windows
├── scratch/                               # Temporary workspace files (build logs, scratchpads, ignored by git)
├── [📋] docs/                             # NOT CREATED — planned (ARCHITECTURE.md, API.md, etc.)
└── [📋] frontend/assets/                  # NOT CREATED — planned
```

### Discrepancies: Report vs. Actual Codebase

| Item | Report Spec | Actual Codebase | Notes |
|---|---|---|---|
| `docs/` directory | Listed | ❌ Missing | `README.md`, `ARCHITECTURE.md`, `API.md`, `USER_GUIDE.md` not created |
| `frontend/assets/` | Listed | ❌ Missing | No icon or image assets present |
| `frontend/js/test.js` | Not in spec | ✅ Present | Bonus file — entropy test page JS |
| `frontend/#test` page | Not in spec | ✅ Present | Added as 5th nav item in `index.html` |
| `.venv/` | Not listed | Present | Python virtual environment for analyzer |
| `build_config.h.in` | Not in spec | ✅ Present | Auto-generates `build_config.h` with version/platform info |

---

## 🔧 Key Configuration Values

```jsonc
// config/backend_config.json
{
  "serial.port": "COM3",
  "serial.baud_rate": 115200,
  "serial.timeout_ms": 5000,
  "entropy.source": "auto",           // "auto" | "hardware" | "openssl"
  "entropy.pool_buffer_size": 4096,
  "entropy.pool_refill_threshold": 2048,
  "http.port": 8080,
  "analysis.test_mode": "quick",      // "quick" | "full"
  "analysis.test_size": 1024,
  "server.frontend_path": "./frontend",
  "server.max_upload_size": 10485760, // 10 MB
  "crypto.key_size": 256,
  "crypto.salt_size": 32,
  "crypto.iterations": 100000         // PBKDF2 iterations
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
./build/bin/Release/PseudoQuantumEntropy.exe

# With custom config:
./build/bin/Release/PseudoQuantumEntropy.exe path/to/config.json

# === PYTHON ANALYZER (standalone test) ===
cd analyzer
pip install -r requirements.txt
echo "random_bytes_here" | python entropy_analyzer.py --mode quick
echo "random_bytes_here" | python entropy_analyzer.py --mode full

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
- **Sampling Method**: 2-bit dual-ADC XOR extraction (`((val1 ^ val2) & 0x03)` looped 4 times per byte).

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
| 2026-09-21 | Live Speed & Button Pause Fallback Fix | Fixed frozen collection speed and hardware button pause detection. Replaced collection freeze when pool is full with circular FIFO overwrite in `EntropyPool::addBytes()`, continuously refreshing the pool with the newest quantum entropy. Kept hardware collection active outside the pool mutex to stream live speed readings. Added 1200ms silence detection to `SerialEntropySource::isAvailable()` and disabled Windows DTR/RTS auto-reset during COM port probes. Enabled single-tick fallback to OpenSSL in `sourceMonitorLoop` when the ESP32 pause button (GPIO 25) stops transmission, with smooth auto-recovery upon unpause. |
| 2026-09-21 | Fix Hardware/OpenSSL Flapping & Ping-Pong | Resolved rapid switching between hardware and OpenSSL. Removed false idle timeout in `isAvailable()`, slowed `sourceMonitorLoop` check to 1 second with 2-second hysteresis, increased probe timeout to 1500ms to allow ESP32 bootloader recovery, removed redundant discarded `trash` reads in `EntropyPool`, and expanded ESP32 TX buffer to 512 bytes (`setTxBufferSize`). |
| 2026-09-21 | Git Ignore Cleanup & Scratch Directory Usage | Updated `.gitignore` to ignore `.cache/`, `.playwright-mcp/`, Playwright test caches/reports, and `scratch/` folder. Retained `Temp.txt` for notes. Untracked and deleted cached playwright logs and build errors from git index; moved `build_error.txt` into `scratch/`. Documented `scratch/` usage for temporary agent/build outputs. |
| 2026-09-21 | 921600 Baud & 64B Chunk Protocol | Upgraded serial baud rate to 921,600 and switched firmware to 2-bit ADC extraction. Implemented 66-byte chunked framing `[0xAA][0x55][64B payload]` with sliding auto-resynchronization. Added baud rate troubleshooting guide to CONTEXT.md. |
| 2026-09-21 | High-Throughput Buffered Serial & Non-Blocking Pool | Added 2KB internal `rxBuffer` to `SerialEntropySource` to batch OS serial reads (eliminating 99% of async Boost/Windows syscall overhead). Decoupled `EntropyPool::collectEntropy()` from the pool mutex so consumers are never blocked while the background thread fetches entropy. Audited hardware throughput and Gateway continuous encryption threshold. |
| 2026-09-21 | Backend LFSR Whitening Offload | Moved 32-bit Galois LFSR whitening from ESP32 firmware (`PQHardware.ino`) to backend (`SerialEntropySource`). ESP32 now streams raw sampled bytes directly over serial without MCU-side bit-level LFSR computation or artificial delays, boosting sampling speed. |
| 2026-09-21 | Dynamic Hardware Fallback Fix | Fixed dynamic switching and speed freeze on ESP32 disconnect. Active ClearCommError health check in `SerialEntropySource::isAvailable()`, clean port closure, reset `hardwareAvailable` flag, and decay/reset speed in `EntropyPool`. |
| 2026-09-20 | Encryption UX plan | Designed password-only `.pqe` file format — salt+IV+tag embedded in file header; frontend shows internals for transparency |
| 2026-08-28 | README & License | Completed README.md and added MIT License |
| 2026-08-27 | Playwright E2E Tests | Initialized Playwright v1.40.0, added `site-audit.spec.ts` |
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
2. **Write unit tests** — `backend/tests/test_1.cpp` is empty. Start with EntropyPool and crypto module tests.
3. **Enhance frontend CSS** — `style.css` is minimal (789 bytes). Add dark theme, terminal styling, responsive polish.
4. **Create `docs/` directory** — Write `ARCHITECTURE.md`, `API.md`, `USER_GUIDE.md`.
5. **Clean up stale `Config.o`** — Remove from project root or add `*.o` to `.gitignore` (already in `.gitignore` but file exists).
6. **Test hardware integration** — Verify ESP32 serial communication end-to-end with actual hardware.

---

## 🎓 Academic Standard / Pre-Beta Checklist

Based on the repository audit, the following deliverables are required to bring the repository to a production-ready academic standard before starting frontend beta development:

### 1. README & Documentation
- [ ] **System Architecture Diagram**: Add Mermaid/ASCII flow chart showing the data pipeline (`Hardware Harvester` -> `SerialEntropySource` -> `EntropyPool` -> `Crypto / WebServer` -> `NIST Analyzer`).
- [ ] **Hardware Schematic & Pinout**: Document circuit setup (Zener diode/photodiodes, analog pins, pull-ups, power).
- [ ] **Mathematical / Entropy Model**: Explain von Neumann debiasing, SHA-256 whitening, pool mixing.
- [ ] **NIST SP 800-22 Test Results**: Add markdown summary table displaying p-values and pass/fail statuses.
- [ ] **Step-by-Step Build Guide**: Detail build requirements (CMake, compiler, vcpkg, Python env).
- [ ] **Restructure `docs/`**: Rename `docs/report_text.txt` to `docs/technical_report.md` and format it properly.
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
- [ ] **Schematic Diagram**: Place a circuit diagram or breadboard render (`hardware/schematic.png` or Fritzing layout) inside `hardware/`.
- [ ] **Hardware README**: Add `hardware/README.md` specifying supported boards and flashing instructions.

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

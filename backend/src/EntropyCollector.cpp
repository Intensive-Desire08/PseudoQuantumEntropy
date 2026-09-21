#include "Logger.h"
#include "EntropyCollector.h"
#include "entropy/SerialEntropySource.h"
#include "entropy/OpenSSLEntropySource.h"
#include "EntropyPool.h"
#include <iostream>
#include <algorithm>
#include <thread>
#include <chrono>

EntropyCollector::EntropyCollector()
    : port("COM3")
    , baudRate(115200)
    , bufferSize(DEFAULT_BUFFER_SIZE)
    , initialized(false)
    , activeSourceType("none")
    , activeSourceName("none")
    , hardwareAvailable(false)
    , openSSLAvailable(false)
    , monitorRunning(false) {
}

EntropyCollector::~EntropyCollector() {
    shutdown();
}

std::vector<std::string> EntropyCollector::detectSources() {
    std::vector<std::string> sources;
    
    // Check if OpenSSL is available (always true if linked)
    openSSLAvailable = true;
    sources.push_back("openssl");
    
    // Check if hardware is available by trying to open the port
    // We'll do a quick test without fully initializing
    try {
        SerialEntropySource testSource(port, baudRate, 1000); // Short timeout
        if (testSource.initialize()) {
            hardwareAvailable = true;
            sources.push_back("hardware");
            testSource.shutdown();
        }
    } catch (const std::exception& e) {
        hardwareAvailable = false;
        { std::stringstream ss; ss << "[EntropyCollector] Hardware not detected: " << e.what(); LOG_INFO(ss.str()); }
    }
    
    std::cout << "[EntropyCollector] Detected sources: ";
    for (const auto& source : sources) {
        std::cout << source << " ";
    }
    std::cout << std::endl;
    
    return sources;
}

bool EntropyCollector::initialize(
    const std::string& port,
    unsigned int baudRate,
    size_t bufferSize) {
    
    if (initialized) {
        { std::stringstream ss; ss << "[EntropyCollector] Already initialized"; LOG_INFO(ss.str()); }
        return true;
    }
    
    this->port = port;
    this->baudRate = baudRate;
    this->bufferSize = bufferSize > 0 ? bufferSize : DEFAULT_BUFFER_SIZE;
    
    // Detect available sources
    detectSources();
    
    // Try hardware first
    if (hardwareAvailable) {
        { std::stringstream ss; ss << "[EntropyCollector] Attempting to initialize hardware source..."; LOG_INFO(ss.str()); }
        if (initializeHardware(port, baudRate)) {
            if (startPool(bufferSize)) {
                initialized = true;
                { std::stringstream ss; ss << "[EntropyCollector] Initialized with hardware source: " << activeSourceName; LOG_INFO(ss.str()); }
                
                // Start monitor loop to detect disconnects and reconnects
                monitorRunning = true;
                monitorThread = std::thread(&EntropyCollector::sourceMonitorLoop, this);
                return true;
            }
        }
    }
    
    // Fallback to OpenSSL
    { std::stringstream ss; ss << "[EntropyCollector] Hardware unavailable, falling back to OpenSSL..."; LOG_INFO(ss.str()); }
    if (initializeOpenSSL()) {
        if (startPool(bufferSize)) {
            initialized = true;
            { std::stringstream ss; ss << "[EntropyCollector] Initialized with OpenSSL fallback"; LOG_INFO(ss.str()); }
            
            // Start monitor loop
            monitorRunning = true;
            monitorThread = std::thread(&EntropyCollector::sourceMonitorLoop, this);
            return true;
        }
    }
    
    { std::stringstream ss; ss << "[EntropyCollector] Failed to initialize any entropy source!"; LOG_ERROR(ss.str()); }
    return false;
}

bool EntropyCollector::initializeWithSource(
    const std::string& sourceType,
    const std::string& port,
    unsigned int baudRate,
    size_t bufferSize) {
    
    if (initialized) {
        { std::stringstream ss; ss << "[EntropyCollector] Already initialized"; LOG_INFO(ss.str()); }
        return true;
    }
    
    this->port = port;
    this->baudRate = baudRate;
    this->bufferSize = bufferSize > 0 ? bufferSize : DEFAULT_BUFFER_SIZE;
    
    bool success = false;
    
    if (sourceType == "hardware") {
        success = initializeHardware(port, baudRate);
    } else if (sourceType == "openssl") {
        success = initializeOpenSSL();
    } else {
        { std::stringstream ss; ss << "[EntropyCollector] Unknown source type: " << sourceType; LOG_ERROR(ss.str()); }
        return false;
    }
    
    if (!success) {
        { std::stringstream ss; ss << "[EntropyCollector] Failed to initialize " << sourceType; LOG_ERROR(ss.str()); }
        return false;
    }
    
    if (!startPool(bufferSize)) {
        { std::stringstream ss; ss << "[EntropyCollector] Failed to start entropy pool"; LOG_ERROR(ss.str()); }
        return false;
    }
    
    initialized = true;
    { std::stringstream ss; ss << "[EntropyCollector] Initialized with " << sourceType << " source: " << activeSourceName; LOG_INFO(ss.str()); }
    
    // Start monitor loop
    monitorRunning = true;
    monitorThread = std::thread(&EntropyCollector::sourceMonitorLoop, this);
    return true;
}

void EntropyCollector::shutdown() {
    if (monitorRunning) {
        monitorRunning = false;
        if (monitorThread.joinable()) {
            monitorThread.join();
        }
    }

    if (entropyPool) {
        entropyPool->stop();
        entropyPool.reset();
    }
    
    if (entropySource) {
        entropySource->shutdown();
        entropySource.reset();
    }
    
    initialized = false;
    activeSourceType = "none";
    activeSourceName = "none";
    
    { std::stringstream ss; ss << "[EntropyCollector] Shutdown complete"; LOG_INFO(ss.str()); }
}

std::vector<uint8_t> EntropyCollector::getEntropy(size_t numBytes) {
    if (!initialized || !entropyPool) {
        throw EntropyException("EntropyCollector not initialized");
    }
    
    return entropyPool->getEntropy(numBytes);
}

uint8_t EntropyCollector::getByte() {
    if (!initialized || !entropyPool) {
        throw EntropyException("EntropyCollector not initialized");
    }
    
    return entropyPool->getByte();
}

size_t EntropyCollector::tryGetEntropy(size_t numBytes, std::vector<uint8_t>& buffer) {
    if (!initialized || !entropyPool) {
        return 0;
    }
    
    return entropyPool->tryGetEntropy(numBytes, buffer);
}

std::string EntropyCollector::getSourceName() const {
    return activeSourceName;
}

std::string EntropyCollector::getSourceType() const {
    return activeSourceType;
}

bool EntropyCollector::isHardwareAvailable() const {
    return hardwareAvailable;
}

bool EntropyCollector::isOpenSSLAvailable() const {
    return openSSLAvailable;
}

bool EntropyCollector::isInitialized() const {
    return initialized;
}

size_t EntropyCollector::getTotalBytesGenerated() const {
    if (!entropyPool) {
        return 0;
    }
    return entropyPool->getTotalBytesGenerated();
}

double EntropyCollector::getSpeed() const {
    if (!entropyPool) {
        return 0.0;
    }
    return entropyPool->getSpeed();
}

void EntropyCollector::resetByteCounter() {
    if (entropySource) {
        entropySource->resetByteCounter();
    }
}

size_t EntropyCollector::getPoolSize() const {
    if (!entropyPool) {
        return 0;
    }
    return entropyPool->getBufferSize();
}

size_t EntropyCollector::getAvailableBytes() const {
    if (!entropyPool) {
        return 0;
    }
    return entropyPool->available();
}

bool EntropyCollector::refillPool() {
    if (!entropyPool) {
        return false;
    }
    return entropyPool->refill();
}

void EntropyCollector::setPort(const std::string& port) {
    this->port = port;
}

void EntropyCollector::setBaudRate(unsigned int baudRate) {
    this->baudRate = baudRate;
}

void EntropyCollector::setBufferSize(size_t bufferSize) {
    this->bufferSize = bufferSize > 0 ? bufferSize : DEFAULT_BUFFER_SIZE;
}

std::string EntropyCollector::getPort() const {
    return port;
}

unsigned int EntropyCollector::getBaudRate() const {
    return baudRate;
}

bool EntropyCollector::initializeHardware(const std::string& port, unsigned int baudRate) {
    try {
        auto source = std::make_shared<SerialEntropySource>(port, baudRate);
        
        if (source->initialize()) {
            entropySource = source;
            activeSourceType = "hardware";
            activeSourceName = source->getSourceName();
            hardwareAvailable = true;
            return true;
        }
    } catch (const std::exception& e) {
        { std::stringstream ss; ss << "[EntropyCollector] Hardware initialization error: " << e.what(); LOG_ERROR(ss.str()); }
    }
    
    return false;
}

bool EntropyCollector::initializeOpenSSL() {
    try {
        auto source = std::make_shared<OpenSSLEntropySource>();
        
        if (source->initialize()) {
            entropySource = source;
            activeSourceType = "openssl";
            activeSourceName = source->getSourceName();
            openSSLAvailable = true;
            return true;
        }
    } catch (const std::exception& e) {
        { std::stringstream ss; ss << "[EntropyCollector] OpenSSL initialization error: " << e.what(); LOG_ERROR(ss.str()); }
    }
    
    return false;
}

bool EntropyCollector::startPool(size_t bufferSize) {
    if (!entropySource) {
        return false;
    }
    
    try {
        entropyPool = std::make_unique<EntropyPool>(
            entropySource,
            bufferSize,
            bufferSize / 2  // Refill at 50%
        );
        
        if (entropyPool->start()) {
            return true;
        }
    } catch (const std::exception& e) {
        { std::stringstream ss; ss << "[EntropyCollector] Pool start error: " << e.what(); LOG_ERROR(ss.str()); }
    }
    
    entropyPool.reset();
    return false;
}

void EntropyCollector::cleanup() {
    if (entropyPool) {
        entropyPool->stop();
        entropyPool.reset();
    }
    
    if (entropySource) {
        entropySource->shutdown();
        entropySource.reset();
    }
}

void EntropyCollector::sourceMonitorLoop() {
    int failedCount = 0;
    int probeInterval = 0;
    while (monitorRunning) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        if (!monitorRunning) break;

        if (activeSourceType == "hardware") {
            bool isAvail = false;
            if (entropySource) {
                isAvail = entropySource->isAvailable();
            }

            if (!isAvail) {
                failedCount++;
                if (failedCount >= 1) {
                    failedCount = 0;
                    { std::stringstream ss; ss << "[EntropyCollector] Hardware disconnected or paused. Falling back to OpenSSL..."; LOG_INFO(ss.str()); }
                    
                    // Clean up hardware source so the COM port handle is cleanly released
                    if (entropySource) {
                        try {
                            entropySource->shutdown();
                        } catch (...) {}
                    }

                    hardwareAvailable = false;

                    if (initializeOpenSSL()) {
                        if (entropyPool) {
                            entropyPool->setSource(entropySource);
                        }
                        { std::stringstream ss; ss << "[EntropyCollector] Successfully switched to OpenSSL fallback"; LOG_INFO(ss.str()); }
                    }
                }
            } else {
                failedCount = 0;
            }
        } else if (activeSourceType == "openssl") {
            failedCount = 0;
            probeInterval++;
            // Check if hardware is back every 2 seconds (2 * 1000ms)
            if (probeInterval >= 2) {
                probeInterval = 0;
                try {
                    auto testSource = std::make_shared<SerialEntropySource>(port, baudRate, 1000);
                    if (testSource->initialize() && testSource->isAvailable()) {
                        { std::stringstream ss; ss << "[EntropyCollector] Hardware source resumed/reconnected! Switching back..."; LOG_INFO(ss.str()); }
                        entropySource = testSource;
                        activeSourceType = "hardware";
                        activeSourceName = testSource->getSourceName();
                        hardwareAvailable = true;
                        if (entropyPool) {
                            entropyPool->setSource(entropySource);
                        }
                    } else {
                        testSource->shutdown();
                    }
                } catch (const std::exception&) {
                    // Still disconnected or paused, do nothing
                }
            }
        }
    }
}
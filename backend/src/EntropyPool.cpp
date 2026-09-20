#include "EntropyPool.h"
#include "entropy/IEntropySource.h"
#include <iostream>
#include <algorithm>

EntropyPool::EntropyPool(
    std::shared_ptr<IEntropySource> source,
    size_t bufferSize,
    size_t refillThreshold)
    : entropySource(source)
    , buffer(bufferSize)
    , head(0)
    , tail(0)
    , count(0)
    , bufferSize(bufferSize)
    , refillThreshold(refillThreshold > bufferSize ? bufferSize : refillThreshold)
    , running(false)
    , stopped(false)
    , totalBytesGenerated(0)
    , currentSpeed(0.0)
    , collectorThread() {
    
    if (!entropySource) {
        throw EntropyException("EntropyPool: Invalid entropy source (nullptr)");
    }
}

EntropyPool::~EntropyPool() {
    stop();
}

bool EntropyPool::start() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (running) {
        return true; // Already running
    }
    
    if (!entropySource || !entropySource->isAvailable()) {
        std::cerr << "[EntropyPool] Cannot start: entropy source not available" << std::endl;
        return false;
    }
    
    // Reset state
    head = 0;
    tail = 0;
    count = 0;
    totalBytesGenerated = 0;
    currentSpeed = 0.0;
    stopped = false;
    running = true;
    
    // Start background thread
    collectorThread = std::thread(&EntropyPool::collectionThread, this);
    
    std::cout << "[EntropyPool] Started with buffer size: " << bufferSize 
              << " bytes, source: " << entropySource->getSourceName() << std::endl;
    
    return true;
}

void EntropyPool::stop() {
    {
        std::lock_guard<std::mutex> lock(mutex);
        if (!running) {
            return;
        }
        running = false;
        stopped = true;
    }
    
    // Wake up any waiting threads
    cv.notify_all();
    refillCV.notify_all();
    
    // Wait for thread to finish
    if (collectorThread.joinable()) {
        collectorThread.join();
    }
    
    std::cout << "[EntropyPool] Stopped" << std::endl;
}

std::vector<uint8_t> EntropyPool::getEntropy(size_t numBytes) {
    if (numBytes == 0) {
        return {};
    }
    
    std::unique_lock<std::mutex> lock(mutex);
    
    // Wait until we have enough bytes or pool is stopped
    while (count < numBytes && !stopped && running) {
        cv.wait(lock);
    }
    
    if (stopped || !running) {
        throw EntropyException("EntropyPool is stopped");
    }
    
    if (count < numBytes) {
        throw EntropyException("EntropyPool: Insufficient entropy available");
    }
    
    return readBytes(numBytes);
}

uint8_t EntropyPool::getByte() {
    auto bytes = getEntropy(1);
    return bytes[0];
}

size_t EntropyPool::tryGetEntropy(size_t numBytes, std::vector<uint8_t>& buffer) {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (stopped || !running) {
        return 0;
    }
    
    size_t bytesToRead = std::min(numBytes, count);
    if (bytesToRead == 0) {
        return 0;
    }
    
    auto bytes = readBytes(bytesToRead);
    buffer.insert(buffer.end(), bytes.begin(), bytes.end());
    
    // If we're below the refill threshold, wake up the collector
    if (needsRefill()) {
        refillCV.notify_one();
    }
    
    return bytesToRead;
}

size_t EntropyPool::available() const {
    std::lock_guard<std::mutex> lock(mutex);
    return count;
}

size_t EntropyPool::getTotalBytesGenerated() const {
    return totalBytesGenerated;
}

double EntropyPool::getSpeed() const {
    return currentSpeed;
}

bool EntropyPool::isRunning() const {
    return running;
}

bool EntropyPool::isEmpty() const {
    std::lock_guard<std::mutex> lock(mutex);
    return count == 0;
}

bool EntropyPool::isFull() const {
    std::lock_guard<std::mutex> lock(mutex);
    return count == bufferSize;
}

size_t EntropyPool::getBufferSize() const {
    return bufferSize;
}

void EntropyPool::setRefillThreshold(size_t threshold) {
    std::lock_guard<std::mutex> lock(mutex);
    refillThreshold = std::min(threshold, bufferSize);
}

size_t EntropyPool::getRefillThreshold() const {
    return refillThreshold;
}

bool EntropyPool::refill() {
    std::lock_guard<std::mutex> lock(mutex);
    return collectEntropy();
}

void EntropyPool::setSource(std::shared_ptr<IEntropySource> source) {
    if (!source) {
        throw EntropyException("EntropyPool: Invalid entropy source (nullptr)");
    }
    
    std::lock_guard<std::mutex> lock(mutex);
    entropySource = source;
    currentSpeed.store(0.0);
    std::cout << "[EntropyPool] Source changed to: " << entropySource->getSourceName() << std::endl;

    // Wake up collector thread immediately to switch to new source
    refillCV.notify_all();
    cv.notify_all();
}

std::string EntropyPool::getSourceName() const {
    std::lock_guard<std::mutex> lock(mutex);
    return entropySource ? entropySource->getSourceName() : "No source";
}

void EntropyPool::collectionThread() {
    std::cout << "[EntropyPool] Collection thread started" << std::endl;
    
    while (running) {
        // Check if refill is needed
        bool needRefill = false;
        {
            std::lock_guard<std::mutex> lock(mutex);
            needRefill = needsRefill();
        }
        
        if (needRefill) {
            // Collect entropy
            bool success = false;
            {
                std::lock_guard<std::mutex> lock(mutex);
                success = collectEntropy();
            }
            
            if (!success) {
                // If collection failed, wait a bit before retrying
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        } else {
            // Buffer is healthy, perform a continuous benchmark to keep speed updated live
            try {
                std::shared_ptr<IEntropySource> source;
                {
                    std::lock_guard<std::mutex> lock(mutex);
                    source = entropySource;
                }
                
                if (source && source->isAvailable()) {
                    auto t0 = std::chrono::steady_clock::now();
                    auto trash = source->getEntropy(64);
                    auto t1 = std::chrono::steady_clock::now();
                    
                    std::chrono::duration<double> elapsed = t1 - t0;
                    if (elapsed.count() > 0 && trash.size() > 0) {
                        double inst_speed = trash.size() / elapsed.count();
                        double curr = currentSpeed.load();
                        currentSpeed.store(curr == 0.0 ? inst_speed : (0.2 * inst_speed + 0.8 * curr));
                    }
                } else {
                    currentSpeed.store(0.0);
                }
            } catch (...) {
                // If benchmark fails (e.g. device unplugged), reset speed immediately
                currentSpeed.store(0.0);
            }
            
            std::this_thread::sleep_for(COLLECTION_INTERVAL);
        }
        
        // Check for refill request
        {
            std::unique_lock<std::mutex> lock(mutex);
            if (!needsRefill()) {
                // Wait for notification or timeout
                refillCV.wait_for(lock, std::chrono::milliseconds(500));
            }
        }
    }
    
    std::cout << "[EntropyPool] Collection thread stopped" << std::endl;
}

bool EntropyPool::collectEntropy() {
    if (!entropySource) {
        return false;
    }
    
    if (!entropySource->isAvailable()) {
        std::cerr << "[EntropyPool] Entropy source not available" << std::endl;
        return false;
    }
    
    try {
        auto start = std::chrono::steady_clock::now();
        std::vector<uint8_t> entropy = entropySource->getEntropy(COLLECTION_BATCH_SIZE);
        auto end = std::chrono::steady_clock::now();
        
        if (!entropy.empty()) {
            addBytes(entropy);
            totalBytesGenerated += entropy.size();
            
            std::chrono::duration<double> elapsed = end - start;
            if (elapsed.count() > 0) {
                double inst_speed = entropy.size() / elapsed.count();
                double curr = currentSpeed.load();
                currentSpeed.store(curr == 0.0 ? inst_speed : (0.2 * inst_speed + 0.8 * curr));
            }
            
            return true;
        }
        
        return false;
        
    } catch (const std::exception& e) {
        std::cerr << "[EntropyPool] Error collecting entropy: " << e.what() << std::endl;
        return false;
    }
}

void EntropyPool::addBytes(const std::vector<uint8_t>& data) {
    // Assumes lock is held
    if (data.empty()) {
        return;
    }
    
    size_t bytesToAdd = std::min(data.size(), bufferSize - count);
    if (bytesToAdd == 0) {
        return; // Buffer is full
    }
    
    // Copy bytes into buffer
    for (size_t i = 0; i < bytesToAdd; ++i) {
        buffer[tail] = data[i];
        tail = (tail + 1) % bufferSize;
    }
    
    count += bytesToAdd;
    
    // Notify waiting readers
    cv.notify_all();
}

std::vector<uint8_t> EntropyPool::readBytes(size_t numBytes) {
    // Assumes lock is held
    if (numBytes == 0 || count == 0) {
        return {};
    }
    
    size_t bytesToRead = std::min(numBytes, count);
    std::vector<uint8_t> result(bytesToRead);
    
    for (size_t i = 0; i < bytesToRead; ++i) {
        result[i] = buffer[head];
        head = (head + 1) % bufferSize;
    }
    
    count -= bytesToRead;
    
    // If we're below the refill threshold, wake up the collector
    if (needsRefill()) {
        refillCV.notify_one();
    }
    
    return result;
}

bool EntropyPool::needsRefill() const {
    // Assumes lock is held
    return count < refillThreshold && running;
}
/*
  Dual Photodiode True Random Number Generator (TRNG)

  - Uses two independent analog entropy sources (photodiodes)
  - Amplified using LM358 op-amp
  - Extracts least significant bit (LSB) from ADC readings
  - Applies Von Neumann whitening to remove bias
  - Converts the bits into bytes
  - Outputs unbiased random bytes over Serial
*/

int greenLED = 4;
int redLED = 5;
const int PIN1 = 34;
const int PIN2 = 35;
unsigned long lastLEDTime = 0;
const int ledDelay = 100; // 0.1 sec

// Pause/Resume button settings
const int BUTTON_PIN = 25;
bool running = true;
int buttonState;
int lastButtonState;
unsigned long lastDebounceTime = 0;

// Set to true to print readable output to Arduino Serial Monitor
// Set to false to output binary data for the Python Analyzer / Backend
bool debugMode = false;

int getBit() {
  return (analogRead(PIN1) ^ analogRead(PIN2)) & 1;
}

int getByte() {
  int value = 0;
  for(int i = 0; i < 4; i++){
    value = (value << 2) | ((analogRead(PIN1) ^ analogRead(PIN2)) & 0x03);
  }
  return value;
}

void setup() {
  Serial.setTxBufferSize(512);
  Serial.begin(921600);

  pinMode(greenLED, OUTPUT);
  pinMode(redLED, OUTPUT);
  
  // Initialize push button with internal pull-up
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Wait for the internal pull-up to charge the pin's capacitance
  delay(10);
  buttonState = digitalRead(BUTTON_PIN);
  lastButtonState = buttonState;
}

void loop(){

  // --- Button Edge Detection with 200ms Lockout ---
  int reading = digitalRead(BUTTON_PIN);
  
  if (debugMode) {
    static unsigned long lastDebugPrint = 0;
    if (millis() - lastDebugPrint > 500) {
      Serial.print("Raw Button Pin (GPIO 25): ");
      Serial.print(reading);
      Serial.print(" | State: ");
      Serial.println(running ? "RUNNING" : "PAUSED");
      lastDebugPrint = millis();
    }
  }

  if (reading == LOW && buttonState == HIGH && (millis() - lastDebounceTime > 200)) {
    running = !running;
    buttonState = LOW;
    lastDebounceTime = millis();
    if (debugMode) {
      Serial.println(">>> CLICK DETECTED! (Toggled state) <<<");
    }
  } 
  else if (reading == HIGH && buttonState == LOW && (millis() - lastDebounceTime > 200)) {
    buttonState = HIGH;
    lastDebounceTime = millis();
    if (debugMode) {
      Serial.println(">>> BUTTON RELEASED <<<");
    }
  }
  // Paused state behavior
  if (!running) {
    digitalWrite(greenLED, LOW);
    digitalWrite(redLED, LOW);
    return; // Exit early; loop() will immediately re-run to poll button
  }
  // --- End Button Logic ---

  // Output random bytes stream without blocking
  if (!debugMode) {
    // Binary output for analyzer/backend:
    // Transmits 64-byte payload with 2-byte sync header [0xAA][0x55][64 raw bytes]
    // Only write if there is space in the buffer to prevent the ESP32 from
    // freezing when the backend isn't actively reading the COM port!
    if (Serial.availableForWrite() >= 66) {
      uint8_t packet[66];
      packet[0] = 0xAA;
      packet[1] = 0x55;
      for (int i = 0; i < 64; i++) {
        packet[2 + i] = (uint8_t)getByte();
      }
      Serial.write(packet, 66);
    }
  }

  // LED visualization
  if(millis() - lastLEDTime >= ledDelay){ // Time for updation
    lastLEDTime = millis();

    int bit = (analogRead(PIN1) ^ analogRead(PIN2)) & 1;

    if(bit == 1){
      digitalWrite(greenLED, HIGH);
      digitalWrite(redLED, LOW);
    } else {
      digitalWrite(greenLED, LOW);
      digitalWrite(redLED, HIGH);
    }
  }

  //Serial.println(b1);
  //Serial.println(val1);
  //Serial.println(finalByte);
}

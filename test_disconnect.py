import serial
import time
import sys

print("========================================")
print("  COM3 Disconnection Test Utility")
print("========================================")
print("Connecting to COM3...")
try:
    ser = serial.Serial('COM3', 115200, timeout=1.0)
    print("SUCCESS: Connected to COM3!")
except Exception as e:
    print("ERROR: Failed to connect to COM3.")
    print(f"Details: {e}")
    sys.exit(1)

print("\n--- INSTRUCTIONS ---")
print("1. Data is being read from the COM port.")
print("2. PLEASE UNPLUG THE ESP32 NOW.")
print("3. Watch what happens to the output...")
print("--------------------\n")

count = 0
last_time = time.time()
try:
    while True:
        try:
            data = ser.read(10)
            if data:
                count += len(data)
                now = time.time()
                if now - last_time > 0.5:
                    print(f"Reading... total {count} bytes so far.")
                    last_time = now
            else:
                print("Read timeout (1.0s elapsed with NO data). Is it disconnected?")
                
        except serial.SerialException as se:
            print("\n*** SERIAL EXCEPTION CAUGHT! ***")
            print(f"Details: {se}")
            print("This confirms Python/OS detected the physical disconnection!")
            break
        except Exception as e:
            print(f"\n*** OTHER EXCEPTION: {e} ***")
            break
except KeyboardInterrupt:
    print("\nExiting...")
finally:
    ser.close()

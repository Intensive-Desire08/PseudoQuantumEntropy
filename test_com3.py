import serial
import time
import sys

print("Connecting to COM3...")
try:
    ser = serial.Serial('COM3', 115200, timeout=0.5)
    print("Connected! Start sending data, then disconnect the USB cable.")
except Exception as e:
    print("Failed to connect:", e)
    sys.exit(1)

count = 0
while True:
    try:
        data = ser.read(1)
        if data:
            count += 1
            if count % 100 == 0:
                print(f"Read {count} bytes...")
        else:
            print("Timeout reading from COM3 - no data received in 0.5s")
    except Exception as e:
        print(f"Exception during read: {e}")
        break

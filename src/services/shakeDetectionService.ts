import { Accelerometer } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/Pedometer';

class ShakeDetectionService {
  private subscription: Subscription | null = null;
  private lastShakeTime = 0;
  private shakeThreshold = 2.5; // Sensitivity (lower = more sensitive)
  private shakeTimeout = 1000; // Minimum time between shakes (ms)
  private onShakeCallback: (() => void) | null = null;

  // Start shake detection
  start(onShake: () => void, sensitivity: 'low' | 'medium' | 'high' = 'medium') {
    // Set threshold based on sensitivity
    switch (sensitivity) {
      case 'low':
        this.shakeThreshold = 3.5; // Less sensitive (harder shake needed)
        break;
      case 'medium':
        this.shakeThreshold = 2.5; // Default
        break;
      case 'high':
        this.shakeThreshold = 1.8; // More sensitive (easier shake)
        break;
    }

    this.onShakeCallback = onShake;

    // Set update interval (100ms = 10 times per second)
    Accelerometer.setUpdateInterval(100);

    // Subscribe to accelerometer updates
    this.subscription = Accelerometer.addListener((accelerometerData) => {
      const { x, y, z } = accelerometerData;

      // Calculate total acceleration (magnitude)
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      // Detect shake (acceleration above threshold)
      if (acceleration > this.shakeThreshold) {
        const now = Date.now();

        // Prevent multiple triggers (debounce)
        if (now - this.lastShakeTime > this.shakeTimeout) {
          this.lastShakeTime = now;
          console.log(`📳 Shake detected! Acceleration: ${acceleration.toFixed(2)}`);

          if (this.onShakeCallback) {
            this.onShakeCallback();
          }
        }
      }
    });

    console.log(`📳 Shake detection started (sensitivity: ${sensitivity}, threshold: ${this.shakeThreshold})`);
  }

  // Stop shake detection
  stop() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      this.onShakeCallback = null;
      console.log('📳 Shake detection stopped');
    }
  }

  // Check if shake detection is active
  isActive(): boolean {
    return this.subscription !== null;
  }

  // Update sensitivity
  setSensitivity(sensitivity: 'low' | 'medium' | 'high') {
    switch (sensitivity) {
      case 'low':
        this.shakeThreshold = 3.5;
        break;
      case 'medium':
        this.shakeThreshold = 2.5;
        break;
      case 'high':
        this.shakeThreshold = 1.8;
        break;
    }
    console.log(`📳 Shake sensitivity updated: ${sensitivity} (threshold: ${this.shakeThreshold})`);
  }
}

export default new ShakeDetectionService();

import { Audio } from 'expo-av';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Import BASE_URL from api.ts to ensure consistency
const BASE_URL = 'http://192.168.1.9:3000/api';

class VoiceRecognitionService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private isInitialized = false;
  private recordingLock = false;

  // Initialize audio mode
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission to use voice detection.',
          [{ text: 'OK' }]
        );
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      this.isInitialized = true;
      console.log('✅ Audio initialized with permissions');
      return true;
    } catch (error) {
      console.error('❌ Audio initialization error:', error);
      return false;
    }
  }

  // Record audio chunk
  async recordChunk(durationMs: number = 3000): Promise<string | null> {
    // Use lock to prevent concurrent recordings
    if (this.recordingLock) {
      console.log('⚠️ Recording locked, waiting...');
      return null;
    }

    this.recordingLock = true;

    try {
      // Force cleanup any existing recording
      await this.forceCleanup();

      // Create new recording
      this.recording = new Audio.Recording();
      
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      this.isRecording = true;
      await this.recording.startAsync();

      // Wait for specified duration
      await new Promise((resolve) => setTimeout(resolve, durationMs));

      // Stop recording
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        this.recording = null;
        this.isRecording = false;
        
        // Small delay before releasing lock
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        return uri;
      }

      this.isRecording = false;
      return null;
    } catch (error) {
      console.error('❌ Recording error:', error);
      
      // Cleanup on error
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
        this.recording = null;
      }
      
      this.isRecording = false;
      return null;
    } finally {
      this.recordingLock = false;
    }
  }

  // Force cleanup
  private async forceCleanup() {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (e) {
        // Ignore
      }
      this.recording = null;
    }
    this.isRecording = false;
    // Small delay to ensure cleanup
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Send audio to backend for transcription
  async transcribeAudio(audioUri: string): Promise<{
    success: boolean;
    transcript: string;
    containsKeyword: boolean;
    hasVoice: boolean;
  }> {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No auth token found');
        throw new Error('No auth token');
      }

      console.log(`📤 Sending audio to: ${BASE_URL}/speech/transcribe`);
      console.log(`📁 Audio URI: ${audioUri}`);

      // Create form data
      const formData = new FormData();
      
      // @ts-ignore - React Native FormData handles this
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio.wav',
      });
      
      formData.append('encoding', 'LINEAR16');
      formData.append('sampleRate', '16000');

      const response = await axios.post(`${BASE_URL}/speech/transcribe`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000, // Increased timeout for API calls
      });

      console.log('✅ Transcription response received');

      return {
        success: response.data.success,
        transcript: response.data.transcript || '',
        containsKeyword: response.data.containsKeyword || false,
        hasVoice: response.data.hasVoice !== false,
      };
    } catch (error: any) {
      // Handle timeout and network errors gracefully
      if (error.code === 'ECONNABORTED') {
        console.error('❌ Transcription timeout - backend took too long');
      } else if (error.message === 'Network Error') {
        console.error('❌ Network error - check backend connection');
        console.error(`   Backend URL: ${BASE_URL}/speech/transcribe`);
        console.error('   Make sure backend is running and accessible from your device');
      } else if (error.response) {
        console.error('❌ Transcription error:', error.response.status, error.response.data);
      } else {
        console.error('❌ Transcription error:', error.message);
      }
      
      return {
        success: false,
        transcript: '',
        containsKeyword: false,
        hasVoice: false,
      };
    }
  }

  // Stop current recording
  async stopRecording() {
    try {
      if (this.recording) {
        try {
          const status = await this.recording.getStatusAsync();
          if (status.isRecording) {
            await this.recording.stopAndUnloadAsync();
          } else if (status.isDoneRecording) {
            await this.recording.stopAndUnloadAsync();
          }
        } catch (e) {
          // Force cleanup even if status check fails
          try {
            await this.recording.stopAndUnloadAsync();
          } catch (e2) {
            // Ignore
          }
        }
        this.recording = null;
      }
      this.isRecording = false;
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      this.recording = null;
      this.isRecording = false;
    }
  }

  // Cleanup
  async cleanup() {
    this.recordingLock = false;
    await this.stopRecording();
    await this.forceCleanup();
    this.isInitialized = false;
    console.log('🧹 Voice service cleaned up');
  }
}

export default new VoiceRecognitionService();

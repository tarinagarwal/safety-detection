import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.9:3000/api';

export const testBackendConnection = async () => {
  const results = {
    healthCheck: false,
    authentication: false,
    speechEndpoint: false,
    errors: [] as string[],
  };

  try {
    // Test 1: Health check (no auth required)
    console.log('🧪 Testing health endpoint...');
    const healthResponse = await axios.get('http://192.168.1.9:3000/health', {
      timeout: 5000,
    });
    
    if (healthResponse.status === 200) {
      results.healthCheck = true;
      console.log('✅ Health check passed');
    }
  } catch (error: any) {
    results.errors.push(`Health check failed: ${error.message}`);
    console.error('❌ Health check failed:', error.message);
  }

  try {
    // Test 2: Check if user is authenticated
    console.log('🧪 Testing authentication...');
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      results.errors.push('No auth token found - user not logged in');
      console.error('❌ No auth token');
      return results;
    }

    console.log('✅ Auth token found');
    results.authentication = true;

    // Test 3: Test speech health endpoint
    console.log('🧪 Testing speech endpoint...');
    const speechResponse = await axios.get(`${BASE_URL}/speech/health`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    if (speechResponse.status === 200) {
      results.speechEndpoint = true;
      console.log('✅ Speech endpoint accessible');
      console.log('📊 Speech service status:', speechResponse.data);
    }
  } catch (error: any) {
    if (error.response) {
      results.errors.push(`Speech endpoint error: ${error.response.status} - ${error.response.data?.error || 'Unknown'}`);
      console.error('❌ Speech endpoint error:', error.response.status, error.response.data);
    } else {
      results.errors.push(`Speech endpoint failed: ${error.message}`);
      console.error('❌ Speech endpoint failed:', error.message);
    }
  }

  return results;
};

export const printNetworkDiagnostics = async () => {
  console.log('\n🔍 === NETWORK DIAGNOSTICS ===');
  console.log(`📡 Backend URL: ${BASE_URL}`);
  console.log(`🌐 Testing connection...\n`);

  const results = await testBackendConnection();

  console.log('\n📊 === RESULTS ===');
  console.log(`✅ Health Check: ${results.healthCheck ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Authentication: ${results.authentication ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Speech Endpoint: ${results.speechEndpoint ? 'PASS' : 'FAIL'}`);

  if (results.errors.length > 0) {
    console.log('\n❌ === ERRORS ===');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (!results.healthCheck) {
    console.log('\n💡 === SUGGESTIONS ===');
    console.log('1. Make sure backend is running: cd backend && npm start');
    console.log('2. Check if IP address is correct in api.ts');
    console.log('3. Ensure device and computer are on same WiFi network');
    console.log('4. Check firewall settings');
  }

  console.log('\n=========================\n');

  return results;
};

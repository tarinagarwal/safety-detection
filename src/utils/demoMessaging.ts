import { Linking, Platform } from 'react-native';
import * as SMS from 'expo-sms';
import * as MailComposer from 'expo-mail-composer';

interface Guardian {
    name: string;
    phone: string;
    email?: string;
}

interface AlertData {
    latitude: number;
    longitude: number;
    address?: string;
    triggerType: string;
}

/**
 * Demo messaging utilities that use device's native SMS/Email apps
 * No backend server required!
 */

export const sendDemoSMS = async (guardians: Guardian[], alertData: AlertData) => {
    try {
        // Check if SMS is available
        const isAvailable = await SMS.isAvailableAsync();

        if (!isAvailable) {
            console.log('SMS not available on this device');
            return false;
        }

        const phoneNumbers = guardians.map(g => g.phone);
        const message = `🚨 EMERGENCY ALERT 🚨\n\n` +
            `I need help! This is an automated emergency alert.\n\n` +
            `Trigger: ${alertData.triggerType}\n` +
            `Location: ${alertData.address || 'Unknown'}\n` +
            `Coordinates: ${alertData.latitude.toFixed(6)}, ${alertData.longitude.toFixed(6)}\n\n` +
            `View on map: https://maps.google.com/maps?q=${alertData.latitude},${alertData.longitude}`;

        // Open SMS app with pre-filled message
        const { result } = await SMS.sendSMSAsync(phoneNumbers, message);

        return result === 'sent';
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

export const sendDemoEmail = async (guardians: Guardian[], alertData: AlertData) => {
    try {
        // Check if email is available
        const isAvailable = await MailComposer.isAvailableAsync();

        if (!isAvailable) {
            console.log('Email not available on this device');
            return false;
        }

        const recipients = guardians
            .filter(g => g.email)
            .map(g => g.email as string);

        if (recipients.length === 0) {
            console.log('No email addresses available');
            return false;
        }

        const subject = '🚨 EMERGENCY ALERT - Immediate Assistance Needed';
        const body = `
      <h2>🚨 EMERGENCY ALERT 🚨</h2>
      <p><strong>I need help! This is an automated emergency alert.</strong></p>
      
      <h3>Alert Details:</h3>
      <ul>
        <li><strong>Trigger Type:</strong> ${alertData.triggerType}</li>
        <li><strong>Location:</strong> ${alertData.address || 'Unknown'}</li>
        <li><strong>Coordinates:</strong> ${alertData.latitude.toFixed(6)}, ${alertData.longitude.toFixed(6)}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      
      <p>
        <a href="https://maps.google.com/maps?q=${alertData.latitude},${alertData.longitude}">
          📍 View Location on Google Maps
        </a>
      </p>
      
      <p><em>This is an automated message from Safety App.</em></p>
    `;

        // Open email app with pre-filled message
        await MailComposer.composeAsync({
            recipients,
            subject,
            body,
            isHtml: true,
        });

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const openPhoneDialer = (phoneNumber: string) => {
    const url = Platform.OS === 'ios'
        ? `telprompt:${phoneNumber}`
        : `tel:${phoneNumber}`;

    Linking.openURL(url).catch(err =>
        console.error('Error opening phone dialer:', err)
    );
};

export const openMapsApp = (latitude: number, longitude: number) => {
    const url = Platform.OS === 'ios'
        ? `maps:0,0?q=${latitude},${longitude}`
        : `geo:0,0?q=${latitude},${longitude}`;

    Linking.openURL(url).catch(err => {
        // Fallback to Google Maps web
        Linking.openURL(`https://maps.google.com/maps?q=${latitude},${longitude}`);
    });
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import { locationAPI } from '../services/api';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    requestPermissions();
    startTracking();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isTracking) {
        startTracking();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopTracking();
      sub?.remove();
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get human-readable address using reverse geocoding
      let address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          // Build address from components
          const addressParts = [
            place.name,
            place.street,
            place.district,
            place.city,
            place.region,
            place.postalCode,
            place.country,
          ].filter(Boolean);

          address = addressParts.join(', ');
        }
      } catch (geocodeError) {
        console.log('Geocoding failed, using coordinates:', geocodeError);
      }

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        address,
      };

      setCurrentLocation(locationData);
      updateLocationOnServer(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const startTracking = async () => {
    if (isTracking) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted');
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 30000,
        },
        async (location) => {
          // Get human-readable address using reverse geocoding
          let address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;

          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            if (geocode && geocode.length > 0) {
              const place = geocode[0];
              // Build address from components
              const addressParts = [
                place.name,
                place.street,
                place.district,
                place.city,
                place.region,
                place.postalCode,
                place.country,
              ].filter(Boolean);

              address = addressParts.join(', ');
            }
          } catch (geocodeError) {
            console.log('Geocoding failed, using coordinates:', geocodeError);
          }

          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            address,
          };

          setCurrentLocation(locationData);
          updateLocationOnServer(locationData);
        }
      );

      setSubscription(sub);
      setIsTracking(true);
      getCurrentLocation();
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopTracking = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    setIsTracking(false);
  };

  const updateLocationOnServer = async (location: LocationData) => {
    // Demo mode: Skip server updates
    // Location is tracked locally only
    return;
  };

  const value: LocationContextType = {
    currentLocation,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

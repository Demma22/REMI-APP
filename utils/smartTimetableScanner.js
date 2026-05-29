// utils/smartTimetableScanner.js
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../supabase';

const BACKEND_URL = 'https://ai-backend-yl4w.onrender.com';

const compressImage = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

const convertImageToBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
};

const getValidToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at - now > 60) {
      return session.access_token;
    }
  }
  try {
    const { data, error } = await Promise.race([
      supabase.auth.refreshSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('refresh_timeout')), 8000)),
    ]);
    if (!error && data?.session) return data.session.access_token;
  } catch (_) {}
  if (!session) throw new Error('Not authenticated. Please log in again.');
  return session.access_token;
};

const sendToBackend = async (base64Image, mode) => {
  const endpoint = mode === 'lectures' ? '/scan-timetable' : '/scan-exam-timetable';
  const token = await getValidToken();

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Scan failed');
  }
  
  return result;
};

export const scanTimetableFromImage = async (imageUri, mode = 'lectures') => {
  const compressed = await compressImage(imageUri);
  const base64Image = await convertImageToBase64(compressed);
  return await sendToBackend(base64Image, mode);
};

// Original functions (kept for backward compatibility)
export const pickAndScanTimetable = async (mode = 'lectures') => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Gallery permission required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) {
    return null;
  }
  
  return await scanTimetableFromImage(result.assets[0].uri, mode);
};

export const takePhotoAndScan = async (mode = 'lectures') => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission required');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) {
    return null;
  }
  
  return await scanTimetableFromImage(result.assets[0].uri, mode);
};

// ========== NEW FUNCTIONS WITH URI ==========
export const pickAndScanTimetableWithUri = async (mode = 'lectures') => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Gallery permission required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) {
    return { uri: null, scanResult: null };
  }
  
  const uri = result.assets[0].uri;
  const scanResult = await scanTimetableFromImage(uri, mode);
  
  return { uri, scanResult };
};

export const takePhotoAndScanWithUri = async (mode = 'lectures') => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission required');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) {
    return { uri: null, scanResult: null };
  }
  
  const uri = result.assets[0].uri;
  const scanResult = await scanTimetableFromImage(uri, mode);
  
  return { uri, scanResult };
};
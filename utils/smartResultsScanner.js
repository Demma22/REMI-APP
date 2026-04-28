// utils/smartResultsScanner.js
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { auth } from '../firebase';

const BACKEND_URL = 'https://ai-backend-yl4w.onrender.com';

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

const sendToBackend = async (base64Image, curriculumId) => {
  const token = await auth.currentUser.getIdToken();
  
  const response = await fetch(`${BACKEND_URL}/scan-results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      image: base64Image,
      curriculum: curriculumId 
    }),
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

export const scanResultsFromImage = async (imageUri, curriculumId = 'uganda') => {
  const base64Image = await convertImageToBase64(imageUri);
  return await sendToBackend(base64Image, curriculumId);
};

// Original functions (kept for backward compatibility)
export const pickAndScanResults = async (curriculumId = 'uganda') => {
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
  
  return await scanResultsFromImage(result.assets[0].uri, curriculumId);
};

export const takePhotoAndScanResults = async (curriculumId = 'uganda') => {
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
  
  return await scanResultsFromImage(result.assets[0].uri, curriculumId);
};

// NEW: Functions that return both URI and scan result
export const pickAndScanResultsWithUri = async (curriculumId = 'uganda') => {
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
  const scanResult = await scanResultsFromImage(uri, curriculumId);
  
  return { uri, scanResult };
};

export const takePhotoAndScanResultsWithUri = async (curriculumId = 'uganda') => {
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
  const scanResult = await scanResultsFromImage(uri, curriculumId);
  
  return { uri, scanResult };
};
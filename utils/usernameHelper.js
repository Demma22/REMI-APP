// utils/usernameHelper.js

// Convert username to Firebase email format
export const usernameToEmail = (username) => {
  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
  return `${cleanUsername}@remi.app`;
};

// Validate username format
export const validateUsernameFormat = (username) => {
  const trimmed = username.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Username is required" };
  }
  
  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: "Username must be less than 20 characters" };
  }
  
  // Allow letters, numbers, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: "Only letters, numbers, underscores (_), and hyphens (-) allowed" 
    };
  }
  
  return { valid: true, error: "" };
};

// Check if username is available
export const checkUsernameAvailability = async (username, firestore) => {
  // We'll implement this later when we add Firestore queries
  return true;
};
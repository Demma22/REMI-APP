// utils/rateReviewTracker.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HAS_RATED: '@remi/has_rated',
  REMINDER_COUNT: '@remi/reminder_count',
  LAST_REMINDER_DATE: '@remi/last_reminder_date',
  FEATURE_USAGE_COUNT: '@remi/feature_usage_count',
};

// Check if user has already rated
export const hasRated = async () => {
  try {
    const rated = await AsyncStorage.getItem(STORAGE_KEYS.HAS_RATED);
    return rated === 'true';
  } catch (error) {
    return false;
  }
};

// Mark that user has rated
export const setHasRated = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_RATED, 'true');
  } catch (error) {
    console.error('Error setting has rated:', error);
  }
};

// Get reminder count
export const getReminderCount = async () => {
  try {
    const count = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    return 0;
  }
};

// Increment reminder count
export const incrementReminderCount = async () => {
  try {
    const current = await getReminderCount();
    const newCount = current + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_COUNT, newCount.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_REMINDER_DATE, new Date().toISOString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing reminder count:', error);
    return 0;
  }
};

// Track feature usage (called after any of the 3 actions)
export const trackFeatureUsage = async () => {
  try {
    const currentStr = await AsyncStorage.getItem(STORAGE_KEYS.FEATURE_USAGE_COUNT);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const newCount = current + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.FEATURE_USAGE_COUNT, newCount.toString());
    console.log(`Feature usage count: ${newCount}`);
    return newCount;
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return 0;
  }
};

// Check if we should show the rate review popup
export const shouldShowRateReview = async () => {
  try {
    // Don't show if already rated
    const rated = await hasRated();
    if (rated) {
      console.log('User already rated - not showing');
      return false;
    }
    
    // Check reminder count (max 3 reminders)
    const reminderCount = await getReminderCount();
    if (reminderCount >= 3) {
      console.log('Max reminders reached (3) - not showing');
      return false;
    }
    
    // Check last reminder date - if reminded within 7 days, don't show again
    const lastReminderDateStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REMINDER_DATE);
    if (lastReminderDateStr) {
      const lastReminderDate = new Date(lastReminderDateStr);
      const daysSinceLastReminder = (new Date() - lastReminderDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastReminder < 7) {
        console.log(`Last reminder was ${daysSinceLastReminder.toFixed(1)} days ago - waiting`);
        return false;
      }
    }
    
    // Get total feature usage count
    const usageCount = await getFeatureUsageCount();
    console.log(`Feature usage count: ${usageCount}, Reminder count: ${reminderCount}`);
    
    // Calculate threshold based on reminder count
    // Reminder 0: show after 1 use
    // Reminder 1: show after 5 more uses (total 6)
    // Reminder 2: show after 5 more uses (total 11)
    const thresholds = [1, 6, 11];
    const threshold = thresholds[reminderCount];
    
    if (usageCount >= threshold) {
      console.log(`Threshold reached (${usageCount} >= ${threshold}) - showing rate review`);
      return true;
    }
    
    console.log(`Not enough uses yet (${usageCount}/${threshold})`);
    return false;
  } catch (error) {
    console.error('Error checking should show rate review:', error);
    return false;
  }
};

// Get feature usage count
export const getFeatureUsageCount = async () => {
  try {
    const count = await AsyncStorage.getItem(STORAGE_KEYS.FEATURE_USAGE_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    return 0;
  }
};

// Reset all tracking (for testing purposes)
export const resetRateReviewTracking = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_RATED);
    await AsyncStorage.removeItem(STORAGE_KEYS.REMINDER_COUNT);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_REMINDER_DATE);
    await AsyncStorage.removeItem(STORAGE_KEYS.FEATURE_USAGE_COUNT);
    console.log('Rate review tracking reset');
  } catch (error) {
    console.error('Error resetting tracking:', error);
  }
};
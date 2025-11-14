// services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Notification permissions not granted!');
  }
};

export const scheduleLectureNotification = async (subject, time) => {
  // For testing, trigger notification after 10 seconds
  // Later, you’ll convert lecture time into a countdown
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming Lecture Reminder',
      body: `Your ${subject} lecture starts at ${time}.`,
    },
    trigger: { seconds: 10 }, // replace with real timing logic later
  });
};

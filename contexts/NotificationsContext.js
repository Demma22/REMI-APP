import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const NotificationsContext = createContext({});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Define background task
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    if (!auth.currentUser) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('Background fetch: Checking for updates');
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const NotificationsProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
    });

    try {
      registerBackgroundTask();
    } catch (err) {
      console.log("Background fetch optional:", err.message);
    }

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      try {
        unregisterBackgroundTask();
      } catch (err) {
        // Ignore
      }
    };
  }, []);

  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('✅ Background fetch registered');
    } catch (err) {
      console.log("⚠️ Background fetch optional:", err.message);
    }
  };

  const unregisterBackgroundTask = async () => {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    } catch (err) {
      // Ignore
    }
  };

  const schedulePushNotification = async (title, body, data = {}, trigger = null) => {
    let finalTrigger;
    
    if (trigger) {
      finalTrigger = { ...trigger };
      
      if (!finalTrigger.type) {
        if (finalTrigger.date instanceof Date) {
          finalTrigger.type = 'date';
          finalTrigger.timestamp = finalTrigger.date.getTime();
          delete finalTrigger.date;
        } else if (finalTrigger.weekday !== undefined) {
          finalTrigger.type = 'calendar';
        } else if (finalTrigger.seconds !== undefined) {
          finalTrigger.type = 'timeInterval';
        } else if (finalTrigger.timestamp !== undefined) {
          finalTrigger.type = 'date';
        } else {
          finalTrigger.type = 'timeInterval';
          finalTrigger.seconds = 2;
        }
      }
      
      if (Platform.OS === 'android' && !finalTrigger.channelId) {
        finalTrigger.channelId = 'default';
      }
    } else {
      finalTrigger = {
        type: 'timeInterval',
        seconds: 2,
      };
      
      if (Platform.OS === 'android') {
        finalTrigger.channelId = 'default';
      }
    }
    
    console.log('📅 Scheduling notification:', { title, trigger: finalTrigger });
    
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: finalTrigger,
    });
  };

  const scheduleLectureNotifications = async (userData) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const lectureNotifications = scheduled.filter(n => n.content.data?.type === 'lecture');
      
      for (const notification of lectureNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      console.log(`🗑️ Cancelled ${lectureNotifications.length} old lecture notifications`);
      
      const username = userData.name || userData.username || 'Student';
      const timetable = userData.timetable || {};
      
      const weekdayMap = {
        'sunday': 1,
        'monday': 2,
        'tuesday': 3,
        'wednesday': 4,
        'thursday': 5,
        'friday': 6,
        'saturday': 7,
      };
      
      let totalScheduled = 0;
      
      for (const dayKey in timetable) {
        const lectures = timetable[dayKey] || [];
        
        for (const lecture of lectures) {
          if (!lecture.start || !lecture.day) continue;
          
          console.log(`\nProcessing ${lecture.name} on ${dayKey} at ${lecture.start}`);
          
          const [time, modifier] = lecture.start.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          
          if (modifier) {
            if (modifier.toUpperCase() === 'PM' && hours < 12) {
              hours += 12;
            }
            if (modifier.toUpperCase() === 'AM' && hours === 12) {
              hours = 0;
            }
          }
          
          const expoWeekday = weekdayMap[dayKey.toLowerCase()];
          if (!expoWeekday) continue;
          
          console.log(`Time: ${hours}:${minutes}, Weekday: ${expoWeekday} (${dayKey})`);
          
          // 30-minute reminder
          let minute30 = minutes - 30;
          let hour30 = hours;
          if (minute30 < 0) {
            minute30 += 60;
            hour30 -= 1;
          }
          if (hour30 < 0) hour30 += 24;
          
          await schedulePushNotification(
            `Lecture Reminder`,
            `${lecture.name} starts in 30 minutes${lecture.room ? ` in ${lecture.room}` : ''}`,
            { 
              type: 'lecture',
              lectureId: lecture.id,
              day: dayKey,
              time: lecture.start 
            },
            {
              type: 'calendar',
              repeats: true,
              weekday: expoWeekday,
              hour: hour30,
              minute: minute30,
              second: 0,
              channelId: 'default',
            }
          );
          totalScheduled++;
          
          // 5-minute reminder
          let minute5 = minutes - 5;
          let hour5 = hours;
          if (minute5 < 0) {
            minute5 += 60;
            hour5 -= 1;
          }
          if (hour5 < 0) hour5 += 24;
          
          await schedulePushNotification(
            `⏰ Time for class!`,
            `${lecture.name} starts in 5 minutes${lecture.room ? ` in ${lecture.room}` : ''}`,
            { 
              type: 'lecture',
              lectureId: lecture.id,
              day: dayKey,
              time: lecture.start 
            },
            {
              type: 'calendar',
              repeats: true,
              weekday: expoWeekday,
              hour: hour5,
              minute: minute5,
              second: 0,
              channelId: 'default',
            }
          );
          totalScheduled++;
        }
      }
      
      console.log(`✅ Total lecture notifications: ${totalScheduled}`);
      return totalScheduled;
    } catch (error) {
      console.error('❌ Error scheduling lecture notifications:', error);
      throw error;
    }
  };

  const scheduleExamNotifications = async (userData) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const examNotifications = scheduled.filter(n => n.content.data?.type === 'exam');
      
      for (const notification of examNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      console.log(`🗑️ Cancelled ${examNotifications.length} old exam notifications`);
      
      const username = userData.name || userData.username || 'Student';
      const exams = Array.isArray(userData.exams) ? userData.exams : [];
      
      let totalScheduled = 0;
      
      for (const exam of exams) {
        if (!exam.date || !exam.name) {
          console.log(`⚠️ Skipping exam - missing date or name:`, exam);
          continue;
        }
        
        console.log(`\nProcessing exam: ${exam.name} on ${exam.date}`);
        
        const examDate = new Date(exam.date);
        
        if (isNaN(examDate.getTime())) {
          console.log(`❌ Invalid date for exam: ${exam.date}`);
          continue;
        }
        
        // 2 days before (9:00 AM)
        const twoDaysBefore = new Date(examDate);
        twoDaysBefore.setDate(examDate.getDate() - 2);
        twoDaysBefore.setHours(9, 0, 0, 0);
        
        if (twoDaysBefore > new Date()) {
          console.log(`⏰ Scheduling 2-day reminder: ${twoDaysBefore.toLocaleString()}`);
          
          await schedulePushNotification(
            `📖 Exam Reminder`,
            `${exam.name} is in 2 days! Time to review ${username}`,
            { 
              type: 'exam',
              examId: exam.id || exam.name,
              examName: exam.name,
              date: exam.date 
            },
            {
              type: 'date',
              timestamp: twoDaysBefore.getTime(),
              channelId: 'default',
            }
          );
          totalScheduled++;
        }
        
        // 1 day before (6:00 PM)
        const oneDayBefore = new Date(examDate);
        oneDayBefore.setDate(examDate.getDate() - 1);
        oneDayBefore.setHours(18, 0, 0, 0);
        
        if (oneDayBefore > new Date()) {
          console.log(`Scheduling 1-day reminder: ${oneDayBefore.toLocaleString()}`);
          
          await schedulePushNotification(
            `Exam Tomorrow`,
            `${exam.name} is tomorrow! Make sure you're prepared ${username}`,
            { 
              type: 'exam',
              examId: exam.id || exam.name,
              examName: exam.name,
              date: exam.date 
            },
            {
              type: 'date',
              timestamp: oneDayBefore.getTime(),
              channelId: 'default',
            }
          );
          totalScheduled++;
        }
        
        // Day of (2 hours before)
        const dayOf = new Date(examDate);
        dayOf.setHours(examDate.getHours() - 2);
        
        if (dayOf > new Date()) {
          console.log(`Scheduling day-of reminder: ${dayOf.toLocaleString()}`);
          
          await schedulePushNotification(
            `Exam Today`,
            `Your ${exam.name} exam is in 2 hours! Good luck ${username}!`,
            { 
              type: 'exam',
              examId: exam.id || exam.name,
              examName: exam.name,
              date: exam.date 
            },
            {
              type: 'date',
              timestamp: dayOf.getTime(),
              channelId: 'default',
            }
          );
          totalScheduled++;
        }
      }
      
      console.log(`✅ Total exam notifications: ${totalScheduled}`);
      return totalScheduled;
    } catch (error) {
      console.error('❌ Error scheduling exam notifications:', error);
      throw error;
    }
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const getScheduledNotifications = async () => {
    return await Notifications.getAllScheduledNotificationsAsync();
  };

  return (
    <NotificationsContext.Provider
      value={{
        expoPushToken,
        schedulePushNotification,
        scheduleLectureNotifications,
        scheduleExamNotifications,
        cancelAllNotifications,
        getScheduledNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('⚠️ Push notification permission not granted');
    return '';
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('📱 Push token:', token);
  
  return token;
}
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { getHolidayNotification } from '../utils/funNotifications';

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
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
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
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap if needed
    });

    try {
      registerBackgroundTask();
    } catch (err) {
      // Background fetch is optional
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
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
    } catch (err) {
      // Background fetch is optional
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
      
      if (Platform.OS === 'android' && finalTrigger.type === 'calendar' && !finalTrigger.channelId) {
        finalTrigger.channelId = 'default';
      }
      
      if (finalTrigger.type === 'calendar' && finalTrigger.repeats === undefined) {
        finalTrigger.repeats = true;
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
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          autoDismiss: false,
          sticky: false,
        },
        trigger: finalTrigger,
      });
      
      return notificationId;
    } catch (error) {
      throw error;
    }
  };

  // Function to get active admin notifications from Firestore
  const getActiveAdminNotifications = async () => {
    try {
      const q = query(
        collection(db, 'fun_notifications'),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return [];
    }
  };

  // Function to get a random notification to send
  const getRandomNotificationToSend = async () => {
    try {
      // Step 1: Check if it's a holiday (hardcoded only)
      const holiday = getHolidayNotification();
      if (holiday && holiday.notification) {
        return {
          source: 'holiday',
          title: holiday.notification.title,
          body: holiday.notification.body,
          category: holiday.notification.category
        };
      }
      
      // Step 2: Get active notifications from Firestore (admin panel)
      const adminNotifications = await getActiveAdminNotifications();
      
      // Step 3: If there are admin notifications, pick a random one
      if (adminNotifications.length > 0) {
        const randomIndex = Math.floor(Math.random() * adminNotifications.length);
        const selected = adminNotifications[randomIndex];
        return {
          source: 'admin',
          title: selected.title,
          body: selected.body,
          category: selected.category,
          id: selected.id
        };
      }
      
      // Step 4: If no admin notifications, DON'T SEND ANYTHING
      console.log('No active admin notifications found. Nothing to send.');
      return null;
      
    } catch (error) {
      console.error('Error getting random notification:', error);
      return null;
    }
  };

  // Helper function to send a random fun notification immediately
  const sendRandomFunNotification = async (userData = null) => {
    try {
      const notification = await getRandomNotificationToSend();
      
      if (notification) {
        await schedulePushNotification(
          notification.title,
          notification.body,
          { 
            type: 'fun', 
            category: notification.category,
            source: notification.source,
            notificationId: notification.id
          },
          {
            type: 'date',
            date: new Date(Date.now() + 1000),
          }
        );
        
        console.log(`✨ Sent ${notification.source} notification: ${notification.title}`);
        
        if (notification.source === 'admin' && notification.id) {
          const notificationRef = doc(db, 'fun_notifications', notification.id);
          await updateDoc(notificationRef, {
            timesSent: increment(1),
            lastSentAt: new Date()
          });
        }
      } else {
        console.log('No notifications to send. Add some in the admin panel!');
      }
      
    } catch (error) {
      console.error('Error sending fun notification:', error);
    }
  };

  // Schedule recurring fun notifications - FIXED VERSION
  const scheduleFunNotifications = async (userData) => {
    try {
      // Cancel existing fun notifications to avoid duplicates
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const funNotifications = scheduled.filter(n => n.content.data?.type === 'fun');
      
      for (const notification of funNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      // Get active admin notifications from Firestore
      const adminNotifications = await getActiveAdminNotifications();
      
      if (adminNotifications.length === 0) {
        console.log('No admin notifications found. Not scheduling any fun notifications.');
        return;
      }
      
      console.log(`Found ${adminNotifications.length} admin notifications. Scheduling random sends...`);
      
      // Schedule actual notifications with random intervals
      const intervals = [3, 2, 4, 3, 2]; // Days between notifications
      let cumulativeDays = 0;
      
      for (let i = 0; i < intervals.length; i++) {
        cumulativeDays += intervals[i];
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + cumulativeDays);
        notificationDate.setHours(12, 0, 0, 0); // Noon
        
        // Pick a random notification from admin list for this scheduled time
        const randomIndex = Math.floor(Math.random() * adminNotifications.length);
        const selectedNotification = adminNotifications[randomIndex];
        
        // Schedule the actual notification content directly
        await schedulePushNotification(
          selectedNotification.title,
          selectedNotification.body,
          { 
            type: 'fun', 
            category: selectedNotification.category || 'fun',
            source: 'scheduled',
            notificationId: selectedNotification.id
          },
          {
            type: 'date',
            date: notificationDate,
          }
        );
        
        console.log(`📅 Scheduled "${selectedNotification.title}" for ${notificationDate.toLocaleDateString()}`);
      }
      
      // Also send one random notification immediately
      await sendRandomFunNotification(userData);
      
      console.log("✅ Fun notifications scheduled successfully");
      
    } catch (error) {
      console.error('Error scheduling fun notifications:', error);
    }
  };

  // Keep your existing scheduleLectureNotifications and scheduleExamNotifications functions here
  // (they remain unchanged)

  const scheduleLectureNotifications = async (userData) => {
    // ... your existing lecture notification code
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const lectureNotifications = scheduled.filter(n => n.content.data?.type === 'lecture');
      
      for (const notification of lectureNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
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
      const now = new Date();
      
      for (const dayKey in timetable) {
        const lectures = timetable[dayKey] || [];
        
        for (const lecture of lectures) {
          if (!lecture.start || !lecture.day) continue;
          
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
          
          let minute30 = minutes - 30;
          let hour30 = hours;
          if (minute30 < 0) {
            minute30 += 60;
            hour30 -= 1;
          }
          if (hour30 < 0) hour30 += 24;
          
          let minute5 = minutes - 5;
          let hour5 = hours;
          if (minute5 < 0) {
            minute5 += 60;
            hour5 -= 1;
          }
          if (hour5 < 0) hour5 += 24;
          
          if (Platform.OS === 'ios') {
            const trigger30min = {
              type: 'calendar',
              repeats: true,
              weekday: expoWeekday,
              hour: hour30,
              minute: minute30,
              second: 0,
            };
            
            const trigger5min = {
              type: 'calendar',
              repeats: true,
              weekday: expoWeekday,
              hour: hour5,
              minute: minute5,
              second: 0,
            };
            
            try {
              await schedulePushNotification(
                `Lecture Reminder`,
                `${lecture.name} starts in 30 minutes${lecture.room ? ` in ${lecture.room}` : ''}`,
                { 
                  type: 'lecture',
                  lectureId: lecture.id || Date.now().toString(),
                  day: dayKey,
                  time: lecture.start,
                  course: lecture.name
                },
                trigger30min
              );
              totalScheduled++;
              
              await schedulePushNotification(
                `Time for class!`,
                `${lecture.name} starts in 5 minutes${lecture.room ? ` in ${lecture.room}` : ''}`,
                { 
                  type: 'lecture',
                  lectureId: lecture.id || Date.now().toString(),
                  day: dayKey,
                  time: lecture.start,
                  course: lecture.name
                },
                trigger5min
              );
              totalScheduled++;
              
            } catch (error) {
              // Continue with other lectures
            }
          } else {
            const today = now.getDay();
            const targetDay = expoWeekday - 1;
            
            let daysUntilTarget = targetDay - today;
            if (daysUntilTarget < 0) {
              daysUntilTarget += 7;
            }
            
            for (let week = 0; week < 20; week++) {
              const notificationDate = new Date(now);
              notificationDate.setDate(now.getDate() + daysUntilTarget + (week * 7));
              
              const date30min = new Date(notificationDate);
              date30min.setHours(hour30, minute30, 0, 0);
              
              const date5min = new Date(notificationDate);
              date5min.setHours(hour5, minute5, 0, 0);
              
              if (date30min > now) {
                try {
                  await schedulePushNotification(
                    `Lecture Reminder`,
                    `${lecture.name} starts in 30 minutes${lecture.room ? ` in ${lecture.room}` : ''}`,
                    { 
                      type: 'lecture',
                      lectureId: `${lecture.id}_${dayKey}_${hour30}_${minute30}_w${week}`,
                      day: dayKey,
                      time: lecture.start,
                      course: lecture.name
                    },
                    {
                      type: 'date',
                      date: date30min,
                    }
                  );
                  totalScheduled++;
                } catch (error) {
                  // Continue
                }
              }
              
              if (date5min > now) {
                try {
                  await schedulePushNotification(
                    `Time for class!`,
                    `${lecture.name} starts in 5 minutes${lecture.room ? ` in ${lecture.room}` : ''}`,
                    { 
                      type: 'lecture',
                      lectureId: `${lecture.id}_${dayKey}_${hour5}_${minute5}_w${week}`,
                      day: dayKey,
                      time: lecture.start,
                      course: lecture.name
                    },
                    {
                      type: 'date',
                      date: date5min,
                    }
                  );
                  totalScheduled++;
                } catch (error) {
                  // Continue
                }
              }
            }
          }
        }
      }
      
      return totalScheduled;
    } catch (error) {
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
      
      const nickname = userData.nickname || userData.name || userData.username || 'Student';
      const exams = Array.isArray(userData.exams) ? userData.exams : [];
      
      let totalScheduled = 0;
      const now = new Date();
      
      for (const exam of exams) {
        if (!exam.date || !exam.name || !exam.start) {
          continue;
        }
        
        let examDate;
        if (exam.date instanceof Date) {
          examDate = exam.date;
        } else if (exam.date.toDate) {
          examDate = exam.date.toDate();
        } else {
          examDate = new Date(exam.date);
        }
        
        if (isNaN(examDate.getTime())) {
          continue;
        }
        
        const [timeStr, period] = exam.start.split(' ');
        let [hours, minutes] = timeStr.split(':').map(Number);
        
        if (period && period.toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        }
        if (period && period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        
        const examDateTime = new Date(
          examDate.getFullYear(),
          examDate.getMonth(),
          examDate.getDate(),
          hours,
          minutes,
          0
        );
        
        const timeUntilExam = examDateTime.getTime() - now.getTime();
        const hoursUntilExam = timeUntilExam / (1000 * 60 * 60);
        
        if (hoursUntilExam < -2) {
          continue;
        }
        
        const twoDaysBefore = new Date(examDateTime);
        twoDaysBefore.setDate(examDateTime.getDate() - 2);
        twoDaysBefore.setHours(9, 0, 0, 0);
        
        if (twoDaysBefore > now) {
          await schedulePushNotification(
            `Exam Reminder`,
            `${exam.name} is in 2 days! Time to review ${nickname}`,
            { 
              type: 'exam',
              examId: exam.id || exam.name,
              examName: exam.name,
              date: examDate.toISOString().split('T')[0]
            },
            {
              type: 'date',
              date: twoDaysBefore,
            }
          );
          totalScheduled++;
        }
        
        const oneDayBefore = new Date(examDateTime);
        oneDayBefore.setDate(examDateTime.getDate() - 1);
        oneDayBefore.setHours(18, 0, 0, 0);
        
        if (oneDayBefore > now) {
          await schedulePushNotification(
            `Exam Tomorrow`,
            `${exam.name} is tomorrow! Make sure you're prepared ${nickname}`,
            { 
              type: 'exam',
              examId: exam.id || exam.name,
              examName: exam.name,
              date: examDate.toISOString().split('T')[0]
            },
            {
              type: 'date',
              date: oneDayBefore,
            }
          );
          totalScheduled++;
        }
        
        const twoHoursBefore = new Date(examDateTime);
        twoHoursBefore.setHours(examDateTime.getHours() - 2);
        
        if (twoHoursBefore > now) {
          await schedulePushNotification(
            `Exam Today`,
            `Your ${exam.name} exam is in 2 hours! Good luck ${nickname}!`,
            { 
              type: 'exam',
              examId: exam.id || exam.name,
              examName: exam.name,
              date: examDate.toISOString().split('T')[0]
            },
            {
              type: 'date',
              date: twoHoursBefore,
            }
          );
          totalScheduled++;
        }
      }
      
      return totalScheduled;
    } catch (error) {
      throw error;
    }
  };

  const cancelLectureNotifications = async (lectureIds) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduled) {
        if (notification.content.data?.type === 'lecture') {
          const lectureId = notification.content.data?.lectureId;
          
          const shouldCancel = lectureIds.some(idToRemove => {
            if (lectureId === idToRemove) return true;
            if (lectureId && lectureId.startsWith(`${idToRemove}_`)) return true;
            return false;
          });
          
          if (shouldCancel) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  const cancelLectureNotificationsById = async (lectureId) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduled) {
        if (notification.content.data?.type === 'lecture') {
          const notificationLectureId = notification.content.data?.lectureId;
          
          if (notificationLectureId === lectureId || 
              (notificationLectureId && notificationLectureId.startsWith(`${lectureId}_`))) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    } catch (error) {
      // Silent fail
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
        scheduleFunNotifications,
        sendRandomFunNotification,
        cancelLectureNotifications,
        cancelLectureNotificationsById,
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
    return '';
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  
  return token;
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
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

  const scheduleLectureNotifications = async (userData) => {
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
          
          // Calculate 30 minutes before
          let minute30 = minutes - 30;
          let hour30 = hours;
          if (minute30 < 0) {
            minute30 += 60;
            hour30 -= 1;
          }
          if (hour30 < 0) hour30 += 24;
          
          // Calculate 5 minutes before
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
            
            // Schedule for 20 weeks (5 months)
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

  const cancelLectureNotifications = async (lectureIds) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduled) {
        if (notification.content.data?.type === 'lecture') {
          const lectureId = notification.content.data?.lectureId;
          
          // Check if this notification belongs to any of the lectures being removed
          const shouldCancel = lectureIds.some(idToRemove => {
            // For iOS: lectureId is the original ID
            if (lectureId === idToRemove) return true;
            
            // For Android: lectureId is in format `${originalId}_${dayKey}_${hour}_${minute}_w${week}`
            if (lectureId && lectureId.startsWith(`${idToRemove}_`)) return true;
            
            return false;
          });
          
          if (shouldCancel) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    } catch (error) {
      // Silent fail - notifications will be re-scheduled next time
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
        cancelLectureNotifications,
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
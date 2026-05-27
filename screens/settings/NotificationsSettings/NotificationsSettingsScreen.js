// screens/settings/NotificationsSettings/NotificationsSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { getUserData } from '../../../services/userDataService';
import { useNotifications } from '../../../hooks/useNotifications';
import { useTheme } from '../../../contexts/ThemeContext';
import NavigationBar from '../../../components/NavigationBar';
import SvgIcon from '../../../components/SvgIcon';
import { getStyles } from './NotificationsSettingsScreen.styles';
import ScreenHeader from '../../../components/ScreenHeader';
import { NotificationsSkeleton } from '../../../components/SkeletonLoader';

export default function NotificationsSettingsScreen({ navigation }) {
  const { theme } = useTheme();
  const { 
    cancelAllNotifications,
    scheduleLectureNotifications,
    scheduleExamNotifications,
  } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activityReminders, setActivityReminders] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  
  useEffect(() => {
    checkNotificationStatus();
  }, []);
  
  const checkNotificationStatus = async () => {
    try {
      setLoading(true);
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const hasNotifications = scheduled.length > 0;
      setNotificationsEnabled(hasNotifications);
      
      // Check if there are any activity notifications
      const hasActivityNotifs = scheduled.some(n => 
        n?.content?.data?.type === 'activity' || n?.content?.data?.type === 'lecture'
      );
      setActivityReminders(hasActivityNotifs);
      
      // Check if there are any exam notifications
      const hasExamNotifs = scheduled.some(n => n?.content?.data?.type === 'exam');
      setExamReminders(hasExamNotifs);
      
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    
    if (!value) {
      await cancelAllNotifications();
      Alert.alert(
        'Notifications Disabled', 
        'All scheduled notifications have been cancelled.'
      );
      await checkNotificationStatus();
    } else {
      Alert.alert(
        'Notifications Enabled', 
        'Add activities or exams to receive reminders.'
      );
    }
  };
  
  const handleToggleActivityReminders = async (value) => {
    setActivityReminders(value);
    
    if (!value) {
      // Cancel all activity/lecture notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const activityNotifications = scheduled.filter(n => 
        n?.content?.data?.type === 'activity' || n?.content?.data?.type === 'lecture'
      );
      
      for (const notification of activityNotifications) {
        if (notification?.identifier) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      Alert.alert('Activity Reminders Disabled', 'All activity reminders have been cancelled.');
      await checkNotificationStatus();
    } else {
      // Reschedule activities based on current timetable
      try {
        const userData = await getUserData();
        if (userData) {
          await scheduleLectureNotifications(userData);
          Alert.alert('Activity Reminders Enabled', 'Activity reminders have been scheduled based on your current timetable.');
          await checkNotificationStatus();
        }
      } catch (error) {
        console.error('Error rescheduling activities:', error);
        Alert.alert('Error', 'Could not schedule activity reminders.');
        setActivityReminders(!value);
      }
    }
  };
  
  const handleToggleExamReminders = async (value) => {
    setExamReminders(value);
    
    if (!value) {
      // Cancel all exam notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const examNotifications = scheduled.filter(n => n?.content?.data?.type === 'exam');
      
      for (const notification of examNotifications) {
        if (notification?.identifier) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      Alert.alert('Exam Reminders Disabled', 'All exam reminders have been cancelled.');
      await checkNotificationStatus();
    } else {
      // Reschedule exams based on current exam data
      try {
        const userData = await getUserData();
        if (userData) {
          await scheduleExamNotifications(userData);
          Alert.alert('Exam Reminders Enabled', 'Exam reminders have been scheduled based on your current exam schedule.');
          await checkNotificationStatus();
        }
      } catch (error) {
        console.error('Error rescheduling exams:', error);
        Alert.alert('Error', 'Could not schedule exam reminders.');
        setExamReminders(!value);
      }
    }
  };
  
  const styles = getStyles(theme);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="NOTIFICATIONS" onBackPress={() => navigation.goBack()} />
        <NotificationsSkeleton />
        <NavigationBar />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScreenHeader title="NOTIFICATIONS" onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        <View style={styles.content}>
          {/* Master Switch */}
          <View style={styles.section}>
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <SvgIcon name="bell" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Push Notifications</Text>
                    <Text style={styles.settingSubtitle}>Master switch for all reminders</Text>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
          
          {/* Reminder Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder Types</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <SvgIcon name="calendar" size={18} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Activities</Text>
                    <Text style={styles.settingDescription}>Lectures, study sessions, meetings</Text>
                  </View>
                </View>
                <Switch
                  value={activityReminders}
                  onValueChange={handleToggleActivityReminders}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                  disabled={!notificationsEnabled}
                />
              </View>
              <View style={styles.reminderDetail}>
                <Text style={styles.reminderDetailText}>30 minutes before • 5 minutes before</Text>
              </View>
            </View>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryLight }]}>
                    <SvgIcon name="book" size={18} color={theme.colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Exams and Tests</Text>
                    <Text style={styles.settingDescription}>Midterms, finals, quizzes</Text>
                  </View>
                </View>
                <Switch
                  value={examReminders}
                  onValueChange={handleToggleExamReminders}
                  trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                  thumbColor="#FFFFFF"
                  disabled={!notificationsEnabled}
                />
              </View>
              <View style={styles.reminderDetail}>
                <Text style={styles.reminderDetailText}>2 days before • 1 day before • 2 hours before</Text>
              </View>
            </View>
          </View>
          
          {/* Info Note */}
          <View style={styles.infoNote}>
            <SvgIcon name="info" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoNoteText}>
              Reminders are automatically updated when you add, edit, or delete activities from your timetable.
            </Text>
          </View>
          
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      <NavigationBar />
    </View>
  );
}
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useNotifications } from '../../../hooks/useNotifications';
import { useTheme } from '../../../contexts/ThemeContext';
import NavigationBar from '../../../components/NavigationBar';
import SvgIcon from '../../../components/SvgIcon';
import { getStyles } from './NotificationsSettingsScreen.styles';

export default function NotificationsSettingsScreen({ navigation }) {
  const { theme } = useTheme();
  const { 
    getScheduledNotifications, 
    cancelAllNotifications,
    scheduleLectureNotifications,
    scheduleExamNotifications,
  } = useNotifications();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lectureReminders, setLectureReminders] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  
  useEffect(() => {
    loadScheduledNotifications();
  }, []);
  
  const loadScheduledNotifications = async () => {
    const notifications = await getScheduledNotifications();
    setScheduledNotifications(notifications);
  };
  
  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    
    if (!value) {
      await cancelAllNotifications();
      Alert.alert('Notifications Disabled', 'All scheduled notifications have been cancelled.');
    } else {
      Alert.alert('Notifications Enabled', 'Please add or update lectures/exams to schedule notifications.');
    }
    
    await loadScheduledNotifications();
  };
  
  const handleRescheduleAll = async () => {
    try {
      // This would require fetching user data and rescheduling
      Alert.alert(
        'Reschedule Notifications',
        'This will reschedule all your lecture and exam notifications. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reschedule', 
            style: 'default',
            onPress: async () => {
              // You would fetch user data and reschedule here
              Alert.alert('Success', 'Notifications have been rescheduled.');
              await loadScheduledNotifications();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule notifications.');
    }
  };
  
  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            Alert.alert('Cleared', 'All notifications have been cancelled.');
            await loadScheduledNotifications();
          }
        }
      ]
    );
  };
  
  const styles = getStyles(theme);
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        
        <View style={styles.content}>
          {/* Enable/Disable All */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <SvgIcon name="bell" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>Enable/disable all notifications</Text>
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
          
          {/* Reminder Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder Types</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <SvgIcon name="book" size={20} color={theme.colors.primary} />
                  <Text style={styles.settingTitle}>Lecture Reminders</Text>
                </View>
                <Switch
                  value={lectureReminders}
                  onValueChange={setLectureReminders}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                  disabled={!notificationsEnabled}
                />
              </View>
              <Text style={styles.settingDescription}>
                Get notified 30 minutes and 5 minutes before each lecture
              </Text>
            </View>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <SvgIcon name="exam" size={20} color={theme.colors.secondary} />
                  <Text style={styles.settingTitle}>Exam Reminders</Text>
                </View>
                <Switch
                  value={examReminders}
                  onValueChange={setExamReminders}
                  trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                  thumbColor="#FFFFFF"
                  disabled={!notificationsEnabled}
                />
              </View>
              <Text style={styles.settingDescription}>
                Get reminded 2 days, 1 day, and 2 hours before exams
              </Text>
            </View>
          </View>
          
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      <NavigationBar />
    </View>
  );
}

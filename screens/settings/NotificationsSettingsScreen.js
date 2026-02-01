import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationBar from '../../components/NavigationBar';
import SvgIcon from '../../components/SvgIcon';

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

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    gap: 2,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  notificationsList: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textPlaceholder,
  },
  moreText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: "600",
  },
  notificationCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 80,
  },
});
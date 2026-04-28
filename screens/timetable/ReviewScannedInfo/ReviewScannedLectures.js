// screens/timetable/ReviewScannedLectures.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import { auth, db } from '../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNotifications } from '../../../hooks/useNotifications';

export default function ReviewScannedLectures({ navigation, route }) {
  const { lectures } = route.params;
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();
  const { scheduleScannedLecturesNotifications } = useNotifications();
  const styles = getStyles(theme);

  const saveLectures = async () => {
    setSaving(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let timetableData = {};
      if (userDoc.exists() && userDoc.data().timetable) {
        timetableData = userDoc.data().timetable;
      }
      
      // Get current semester
      const currentSemester = userDoc.data()?.current_semester || 1;
      
      // Add each lecture to the appropriate day
      lectures.forEach(lecture => {
        const dayKey = lecture.day.toLowerCase();
        if (!timetableData[dayKey]) {
          timetableData[dayKey] = [];
        }
        
        timetableData[dayKey].push({
          name: lecture.name,
          start: lecture.start,
          end: lecture.end || '',
          lecturer: lecture.lecturer || '',
          room: lecture.room || '',
          semester: currentSemester,
          day: lecture.day,
          id: Date.now() + Math.random() * 1000,
          createdAt: new Date().toISOString()
        });
      });
      
      await setDoc(userDocRef, { timetable: timetableData }, { merge: true });
      
      // ========== SCHEDULE NOTIFICATIONS FOR SCANNED LECTURES ==========
      try {
        await scheduleScannedLecturesNotifications(lectures);
        console.log(`✅ Scheduled notifications for ${lectures.length} scanned lectures`);
      } catch (notifError) {
        console.error("Notification scheduling error:", notifError);
        // Continue even if notification scheduling fails
      }
      
      Alert.alert('Success', `${lectures.length} lectures added successfully!`);
      navigation.navigate('Timetable');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save lectures');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Lectures</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
          Found {lectures.length} lectures
        </Text>
        
        {lectures.map((lecture, idx) => (
          <View key={idx} style={[styles.lectureCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.lectureName, { color: theme.colors.textPrimary }]}>
              {lecture.name}
            </Text>
            <View style={styles.detailRow}>
              <SvgIcon name="calendar" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {lecture.day}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <SvgIcon name="clock" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {lecture.start} {lecture.end ? `- ${lecture.end}` : ''}
              </Text>
            </View>
            {lecture.lecturer && lecture.lecturer !== "" && (
              <View style={styles.detailRow}>
                <SvgIcon name="user" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {lecture.lecturer}
                </Text>
              </View>
            )}
            {lecture.room && lecture.room !== "" && (
              <View style={styles.detailRow}>
                <SvgIcon name="location" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  Room {lecture.room}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.secondary }]}
          onPress={saveLectures}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save All Lectures</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  countText: {
    fontSize: 14,
    marginBottom: 16,
  },
  lectureCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  lectureName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
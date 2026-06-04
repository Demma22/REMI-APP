import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import ScreenHeader from '../../../components/ScreenHeader';
import { getUserData, updateUserData } from '../../../services/userDataService';
import { useNotifications } from '../../../hooks/useNotifications';

const PURPLE = '#535FFD';
const DAY_ABBR = { monday:'MON', tuesday:'TUES', wednesday:'WED', thursday:'THURS', friday:'FRI', saturday:'SAT', sunday:'SUN' };

export default function ReviewScannedLectures({ navigation, route }) {
  const { lectures } = route.params;
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();
  const { scheduleScannedLecturesNotifications } = useNotifications();

  const confirmAndSave = () => {
    Alert.alert(
      'Ready to save?',
      'Make sure all activities look accurate. You can always edit them from your schedule later.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Save', style: 'default', onPress: saveLectures },
      ]
    );
  };

  const saveLectures = async () => {
    setSaving(true);
    try {
      const userData = await getUserData();
      let timetableData = userData?.timetable || {};
      const currentSemester = userData?.currentSemester || 1;

      lectures.forEach(lecture => {
        const dayKey = lecture.day.toLowerCase();
        if (!timetableData[dayKey]) timetableData[dayKey] = [];
        timetableData[dayKey].push({
          name: lecture.name,
          start: lecture.start,
          end: lecture.end || '',
          lecturer: lecture.lecturer || '',
          room: lecture.room || '',
          semester: currentSemester,
          day: lecture.day,
          id: Date.now() + Math.random() * 1000,
          createdAt: new Date().toISOString(),
        });
      });

      await updateUserData({ timetable: timetableData });

      try {
        await scheduleScannedLecturesNotifications(lectures);
      } catch (e) {
        console.error('Notification scheduling error:', e);
      }

      Alert.alert('Saved', `${lectures.length} ${lectures.length === 1 ? 'activity' : 'activities'} added to your schedule!`);
      navigation.navigate('Timetable');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save activities. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container(theme)}>
      <ScreenHeader title="Review Activities" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.countBadge}>
          <Text style={s.countText}>{lectures.length} {lectures.length === 1 ? 'activity' : 'activities'} found</Text>
        </View>

        {lectures.map((item, idx) => {
          const dayKey = item.day?.toLowerCase();
          const dayAbbr = DAY_ABBR[dayKey] || item.day?.toUpperCase().slice(0, 3) || '—';
          const timeStr = item.end ? `${item.start} – ${item.end}` : item.start;

          return (
            <View key={idx} style={s.card}>
              <View style={s.cardLeft}>
                <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
                <View style={s.cardDetails}>
                  <View style={s.detailRow}>
                    <SvgIcon name="clock" size={13} color="rgba(255,255,255,0.65)" />
                    <Text style={s.detailText}>{timeStr}</Text>
                  </View>
                  {item.lecturer ? (
                    <View style={s.detailRow}>
                      <SvgIcon name="user" size={13} color="rgba(255,255,255,0.65)" />
                      <Text style={s.detailText}>{item.lecturer}</Text>
                    </View>
                  ) : null}
                  {item.room ? (
                    <View style={s.detailRow}>
                      <SvgIcon name="location" size={13} color="rgba(255,255,255,0.65)" />
                      <Text style={s.detailText}>{item.room}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={s.cardRight}>
                <Text style={s.dayAbbr}>{dayAbbr}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.footer(theme)}>
        <TouchableOpacity
          style={s.saveBtn}
          onPress={confirmAndSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.saveBtnText}>Save to Schedule</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = {
  container: (theme) => ({ flex: 1, backgroundColor: theme.colors.background }),
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },

  countBadge: {
    backgroundColor: 'rgba(83,95,253,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: PURPLE,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 22,
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 64,
  },
  dayAbbr: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'right',
  },

  footer: (theme) => ({
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  }),
  saveBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
};

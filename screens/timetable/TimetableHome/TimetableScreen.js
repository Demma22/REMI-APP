import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { getUserData, updateUserData } from "../../../services/userDataService";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import ScreenHeader from "../../../components/ScreenHeader";
import AddActivitySheet from "../../../components/AddActivitySheet";
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { getStyles } from "./TimetableScreen.styles";
import { TimetableSkeleton } from "../../../components/SkeletonLoader";

const PURPLE = '#535FFD';

const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DAY_ABBR = {
  monday: 'MON', tuesday: 'TUES', wednesday: 'WED',
  thursday: 'THURS', friday: 'FRI', saturday: 'SAT', sunday: 'SUN',
};

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const formatTime = (t) => {
  if (!t || t === 'TBD') return t || '';
  // 12hr with AM/PM: "8:00 AM" → "8am", "12:15 PM" → "12:15pm"
  const m12 = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (m12) {
    return m12[2] === '00'
      ? `${m12[1]}${m12[3].toLowerCase()}`
      : `${m12[1]}:${m12[2]}${m12[3].toLowerCase()}`;
  }
  // 24hr: "08:00" → "8am", "14:30" → "2:30pm"
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h = parseInt(m24[1], 10);
    const min = m24[2];
    const period = h >= 12 ? 'pm' : 'am';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return min === '00' ? `${h}${period}` : `${h}:${min}${period}`;
  }
  return t;
};

export default function TimetableScreen({ navigation }) {
  const { theme } = useTheme();
  const { cancelLectureNotifications } = useNotifications();
  const styles = getStyles(theme);

  const [timetable, setTimetable] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [selectedActivity, setSelectedActivity] = useState(null); // { lecture, dayKey, index }
  const [editSheetDay, setEditSheetDay] = useState(null);         // dayKey string
  const addSheetRef = useRef(null);

  useEffect(() => {
    loadData();
    const focus = navigation.addListener("focus", loadData);
    return focus;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      if (userData) {
        setTimetable(userData.timetable || {});
        if (userData.avatar_url) setProfileImage(userData.avatar_url);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleDeleteLecture = async (dayKey, lectureIndex, lecture) => {
    Alert.alert("Delete Activity", `Are you sure you want to delete "${lecture.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            if (lecture.id) await cancelLectureNotifications([lecture.id]);
            const dayLectures = [...(timetable[dayKey] || [])];
            dayLectures.splice(lectureIndex, 1);
            const updated = { ...timetable, [dayKey]: dayLectures };
            await updateUserData({ timetable: updated });
            setTimetable(updated);
          } catch { Alert.alert("Error", "Failed to delete activity"); }
        }
      }
    ]);
  };

  const handleEditLecture = (dayKey, lectureIndex, lecture) => {
    setEditSheetDay(null);
    setSelectedActivity(null);
    navigation.navigate("EditTimetable", { initialDay: dayKey, initialLectureIndex: lectureIndex, lecture });
  };

  const addBtn = (
    <TouchableOpacity
      onPress={() => addSheetRef.current?.open()}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: PURPLE, justifyContent: "center", alignItems: "center" }}
      activeOpacity={0.8}
    >
      <SvgIcon name="plus" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Weekly Schedule" onBackPress={() => navigation.goBack()} rightElement={addBtn} />
        <TimetableSkeleton />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Weekly Schedule" onBackPress={() => navigation.goBack()} rightElement={addBtn} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PURPLE]} />}
      >
        <View style={styles.content}>
          <View style={styles.timetableContainer}>
            {daysOrder.map((dayKey) => {
              const list = timetable[dayKey] || [];
              const hasActivities = list.length > 0;
              const abbr = DAY_ABBR[dayKey];

              return (
                <View key={dayKey} style={[styles.weekDayCard, hasActivities ? styles.weekDayCardPurple : styles.weekDayCardEmpty]}>
                  <View style={styles.weekDayCardContent}>

                    {/* Left: activity rows or empty state */}
                    <View style={styles.weekDayLeft}>
                      {hasActivities ? (
                        list.map((lecture, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <View style={styles.activitySeparator} />}
                            <TouchableOpacity
                              style={styles.activityRow}
                              onPress={() => setSelectedActivity({ lecture, dayKey, index: i })}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.activityTime}>{formatTime(lecture.start)}</Text>
                              <Text style={styles.activityName} numberOfLines={1}>{lecture.name}</Text>
                            </TouchableOpacity>
                          </React.Fragment>
                        ))
                      ) : (
                        <Text style={styles.noActivityTextEmpty}>No activities yet</Text>
                      )}
                    </View>

                    {/* Right: day label + action button */}
                    <View style={styles.weekDayRight}>
                      <View style={styles.dayLabelContainer}>
                        <Text style={hasActivities ? styles.dayAbbrText : styles.dayAbbrTextDark}>{abbr}</Text>
                        <Text style={hasActivities ? styles.dayWordText : styles.dayWordTextDark}>day</Text>
                      </View>
                      <TouchableOpacity
                        style={hasActivities ? styles.editDayBtn : styles.addDayBtn}
                        onPress={() => addSheetRef.current?.open(dayKey)}
                      >
                        <Text style={hasActivities ? styles.editDayBtnText : styles.addDayBtnText}>ADD</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ── Activity Detail Popup ── */}
      <Modal visible={!!selectedActivity} transparent animationType="fade" onRequestClose={() => setSelectedActivity(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedActivity(null)}>
          <View style={styles.activityDetailCard}>
            <View style={styles.activityDetailHeader}>
              <Text style={styles.activityDetailName}>{selectedActivity?.lecture?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityDetailBody}>
              {(selectedActivity?.lecture?.start) && (
                <View style={styles.detailRow}>
                  <SvgIcon name="clock" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailText}>
                    {selectedActivity.lecture.start}
                    {selectedActivity.lecture.end ? ` – ${selectedActivity.lecture.end}` : ''}
                  </Text>
                </View>
              )}
              {(selectedActivity?.lecture?.location || selectedActivity?.lecture?.room) && (
                <View style={styles.detailRow}>
                  <SvgIcon name="location" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailText}>{selectedActivity?.lecture?.location || selectedActivity?.lecture?.room}</Text>
                </View>
              )}
              {selectedActivity?.lecture?.lecturer && (
                <View style={styles.detailRow}>
                  <SvgIcon name="user" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailText}>{selectedActivity.lecture.lecturer}</Text>
                </View>
              )}
              {selectedActivity?.lecture?.type && (
                <View style={styles.detailRow}>
                  <SvgIcon name="tag" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailText}>{capitalize(selectedActivity.lecture.type)}</Text>
                </View>
              )}
              {selectedActivity?.lecture?.notes && (
                <View style={styles.detailRow}>
                  <SvgIcon name="edit" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailText}>{selectedActivity.lecture.notes}</Text>
                </View>
              )}
            </View>

            <View style={styles.activityDetailActions}>
              <TouchableOpacity
                style={styles.detailDeleteBtn}
                onPress={() => {
                  const { dayKey, index, lecture } = selectedActivity;
                  setSelectedActivity(null);
                  handleDeleteLecture(dayKey, index, lecture);
                }}
              >
                <Text style={styles.detailDeleteText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailEditBtn}
                onPress={() => handleEditLecture(selectedActivity.dayKey, selectedActivity.index, selectedActivity.lecture)}
              >
                <Text style={styles.detailEditText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Selection Bottom Sheet ── */}
      <Modal visible={!!editSheetDay} transparent animationType="slide" onRequestClose={() => setEditSheetDay(null)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setEditSheetDay(null)}>
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select activity to edit</Text>
            <Text style={styles.sheetSubtitle}>{editSheetDay ? capitalize(editSheetDay) : ''}</Text>
            {editSheetDay && (timetable[editSheetDay] || []).map((lecture, i) => (
              <TouchableOpacity
                key={i}
                style={styles.sheetItem}
                onPress={() => handleEditLecture(editSheetDay, i, lecture)}
              >
                <View style={styles.sheetItemLeft}>
                  <Text style={styles.sheetItemTime}>{formatTime(lecture.start)}</Text>
                  <Text style={styles.sheetItemName}>{lecture.name}</Text>
                </View>
                <Text style={styles.sheetChevron}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setEditSheetDay(null)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <NavigationBar />

      <AddActivitySheet ref={addSheetRef} onSaved={loadData} />
    </View>
  );
}

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
import { getUserData, updateUserData } from "../../../services/userDataService";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import ScreenHeader from "../../../components/ScreenHeader";
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
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return t;
  return m[2] === '00' ? `${m[1]}${m[3].toLowerCase()}` : `${m[1]}:${m[2]}${m[3].toLowerCase()}`;
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
  const [showAddSheet, setShowAddSheet] = useState(false);

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

  const handleScanTimetable = () => { setShowAddSheet(false); navigation.navigate("AITimetableScanner", { mode: "lectures" }); };
  const handleAddManually = () => { setShowAddSheet(false); navigation.navigate("AddActivity"); };

  const profileAvatar = (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={styles.headerAvatar} />
      ) : (
        <View style={[styles.headerAvatarPlaceholder, { backgroundColor: PURPLE }]}>
          <SvgIcon name="user" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Weekly Schedule" onBackPress={() => navigation.goBack()} rightElement={profileAvatar} />
        <TimetableSkeleton />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Weekly Schedule" onBackPress={() => navigation.goBack()} rightElement={profileAvatar} />

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
                <View key={dayKey} style={[styles.weekDayCard, hasActivities ? styles.weekDayCardPurple : styles.weekDayCardBlack]}>
                  <View style={styles.weekDayCardContent}>

                    {/* Left: activity rows or empty state */}
                    <View style={styles.weekDayLeft}>
                      {hasActivities ? (
                        list.map((lecture, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.activityRow}
                            onPress={() => setSelectedActivity({ lecture, dayKey, index: i })}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.activityTime}>{formatTime(lecture.start)}</Text>
                            <Text style={styles.activityName} numberOfLines={1}>{lecture.name}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noActivityText}>No activities yet</Text>
                      )}
                    </View>

                    {/* Right: day label + action button */}
                    <View style={styles.weekDayRight}>
                      <View style={styles.dayLabelContainer}>
                        <Text style={styles.dayAbbrText}>{abbr}</Text>
                        <Text style={styles.dayWordText}>day</Text>
                      </View>
                      <TouchableOpacity
                        style={hasActivities ? styles.editDayBtn : styles.addDayBtn}
                        onPress={() => hasActivities ? setEditSheetDay(dayKey) : setShowAddSheet(true)}
                      >
                        <Text style={hasActivities ? styles.editDayBtnText : styles.addDayBtnText}>
                          {hasActivities ? 'EDIT' : 'ADD'}
                        </Text>
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

      {/* ── Add Menu Bottom Sheet ── */}
      <Modal visible={showAddSheet} transparent animationType="slide" onRequestClose={() => setShowAddSheet(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowAddSheet(false)}>
          <View style={[styles.bottomSheet, styles.addSheetPurple]} onStartShouldSetResponder={() => true}>
            <View style={[styles.sheetHandle, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
            <Text style={[styles.sheetTitle, { color: '#FFFFFF' }]}>Add to Timetable</Text>

            <TouchableOpacity style={styles.addSheetItem} onPress={handleScanTimetable}>
              <View style={styles.addSheetIconBg}>
                <SvgIcon name="scan" size={22} color={PURPLE} />
              </View>
              <View style={styles.addSheetTextContainer}>
                <Text style={styles.addSheetItemTitle}>Scan with AI</Text>
                <Text style={styles.addSheetItemDesc}>Extract timetable from a photo</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addSheetItem} onPress={handleAddManually}>
              <View style={styles.addSheetIconBg}>
                <SvgIcon name="edit" size={22} color={PURPLE} />
              </View>
              <View style={styles.addSheetTextContainer}>
                <Text style={styles.addSheetItemTitle}>Add Manually</Text>
                <Text style={styles.addSheetItemDesc}>Enter lecture details by hand</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetCancelBtn, styles.sheetCancelWhite]} onPress={() => setShowAddSheet(false)}>
              <Text style={[styles.sheetCancelText, { color: '#FFFFFF' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <NavigationBar />
    </View>
  );
}

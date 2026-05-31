import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  Dimensions, Animated, StyleSheet, Platform,
  TextInput, KeyboardAvoidingView, Modal, ActivityIndicator, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReAnimated from "react-native-reanimated";
import { Svg, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUserData, getCurrentUserInfo, updateUserData } from "../../services/userDataService";
import { useNotifications } from "../../hooks/useNotifications";
import { trackFeatureUsage, shouldShowRateReview } from "../../utils/rateReviewTracker";
import TimePicker from "../timetable/components/TimePicker";
import SvgIcon from "../../components/SvgIcon";
import NavigationBar from "../../components/NavigationBar";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SHEET_H_SMALL = SCREEN_H * 0.50;
const SHEET_H_LARGE = SCREEN_H * 0.92;

const DAYS = [
  { label: "MON", value: "Monday" },
  { label: "TUE", value: "Tuesday" },
  { label: "WED", value: "Wednesday" },
  { label: "THUR", value: "Thursday" },
  { label: "FRI", value: "Friday" },
  { label: "SAT", value: "Saturday" },
  { label: "SUN", value: "Sunday" },
];
const CATEGORIES = [
  { id: "study", label: "Study" },
  { id: "lecture", label: "Lecture" },
  { id: "break", label: "Break" },
];
const PICKER_THEME = {
  colors: {
    primary: "#535FFD", textPrimary: "#111111",
    textSecondary: "#666666", card: "#FFFFFF",
    border: "#E0E0E0", primaryLight: "#ECEEFF",
  },
};
const PICKER_STYLES = StyleSheet.create({
  timePickerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  timePickerContent: { width: "90%", borderRadius: 24, padding: 20 },
  timePickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  timePickerTitle: { fontSize: 18, fontWeight: "700" },
  timePickerColumns: { flexDirection: "row", justifyContent: "space-between", height: 200 },
  timePickerColumn: { flex: 1, alignItems: "center" },
  timePickerColumnLabel: { fontSize: 14, marginBottom: 8 },
  pickerList: { alignItems: "center" },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginVertical: 2 },
  pickerItemSelected: { backgroundColor: "#ECEEFF" },
  pickerItemText: { fontSize: 20, color: "#111111" },
  pickerItemTextSelected: { color: "#535FFD", fontWeight: "700" },
  timePickerConfirmBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  timePickerConfirmText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});

// ── Helpers ──────────────────────────────────────────────────────
function parseStoredTime(t) {
  if (!t) return 0;
  const m = /^(\d+):(\d+)/.exec(t.trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function formatDisplayTime(t) {
  if (!t) return "";
  const mins = parseStoredTime(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${display}${period}` : `${display}:${String(m).padStart(2, "0")}${period}`;
}

function formatTimeForStorage(hour, minute, period) {
  let h = hour;
  if (period === "PM" && hour !== 12) h = hour + 12;
  if (period === "AM" && hour === 12) h = 0;
  return `${h}:${minute} ${period}`;
}

function formatTimeDisplay(hour, minute, period) {
  return `${hour}:${minute} ${period}`;
}

function getDayParts() {
  const abbr = new Date().toLocaleString("en-US", { weekday: "short" });
  return [abbr.toUpperCase(), "day"];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

// ── Skeleton ─────────────────────────────────────────────────────
function SkeletonBone({ style }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: "#E2E8F0", borderRadius: 12, opacity: anim }, style]} />;
}

function HomeSkeleton() {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <SkeletonBone style={{ height: 150, marginHorizontal: 20, marginTop: 20, borderRadius: 24 }} />
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 28, gap: 10 }}>
        {[0, 1, 2].map(i => <SkeletonBone key={i} style={{ flex: 1, height: 88, borderRadius: 44 }} />)}
      </View>
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 24, gap: 12 }}>
        <SkeletonBone style={{ flex: 1, height: 190, borderRadius: 20 }} />
        <View style={{ flex: 1, gap: 12 }}>
          <SkeletonBone style={{ height: 89, borderRadius: 20 }} />
          <SkeletonBone style={{ height: 89, borderRadius: 20 }} />
        </View>
      </View>
      <SkeletonBone style={{ height: 72, marginHorizontal: 20, marginTop: 24, borderRadius: 20 }} />
    </ScrollView>
  );
}

// ── Activity Circle ───────────────────────────────────────────────
const RING = 88;
const STROKE = 12;
const RADIUS = RING / 2 - STROKE / 2;
const CIRC = 2 * Math.PI * RADIUS;

function ActivityCircle({ activity, width }) {
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();

  const calc = () => {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const s = parseStoredTime(activity.start);
    const e = parseStoredTime(activity.end);
    if (e <= s || cur < s) return 0;
    if (cur >= e) return 1;
    return (cur - s) / (e - s);
  };

  useEffect(() => {
    const update = () => setProgress(calc());
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const isDone = progress >= 1;
  const isLive = progress > 0 && progress < 1;
  const offset = CIRC * (1 - progress);
  const innerBg = theme.colors.background;
  const innerText = theme.colors.textPrimary;
  const trackColor = isDone ? "#535FFD" : "#E2E8F0";

  return (
    <View style={{ alignItems: "center", ...(width ? { width } : { flex: 1 }) }}>
      <View style={{ width: RING, height: RING }}>
        <Svg width={RING} height={RING} style={{ position: "absolute" }}>
          <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={trackColor} strokeWidth={STROKE} fill="none" />
          {isLive && (
            <Circle
              cx={RING / 2} cy={RING / 2} r={RADIUS}
              stroke="#535FFD" strokeWidth={STROKE} fill="none"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              strokeLinecap="round" rotation="-90" origin={`${RING / 2},${RING / 2}`}
            />
          )}
        </Svg>
        <View style={{
          position: "absolute", top: STROKE, left: STROKE, right: STROKE, bottom: STROKE,
          borderRadius: (RING - STROKE * 2) / 2,
          backgroundColor: innerBg,
          justifyContent: "center", alignItems: "center",
        }}>
          <Text style={{ fontSize: 9, fontWeight: "700", color: innerText, textAlign: "center", paddingHorizontal: 4 }} numberOfLines={2}>
            {activity.course}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 10, marginTop: 7, fontWeight: isDone || isLive ? "600" : "400", color: isDone ? "#535FFD" : isLive ? "#535FFD" : "#AAAAAA" }}>
        {isDone ? "Done" : isLive ? "Live" : formatDisplayTime(activity.start)}
      </Text>
    </View>
  );
}

// ── Today Card ────────────────────────────────────────────────────
function TodayCard({ lectures, navigation, focusSessions, focusTodayMins }) {
  const sessionLabel = `${focusSessions} Focus session${focusSessions !== 1 ? "s" : ""}`;
  const minuteLabel = focusTodayMins === 1 ? "1 minute" : `${focusTodayMins} minutes`;

  return (
    <View style={s.todayCard}>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Text style={s.todayLabel}>Today</Text>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <SvgIcon name="focus" size={13} color="#535FFD" />
            <Text style={s.todayStatText}>{sessionLabel}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <SvgIcon name="clock" size={13} color="#535FFD" />
            <Text style={s.todayStatText}>{minuteLabel}</Text>
          </View>
        </View>
      </View>

      {/* Activity rows */}
      {lectures.length === 0 ? (
        <Text style={{ color: "#AAAAAA", fontSize: 14, paddingVertical: 8 }}>No activities today</Text>
      ) : (
        lectures.slice(0, 4).map((lec, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={{ height: 1, backgroundColor: "#EEEEFF" }} />}
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 8 }}>
              <Text style={s.todayTimeRange} numberOfLines={1}>{formatDisplayTime(lec.start)}</Text>
              <Text style={s.todayCourse} numberOfLines={1}>{lec.course}</Text>
              <TouchableOpacity
                style={s.focusModeBtn}
                onPress={() => navigation.navigate("Focus", { quickStart: true })}
                activeOpacity={0.85}
              >
                <Text style={s.focusModeBtnText}>Focus Mode</Text>
              </TouchableOpacity>
            </View>
          </React.Fragment>
        ))
      )}
      {lectures.length > 4 && (
        <TouchableOpacity onPress={() => navigation.navigate("Timetable")}>
          <Text style={{ color: "#AAAAAA", fontSize: 11, marginTop: 6 }}>+{lectures.length - 4} more</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Action Cards ──────────────────────────────────────────────────
function ActionCards({ navigation, onCreatePress, hasSchedule }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 24 }}>
      <TouchableOpacity
        style={s.createCard}
        onPress={hasSchedule ? () => navigation.navigate("Timetable") : onCreatePress}
        activeOpacity={0.85}
      >
        <View>
          <Text style={s.createTitle}>{hasSchedule ? "MY" : "CREATE"}</Text>
          <Text style={s.createSubtitle}>Schedule</Text>
          {!hasSchedule && <Text style={s.createDesc}>Add your Timetable</Text>}
        </View>
        <View style={s.createIconPill}>
          <SvgIcon name="calendar" size={30} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 12 }}>
        <TouchableOpacity style={s.addCard} onPress={() => navigation.navigate("Deadlines")} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={s.addSubtitle}>Deadlines</Text>
          </View>
          <SvgIcon name="bell" size={32} color="#535FFD" />
        </TouchableOpacity>

        <TouchableOpacity style={s.addCard} onPress={() => navigation.navigate("Focus")} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={s.addSubtitle}>Focus</Text>
          </View>
          <SvgIcon name="focus" size={32} color="#535FFD" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Academic Progress Card ────────────────────────────────────────
function GPACard({ gpaSummary, onPress }) {
  if (!gpaSummary || gpaSummary.length === 0) return null;

  return (
    <TouchableOpacity style={s.gpaCard} onPress={onPress} activeOpacity={0.85}>
      <View>
        <Text style={s.gpaLabel}>Academic</Text>
        <Text style={s.gpaLabel}>Progress</Text>
        <Text style={[s.gpaLabel, { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "500" }]}>(GPA)</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        {gpaSummary.slice(0, 4).map((item, i) => (
          <View key={i} style={{ alignItems: "center" }}>
            <Text style={s.gpaValue}>{item.gpa}</Text>
            <Text style={s.gpaSem}>{item.semester}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [todayLectures, setTodayLectures] = useState([]);
  const [gpaSummary, setGpaSummary] = useState([]);
  const [upcomingExam, setUpcomingExam] = useState(null);
  const [focusStreak, setFocusStreak] = useState(0);
  const [focusTodayMins, setFocusTodayMins] = useState(0);
  const [focusSessions, setFocusSessions] = useState(0);
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState("options");
  const sheetStepRef = useRef("options");
  const sheetAnim = useRef(new Animated.Value(SHEET_H_SMALL)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Form state for "manual" step
  const [activityName, setActivityName] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [formCategory, setFormCategory] = useState("study");
  const [formLocation, setFormLocation] = useState("");
  const [instructor, setInstructor] = useState("");
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(1);

  const { scheduleActivityNotifications } = useNotifications();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const setSheetStepTracked = (step) => {
    sheetStepRef.current = step;
    setSheetStep(step);
  };

  const resetForm = () => {
    setActivityName("");
    setSelectedDay("Monday");
    setStartHour(9); setStartMinute("00"); setStartPeriod("AM");
    setEndHour(10); setEndMinute("00"); setEndPeriod("AM");
    setFormCategory("study");
    setFormLocation("");
    setInstructor("");
  };

  const openSheet = () => {
    sheetAnim.setValue(SHEET_H_SMALL);
    setSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    const dist = sheetStepRef.current === "manual" ? SHEET_H_LARGE : SHEET_H_SMALL;
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: dist, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => { setSheetOpen(false); setSheetStepTracked("options"); resetForm(); });
  };

  const handleSaveActivity = async () => {
    if (!activityName.trim()) {
      Alert.alert("Error", "Please enter an activity name");
      return;
    }
    setSaving(true);
    try {
      const existing = await getUserData();
      const timetable = existing?.timetable || {};
      const dayKey = selectedDay.toLowerCase();
      if (!timetable[dayKey]) timetable[dayKey] = [];
      const startTime = formatTimeForStorage(startHour, startMinute, startPeriod);
      const endTime = formatTimeForStorage(endHour, endMinute, endPeriod);
      timetable[dayKey] = [
        ...timetable[dayKey],
        {
          name: activityName.trim(),
          start: startTime,
          end: endTime,
          type: formCategory,
          lecturer: instructor.trim(),
          location: formLocation.trim(),
          reminder: true,
          semester: currentSemester,
          day: selectedDay,
          id: Date.now() + Math.random(),
          createdAt: new Date().toISOString(),
          isActivity: true,
        },
      ];
      await updateUserData({ timetable });
      try {
        await scheduleActivityNotifications({ name: activityName.trim(), day: selectedDay, startTime, reminderMinutes: 30 });
      } catch {}
      closeSheet();
      await trackFeatureUsage();
      const showRate = await shouldShowRateReview();
      if (showRate) navigation.navigate("RateReviewModal");
    } catch {
      Alert.alert("Error", "Could not save activity");
    } finally {
      setSaving(false);
    }
  };

  const loadFocusStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [sessionsRaw, streakRaw] = await Promise.all([
        AsyncStorage.getItem("@remi_focus_sessions"),
        AsyncStorage.getItem("@remi_focus_streak"),
      ]);
      const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];
      const todaySessions = sessions.filter(s => s.date === today);
      setFocusTodayMins(todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0));
      setFocusSessions(todaySessions.length);
      const streakData = streakRaw ? JSON.parse(streakRaw) : { count: 0 };
      setFocusStreak(streakData.count || 0);
    } catch {}
  };

  useEffect(() => {
    loadUserData();
    loadHomeData();
    checkOnboardingStatus();
    loadFocusStats();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
      loadHomeData();
      checkOnboardingStatus();
      loadFocusStats();
    });
    return unsubscribe;
  }, [navigation]);

  const checkOnboardingStatus = async () => {
    try {
      const ud = await getUserData();
      if (ud) {
        const hasNew = ud.heardFrom && ud.purpose?.length > 0 && ud.studyStage && ud.nickname;
        setNeedsOnboarding(!hasNew);
      }
    } catch {}
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const ud = await getUserData();
      if (ud) {
        loadTodaysLectures(ud);
        loadGPASummary(ud);
        loadUpcomingExam(ud);
        setCurrentSemester(ud.currentSemester || ud.current_semester || 1);
        const timetable = ud.timetable || {};
        setHasSchedule(Object.values(timetable).some(day => Array.isArray(day) && day.length > 0));
      }
    } catch (err) {
      console.error("Error loading home data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysLectures = (userData) => {
    try {
      const day = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
      const timetable = userData.timetable || {};
      const currentSemester = userData.current_semester || 1;
      const todaysLectures = timetable[day]?.filter((l) => l.semester === currentSemester) || [];
      setTodayLectures(
        todaysLectures.map((l) => ({
          course: l.name, time: `${l.start} - ${l.end}`,
          start: l.start, end: l.end, room: l.room,
        }))
      );
    } catch { setTodayLectures([]); }
  };

  const loadGPASummary = (userData) => {
    try {
      const gpaData = userData.gpa_data || {};
      const summary = Object.keys(gpaData)
        .filter((k) => gpaData[k]?.gpa)
        .map((k) => ({ semester: `Sem ${k.replace("semester", "")}`, gpa: parseFloat(gpaData[k].gpa).toFixed(1) }))
        .sort((a, b) => parseInt(a.semester.replace("Sem ", "")) - parseInt(b.semester.replace("Sem ", "")));
      setGpaSummary(summary);
    } catch { setGpaSummary([]); }
  };

  const loadUpcomingExam = (userData) => {
    try {
      const exams = Array.isArray(userData.exams) ? userData.exams : [];
      const now = new Date();
      const upcoming = exams
        .filter((e) => { try { return new Date(e.date) >= now; } catch { return false; } })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setUpcomingExam(
        upcoming.length > 0
          ? { name: upcoming[0].name, formattedDate: new Date(upcoming[0].date).toLocaleDateString(), start: upcoming[0].start || "TBD", semester: upcoming[0].semester }
          : null
      );
    } catch { setUpcomingExam(null); }
  };

  const loadUserData = async () => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) return;
      const ud = await getUserData();
      if (ud?.nickname) setUserNickname(ud.nickname);
      else setUserName(userInfo.email?.split("@")[0] || "User");
      if (ud?.avatar_url) setProfileImage(ud.avatar_url);
    } catch { setUserName("User"); }
  };

  const displayName = userNickname || userName || "User";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: theme.colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 12, backgroundColor: theme.colors.background }]}>
          <View style={[s.avatar, { backgroundColor: theme.colors.border }]} />
          <View style={{ alignItems: "center", flex: 1, gap: 4 }}>
            <View style={{ width: 90, height: 12, borderRadius: 6, backgroundColor: theme.colors.border }} />
            <View style={{ width: 60, height: 16, borderRadius: 6, backgroundColor: theme.colors.border }} />
          </View>
          <View style={{ width: 32, height: 32 }} />
        </View>
        <HomeSkeleton />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12, backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={{ width: 60 }}>
          <View style={{ position: "relative" }}>
            {profileImage
              ? <ReAnimated.Image source={{ uri: profileImage }} style={s.avatar} sharedTransitionTag="profile-avatar" />
              : <ReAnimated.View style={[s.avatar, { backgroundColor: "#535FFD", justifyContent: "center", alignItems: "center" }]} sharedTransitionTag="profile-avatar">
                  <SvgIcon name="user" size={20} color="#FFFFFF" />
                </ReAnimated.View>
            }
            {focusStreak > 0 && (
              <View style={s.streakBadge}>
                <SvgIcon name="fire" size={13} color="#535FFD" />
                <Text style={s.streakBadgeText}>{focusStreak}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={[s.greeting, { color: theme.colors.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[s.userName, { color: theme.colors.textPrimary }]}>{displayName}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ width: 44, alignItems: "flex-end" }}>
          <SvgIcon name="cog" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      >
        {/* Onboarding nudge */}
        {needsOnboarding && (
          <TouchableOpacity
            style={[s.onboardBanner, { backgroundColor: theme.colors.primaryLight }]}
            onPress={() => navigation.navigate("Onboarding")}
            activeOpacity={0.8}
          >
            <SvgIcon name="complete" size={36} color={theme.colors.primary} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary }}>Complete Your Profile</Text>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>Tell us a bit about yourself</Text>
            </View>
            <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>Go</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Today card */}
        <TodayCard
          lectures={todayLectures}
          navigation={navigation}
          focusSessions={focusSessions}
          focusTodayMins={focusTodayMins}
        />

        {/* Your Activities */}
        {todayLectures.length > 0 && (
          <View style={{ marginTop: 26, paddingHorizontal: 20 }}>
            <Text style={[s.sectionTitle, { color: theme.colors.textPrimary }]}>Your Activities</Text>
            {todayLectures.length > 4 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 14, marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {todayLectures.map((lec, i) => <ActivityCircle key={i} activity={lec} width={100} />)}
              </ScrollView>
            ) : (
              <View style={{ flexDirection: "row", marginTop: 14 }}>
                {todayLectures.map((lec, i) => <ActivityCircle key={i} activity={lec} />)}
              </View>
            )}
          </View>
        )}

        {/* Action cards */}
        <ActionCards navigation={navigation} onCreatePress={openSheet} hasSchedule={hasSchedule} />

        {/* Upcoming deadline */}
        {upcomingExam && (
          <TouchableOpacity
            style={[s.deadlineCard, { marginTop: 16, marginHorizontal: 20 }]}
            onPress={() => navigation.navigate("Deadlines")}
            activeOpacity={0.85}
          >
            <View style={s.deadlineIcon}>
              <SvgIcon name="bell" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>{upcomingExam.name}</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 3 }}>
                {upcomingExam.formattedDate} · {upcomingExam.start}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <NavigationBar />

      {/* Backdrop */}
      <Animated.View
        pointerEvents={sheetOpen ? "auto" : "none"}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropAnim, zIndex: 10 }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeSheet} activeOpacity={1} />
      </Animated.View>

      {/* Schedule Options Sheet */}
      <Animated.View
        pointerEvents={sheetOpen ? "auto" : "none"}
        style={[
          s.scheduleSheet,
          { transform: [{ translateY: sheetAnim }] },
          sheetStep === "manual" && { height: SHEET_H_LARGE },
        ]}
      >
        {/* Handle */}
        <View style={s.sheetHandle} />

        {/* Header row */}
        <View style={s.sheetHeaderRow}>
          {sheetStep === "aiScan" || sheetStep === "manual" ? (
            <TouchableOpacity onPress={() => setSheetStepTracked("options")} style={s.sheetIconBtn}>
              <SvgIcon name="arrow-back" size={18} color="#111111" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={closeSheet} style={s.sheetIconBtn}>
            <Text style={{ color: "#111111", fontSize: 16, fontWeight: "500", lineHeight: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {sheetStep === "options" ? (
          <>
            <Text style={s.sheetTitle}>Choose Option</Text>
            <View style={s.sheetBtnRow}>
              <TouchableOpacity
                style={s.sheetOptionBtn}
                activeOpacity={0.85}
                onPress={() => setSheetStepTracked("manual")}
              >
                <SvgIcon name="plus" size={44} color="#FFFFFF" />
                <Text style={s.sheetOptionBtnText}>Add Manually</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.sheetOptionBtn}
                activeOpacity={0.85}
                onPress={() => setSheetStep("aiScan")}
              >
                <SvgIcon name="scan" size={44} color="#FFFFFF" />
                <Text style={s.sheetOptionBtnText}>Scan with AI</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : sheetStep === "aiScan" ? (
          <>
            <Text style={s.sheetTitle}>AI Scan</Text>
            <View style={{ gap: 14 }}>
              <TouchableOpacity
                style={s.sheetAiBtn}
                activeOpacity={0.85}
                onPress={() => { closeSheet(); setTimeout(() => navigation.navigate("AITimetableScanner", { source: "camera" }), 300); }}
              >
                <SvgIcon name="camera" size={44} color="#FFFFFF" />
                <Text style={s.sheetOptionBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.sheetAiBtn}
                activeOpacity={0.85}
                onPress={() => { closeSheet(); setTimeout(() => navigation.navigate("AITimetableScanner", { source: "gallery" }), 300); }}
              >
                <SvgIcon name="upload" size={44} color="#FFFFFF" />
                <Text style={s.sheetOptionBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Manual form step
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.sheetTitle}>Add Activity</Text>

              <Text style={s.formLabel}>Activity Name</Text>
              <TextInput
                style={s.formInput}
                value={activityName}
                onChangeText={setActivityName}
                placeholder="eg Study Session, lecture"
                placeholderTextColor="#AAAAAA"
              />

              <Text style={s.formLabel}>Select Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d.value}
                    style={[s.dayChip, selectedDay === d.value && s.dayChipActive]}
                    onPress={() => setSelectedDay(d.value)}
                  >
                    <Text style={[s.dayChipText, selectedDay === d.value && s.dayChipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>Start Time</Text>
                  <TouchableOpacity style={s.timeChip} onPress={() => setShowStartPicker(true)}>
                    <Text style={s.timeChipText}>{formatTimeDisplay(startHour, startMinute, startPeriod)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>End Time</Text>
                  <TouchableOpacity style={s.timeChip} onPress={() => setShowEndPicker(true)}>
                    <Text style={s.timeChipText}>{formatTimeDisplay(endHour, endMinute, endPeriod)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={s.formLabel}>Category</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.categoryChip, formCategory === c.id && s.categoryChipActive]}
                    onPress={() => setFormCategory(c.id)}
                  >
                    <Text style={[s.categoryChipText, formCategory === c.id && s.categoryChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.formLabel}>Location</Text>
              <TextInput
                style={s.formInput}
                value={formLocation}
                onChangeText={setFormLocation}
                placeholder="eg Library, Room 304, Home"
                placeholderTextColor="#AAAAAA"
              />

              <Text style={s.formLabel}>Instructor</Text>
              <TextInput
                style={[s.formInput, { marginBottom: 24 }]}
                value={instructor}
                onChangeText={setInstructor}
                placeholder="enter name"
                placeholderTextColor="#AAAAAA"
              />

              <TouchableOpacity style={s.addActivityBtn} onPress={handleSaveActivity} disabled={saving} activeOpacity={0.85}>
                {saving
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={s.addActivityBtnText}>ADD ACTIVITY</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>

      {/* Time picker modals */}
      <Modal visible={showStartPicker} transparent animationType="slide" onRequestClose={() => setShowStartPicker(false)}>
        <TimePicker
          hour={startHour} minute={startMinute} period={startPeriod}
          onHourChange={setStartHour} onMinuteChange={setStartMinute} onPeriodChange={setStartPeriod}
          onClose={() => setShowStartPicker(false)}
          theme={PICKER_THEME} styles={PICKER_STYLES}
        />
      </Modal>
      <Modal visible={showEndPicker} transparent animationType="slide" onRequestClose={() => setShowEndPicker(false)}>
        <TimePicker
          hour={endHour} minute={endMinute} period={endPeriod}
          onHourChange={setEndHour} onMinuteChange={setEndMinute} onPeriodChange={setEndPeriod}
          onClose={() => setShowEndPicker(false)}
          theme={PICKER_THEME} styles={PICKER_STYLES}
        />
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  greeting: { fontSize: 13, fontWeight: "400" },
  userName: { fontSize: 17, fontWeight: "700", marginTop: 1 },

  // Onboarding banner
  onboardBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
  },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: "800" },

  // Today card
  todayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  todayLabel: { color: "#535FFD", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  todayStatText: { color: "#555555", fontSize: 11, fontWeight: "600" },
  todayTimeRange: { color: "#888888", fontSize: 12, fontWeight: "500", width: 72 },
  todayCourse: { color: "#111111", fontSize: 15, fontWeight: "700", flex: 1 },
  focusModeBtn: {
    backgroundColor: "#535FFD",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  focusModeBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },

  // Streak badge overlapping bottom-right of avatar
  streakBadge: {
    position: "absolute",
    bottom: -6,
    right: -18,
    backgroundColor: "#0D0D0D",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  streakBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  // Action cards
  createCard: {
    flex: 1,
    backgroundColor: "#535FFD",
    borderRadius: 20,
    padding: 18,
    minHeight: 190,
    justifyContent: "space-between",
    ...Platform.select({
      ios: { shadowColor: "#535FFD", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 0 },
    }),
  },
  createTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  createSubtitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 2 },
  createDesc: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4 },
  createIconPill: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
  },
  addCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  addTitle: { color: "#111111", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  addSubtitle: { color: "#111111", fontSize: 13, fontWeight: "600", marginTop: 1 },

  // GPA card
  gpaCard: {
    backgroundColor: "#111111",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpaLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  gpaValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", textAlign: "center" },
  gpaSem: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "500", marginTop: 2 },

  // Deadline card
  deadlineCard: {
    backgroundColor: "#EF4444",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deadlineIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },

  // Schedule options sheet
  scheduleSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H_SMALL,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
    zIndex: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  sheetIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F0F0F0",
    justifyContent: "center", alignItems: "center",
  },
  sheetTitle: {
    color: "#111111",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  sheetBtnRow: {
    flexDirection: "row",
    gap: 16,
  },
  sheetOptionBtn: {
    flex: 1,
    backgroundColor: "#535FFD",
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  sheetAiBtn: {
    backgroundColor: "#535FFD",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sheetOptionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Manual form
  formLabel: { fontSize: 14, fontWeight: "700", color: "#111111", marginBottom: 8 },
  formInput: {
    backgroundColor: "#F2F2F2",
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111111",
    marginBottom: 20,
  },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 50, backgroundColor: "#F0F0F0", marginRight: 8,
  },
  dayChipActive: { backgroundColor: "#535FFD" },
  dayChipText: { fontSize: 12, fontWeight: "600", color: "#666666" },
  dayChipTextActive: { color: "#FFFFFF" },
  timeChip: {
    backgroundColor: "#F2F2F2", borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 14, alignItems: "center",
  },
  timeChipText: { fontSize: 15, color: "#888888" },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 50, backgroundColor: "#F0F0F0",
  },
  categoryChipActive: { backgroundColor: "#535FFD" },
  categoryChipText: { fontSize: 14, fontWeight: "600", color: "#666666" },
  categoryChipTextActive: { color: "#FFFFFF" },
  addActivityBtn: {
    backgroundColor: "#535FFD", borderRadius: 50,
    paddingVertical: 18, alignItems: "center",
  },
  addActivityBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});

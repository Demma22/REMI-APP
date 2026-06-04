import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  Dimensions, Animated, StyleSheet, Platform,
  TextInput, KeyboardAvoidingView, Modal, ActivityIndicator, Alert,
} from "react-native";
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
  timePickerContent: { width: "90%", borderRadius: 15, padding: 20 },
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
      {/* Today card */}
      <SkeletonBone style={{ height: 130, marginHorizontal: 20, marginTop: 16, borderRadius: 15 }} />
      {/* Your Activities: section title + 3 circles */}
      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <SkeletonBone style={{ height: 16, width: 130, borderRadius: 8, marginBottom: 14 }} />
        <View style={{ flexDirection: "row" }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <SkeletonBone style={{ width: 88, height: 88, borderRadius: 44 }} />
              <SkeletonBone style={{ height: 10, width: 36, borderRadius: 5, marginTop: 7 }} />
            </View>
          ))}
        </View>
      </View>
      {/* 3 action cards */}
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 24 }}>
        {[0, 1, 2].map(i => (
          <SkeletonBone key={i} style={{ flex: 1, height: 82, borderRadius: 15 }} />
        ))}
      </View>
      {/* Weekly focus graph */}
      <SkeletonBone style={{ height: 120, marginHorizontal: 20, marginTop: 16, borderRadius: 15 }} />
    </ScrollView>
  );
}

// ── Focus Summary ring ────────────────────────────────────────────
const FOCUS_D = 160;
const FOCUS_SW = 14;
const FOCUS_R = FOCUS_D / 2 - FOCUS_SW / 2;
const FOCUS_C = 2 * Math.PI * FOCUS_R;

function HomeFocusSummary({ todayMins, sessions, streak, target, theme, onPress }) {
  const remaining = Math.max(0, target - todayMins);
  const progress = target > 0 ? Math.min(todayMins / target, 1) : 0;
  const offset = FOCUS_C * (1 - progress);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Sessions */}
        <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
          <SvgIcon name="focus" size={20} color={theme.colors.textSecondary} />
          <Text style={{ fontSize: 26, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 }}>
            {sessions}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary }}>Sessions</Text>
        </View>

        {/* Main ring */}
        <View style={{ width: FOCUS_D, height: FOCUS_D, alignItems: "center", justifyContent: "center" }}>
          <Svg width={FOCUS_D} height={FOCUS_D} style={StyleSheet.absoluteFill}>
            <Circle cx={FOCUS_D / 2} cy={FOCUS_D / 2} r={FOCUS_R}
              stroke={theme.colors.border} strokeWidth={FOCUS_SW} fill="none" />
            <Circle cx={FOCUS_D / 2} cy={FOCUS_D / 2} r={FOCUS_R}
              stroke="#535FFD" strokeWidth={FOCUS_SW} fill="none"
              strokeDasharray={FOCUS_C} strokeDashoffset={offset}
              strokeLinecap="round" rotation="-90"
              origin={`${FOCUS_D / 2},${FOCUS_D / 2}`} />
          </Svg>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 34, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -1 }}>
              {remaining}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary, marginTop: 2, textAlign: "center" }}>
              {remaining === 0 && target > 0 ? "Goal hit! 🎉" : "min left"}
            </Text>
          </View>
        </View>

        {/* Streak */}
        <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
          <SvgIcon name="fire" size={20} color={theme.colors.textSecondary} />
          <Text style={{ fontSize: 26, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 }}>
            {streak}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary }}>Streak</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Live activity pill ────────────────────────────────────────────
function isLectureLive(lec) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = parseStoredTime(lec.start);
  const e = parseStoredTime(lec.end);
  return s > 0 && e > s && cur >= s && cur < e;
}

function LiveDot() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeRingAnim = (sv, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(sv, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(sv, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const a1 = makeRingAnim(ring1, 0);
    const a2 = makeRingAnim(ring2, 700);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);

  const ringStyle = (sv) => ({
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    top: -6,
    left: -6,
    opacity: sv.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 0.5, 0] }),
    transform: [{ scale: sv.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) }],
  });

  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
    </View>
  );
}

// ── Today Card ────────────────────────────────────────────────────
function TodayCard({ lectures, deadlines, navigation, onActivityPress }) {
  const hasNothing = lectures.length === 0 && deadlines.length === 0;

  return (
    <View style={s.todayCard}>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Text style={s.todayLabel}>Today</Text>
      </View>

      {/* Activity rows */}
      {hasNothing ? (
        <Text style={{ color: "#AAAAAA", fontSize: 14, paddingVertical: 8 }}>No activities today</Text>
      ) : (
        <>
          {lectures.slice(0, 4).map((lec, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={{ height: 1, backgroundColor: "#EEEEFF" }} />}
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 8 }}>
                {isLectureLive(lec) && <LiveDot />}
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
                  onPress={() => onActivityPress(lec)}
                  activeOpacity={0.7}
                >
                  <Text style={s.todayTimeRange} numberOfLines={1}>{formatDisplayTime(lec.start)}</Text>
                  <Text style={s.todayCourse} numberOfLines={1}>{lec.course}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.focusModeBtn}
                  onPress={() => navigation.navigate("Focus", { quickStart: true })}
                  activeOpacity={0.85}
                >
                  <Text style={s.focusModeBtnText}>Focus Mode</Text>
                </TouchableOpacity>
              </View>
            </React.Fragment>
          ))}
          {lectures.length > 4 && (
            <TouchableOpacity onPress={() => navigation.navigate("Timetable")}>
              <Text style={{ color: "#AAAAAA", fontSize: 11, marginTop: 2, marginBottom: 4 }}>+{lectures.length - 4} more</Text>
            </TouchableOpacity>
          )}

          {/* Deadline rows */}
          {deadlines.map((dl, i) => (
            <View key={`dl-${i}`} style={s.deadlineRow}>
              <Text style={s.deadlineRowTime} numberOfLines={1}>{dl.dueLabel}</Text>
              <Text style={s.deadlineRowName} numberOfLines={1}>{dl.course}</Text>
              <TouchableOpacity
                style={s.focusModeBtnDl}
                onPress={() => navigation.navigate("Focus", { quickStart: true })}
                activeOpacity={0.85}
              >
                <Text style={s.focusModeBtnTextDl}>Focus Mode</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ── Action Cards ──────────────────────────────────────────────────
const NAV_CARDS = (navigation, onCreatePress, hasSchedule) => [
  {
    label: "Schedule",
    icon: "calendar",
    bg: "#FFFFFF",
    iconColor: "#535FFD",
    textColor: "#111111",
    dark: false,
    onPress: hasSchedule ? () => navigation.navigate("Timetable") : onCreatePress,
  },
  {
    label: "Focus",
    icon: "focus",
    bg: "#FFFFFF",
    iconColor: "#535FFD",
    textColor: "#111111",
    dark: false,
    onPress: () => navigation.navigate("Focus"),
  },
  {
    label: "Deadline",
    icon: "bell",
    bg: "#FFFFFF",
    iconColor: "#535FFD",
    textColor: "#111111",
    dark: false,
    onPress: () => navigation.navigate("Deadlines"),
  },
];

function ActionCards({ navigation, onCreatePress, hasSchedule }) {
  const cards = NAV_CARDS(navigation, onCreatePress, hasSchedule);
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 24 }}>
      {cards.map((card, i) => (
        <TouchableOpacity
          key={i}
          style={[s.navCard, { backgroundColor: card.bg }, card.dark ? s.navCardDark : s.navCardLight]}
          onPress={card.onPress}
          activeOpacity={0.85}
        >
          <SvgIcon name={card.icon} size={28} color={card.iconColor} />
          <Text style={[s.navCardLabel, { color: card.textColor }]}>{card.label}</Text>
        </TouchableOpacity>
      ))}
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

// ── Weekly Focus Graph ────────────────────────────────────────────
const BAR_MAX_H = 60;

function WeeklyFocusGraph({ data, target, theme }) {
  const _td = new Date();
  const today = `${_td.getFullYear()}-${String(_td.getMonth()+1).padStart(2,"0")}-${String(_td.getDate()).padStart(2,"0")}`;
  const maxVal = Math.max(target, ...data.map(d => d.minutes), 1);
  const totalWeek = data.reduce((sum, d) => sum + d.minutes, 0);
  const daysHitTarget = data.filter(d => target > 0 && d.minutes >= target).length;

  return (
    <View style={[s.weekCard, { backgroundColor: theme.colors.card }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <View>
          <Text style={[s.weekTitle, { color: theme.colors.textPrimary }]}>Weekly Focus</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {totalWeek >= 60
              ? `${Math.floor(totalWeek / 60)}h ${totalWeek % 60 > 0 ? `${totalWeek % 60}m` : ""} this week`
              : `${totalWeek}m this week`}
            {daysHitTarget > 0 ? ` · ${daysHitTarget}d goal hit` : ""}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        {data.map((d, i) => {
          const isToday = d.date === today;
          const hitTarget = target > 0 && d.minutes >= target;
          const barH = d.minutes > 0 ? Math.max(Math.round((d.minutes / maxVal) * BAR_MAX_H), 4) : 0;
          const targetLineH = target > 0 ? Math.round((target / maxVal) * BAR_MAX_H) : 0;

          return (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <View style={{ height: BAR_MAX_H, justifyContent: "flex-end", width: "100%", alignItems: "center" }}>
                {/* Target dashed line for today's bar */}
                {isToday && target > 0 && !hitTarget && (
                  <View style={{
                    position: "absolute", bottom: targetLineH,
                    width: "80%", height: 1.5,
                    borderWidth: 1, borderColor: "#535FFD", borderStyle: "dashed",
                  }} />
                )}
                <View style={{
                  width: "72%", height: barH || 0,
                  backgroundColor: hitTarget ? "#535FFD" : isToday ? "#535FFD88" : "#E2E8F0",
                  borderRadius: 6,
                }} />
              </View>
              <Text style={{
                fontSize: 10, marginTop: 6, fontWeight: isToday ? "800" : "500",
                color: isToday ? "#535FFD" : theme.colors.textSecondary,
              }}>
                {d.dayLabel}
              </Text>
            </View>
          );
        })}
      </View>

      {target > 0 && (
        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 10 }}>
          Daily goal: {target >= 60
            ? `${Math.floor(target / 60)}h${target % 60 > 0 ? ` ${target % 60}m` : ""}`
            : `${target}m`}
        </Text>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [todayLectures, setTodayLectures] = useState([]);
  const [todayDeadlines, setTodayDeadlines] = useState([]);
  const [weeklyFocusData, setWeeklyFocusData] = useState([]);
  const [weeklyFocusTarget, setWeeklyFocusTarget] = useState(60);
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
  const [selectedActivity, setSelectedActivity] = useState(null);
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
      const _d = new Date();
      const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,"0")}-${String(_d.getDate()).padStart(2,"0")}`;
      const ud = await getUserData();
      const sessions = Array.isArray(ud?.focusSessions) ? ud.focusSessions : [];
      const todaySessions = sessions.filter(s => s.date === today);
      setFocusTodayMins(todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0));
      setFocusSessions(todaySessions.length);
      setFocusStreak(ud?.focusStreak?.count || 0);
    } catch {}
  };

  const loadWeeklyFocus = async () => {
    try {
      const ud = await getUserData();
      const sessions = Array.isArray(ud?.focusSessions) ? ud.focusSessions : [];
      setWeeklyFocusTarget(ud?.focusTarget || 60);
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const dayLabel = d.toLocaleString("en-US", { weekday: "short" }).slice(0, 3).toUpperCase();
        const minutes = sessions
          .filter(s => s.date === dateStr)
          .reduce((sum, s) => sum + (s.duration || 0), 0);
        days.push({ dayLabel, date: dateStr, minutes });
      }
      setWeeklyFocusData(days);
    } catch {}
  };

  useEffect(() => {
    loadUserData();
    loadHomeData();
    checkOnboardingStatus();
    loadFocusStats();
    loadWeeklyFocus();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
      loadHomeData();
      checkOnboardingStatus();
      loadFocusStats();
      loadWeeklyFocus();
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
        loadTodayDeadlines(ud);
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
      const todaysLectures = timetable[day] || [];
      setTodayLectures(
        todaysLectures.map((l, idx) => ({
          course: l.name, time: `${l.start} - ${l.end}`,
          start: l.start, end: l.end,
          location: l.location || l.room, lecturer: l.lecturer,
          type: l.type, notes: l.notes,
          dayKey: day, index: idx,
        }))
      );
    } catch { setTodayLectures([]); }
  };

  const loadTodayDeadlines = (userData) => {
    try {
      const exams = Array.isArray(userData.exams) ? userData.exams : [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const upcoming = exams
        .filter(e => {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 3;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(e => {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
          const dueLabel = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `In ${diff}d`;
          return { course: e.name, dueLabel, start: e.start, date: e.date, isDeadline: true };
        });
      setTodayDeadlines(upcoming);
    } catch { setTodayDeadlines([]); }
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
          deadlines={todayDeadlines}
          navigation={navigation}
          onActivityPress={setSelectedActivity}
        />

        {/* Focus Summary */}
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <Text style={[s.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Focus</Text>
          <HomeFocusSummary
            todayMins={focusTodayMins}
            sessions={focusSessions}
            streak={focusStreak}
            target={weeklyFocusTarget}
            theme={theme}
            onPress={() => navigation.navigate("Focus")}
          />
        </View>


        {/* Action cards */}
        <ActionCards navigation={navigation} onCreatePress={openSheet} hasSchedule={hasSchedule} />

        {/* Weekly focus graph */}
        {weeklyFocusData.length > 0 && (
          <WeeklyFocusGraph
            data={weeklyFocusData}
            target={weeklyFocusTarget}
            theme={theme}
          />
        )}

      </ScrollView>

      <NavigationBar />

      {/* Activity detail popup */}
      <Modal visible={!!selectedActivity} transparent animationType="fade" onRequestClose={() => setSelectedActivity(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelectedActivity(null)}>
          <View style={s.activityDetailCard}>
            <View style={s.activityDetailHeader}>
              <Text style={s.activityDetailName}>{selectedActivity?.course}</Text>
              <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                <Text style={s.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.activityDetailBody}>
              {(selectedActivity?.start) && (
                <View style={s.detailRow}>
                  <SvgIcon name="clock" size={16} color="#888888" />
                  <Text style={s.detailText}>
                    {selectedActivity.start}{selectedActivity.time?.includes(" - ") ? ` – ${selectedActivity.time.split(" - ")[1]}` : ""}
                  </Text>
                </View>
              )}
              {selectedActivity?.location && (
                <View style={s.detailRow}>
                  <SvgIcon name="location" size={16} color="#888888" />
                  <Text style={s.detailText}>{selectedActivity.location}</Text>
                </View>
              )}
              {selectedActivity?.lecturer && (
                <View style={s.detailRow}>
                  <SvgIcon name="user" size={16} color="#888888" />
                  <Text style={s.detailText}>{selectedActivity.lecturer}</Text>
                </View>
              )}
              {selectedActivity?.type && (
                <View style={s.detailRow}>
                  <SvgIcon name="edit" size={16} color="#888888" />
                  <Text style={s.detailText}>{selectedActivity.type.charAt(0).toUpperCase() + selectedActivity.type.slice(1)}</Text>
                </View>
              )}
              {selectedActivity?.notes && (
                <View style={s.detailRow}>
                  <SvgIcon name="message" size={16} color="#888888" />
                  <Text style={s.detailText}>{selectedActivity.notes}</Text>
                </View>
              )}
            </View>

            <View style={s.activityDetailActions}>
              <TouchableOpacity
                style={s.detailEditBtn}
                onPress={() => {
                  const act = selectedActivity;
                  setSelectedActivity(null);
                  navigation.navigate("EditTimetable", { initialDay: act.dayKey, initialLectureIndex: act.index });
                }}
              >
                <Text style={s.detailEditText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
    borderRadius: 15,
    padding: 14,
  },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: "800" },


  // Today card
  todayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
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
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  focusModeBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },

  // Weekly focus graph
  weekCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 15,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14 },
      android: { elevation: 2 },
    }),
  },
  weekTitle: { fontSize: 16, fontWeight: "800" },

  // Deadline rows inside Today card
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 8,
  },
  deadlineRowTime: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", width: 72 },
  deadlineRowName: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", flex: 1 },
  focusModeBtnDl: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  focusModeBtnTextDl: { color: "#111111", fontSize: 11, fontWeight: "700" },

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

  // Nav cards (3-up row)
  navCard: {
    flex: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  navCardLight: {
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  navCardDark: {},
  navCardLabel: { fontSize: 13, fontWeight: "700" },

  // Action cards (legacy, kept for ref)
  createCard: {
    flex: 1,
    backgroundColor: "#535FFD",
    borderRadius: 15,
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
    width: 56, height: 56, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
  },
  addCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
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
    borderRadius: 15,
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
    borderRadius: 15,
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
    borderRadius: 15,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  sheetAiBtn: {
    backgroundColor: "#535FFD",
    borderRadius: 15,
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

  // Activity detail modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
  },
  activityDetailCard: {
    backgroundColor: "#FFFFFF", borderRadius: 15, padding: 24, width: "100%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  activityDetailHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20,
  },
  activityDetailName: { fontSize: 22, fontWeight: "800", color: "#111111", flex: 1, paddingRight: 12 },
  closeX: { fontSize: 18, color: "#AAAAAA", fontWeight: "600" },
  activityDetailBody: { gap: 12, marginBottom: 24 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontSize: 15, color: "#444444", flex: 1 },
  activityDetailActions: { flexDirection: "row", gap: 12 },
  detailEditBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#535FFD", alignItems: "center",
  },
  detailEditText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});

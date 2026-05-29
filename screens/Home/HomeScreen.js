import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  Dimensions, Animated, StyleSheet, Platform,
} from "react-native";
import { Svg, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUserData, getCurrentUserInfo } from "../../services/userDataService";
import SvgIcon from "../../components/SvgIcon";
import NavigationBar from "../../components/NavigationBar";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.44;

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

function getDayParts() {
  const day = new Date().toLocaleString("en-US", { weekday: "long" });
  return [day.slice(0, -3).toUpperCase(), "day"];
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

function ActivityCircle({ activity }) {
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
    <View style={{ alignItems: "center", flex: 1 }}>
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
function TodayCard({ lectures, navigation }) {
  const [dayPart1, dayPart2] = getDayParts();

  return (
    <TouchableOpacity style={s.todayCard} onPress={() => navigation.navigate("Timetable")} activeOpacity={0.92}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        {lectures.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>No activities today</Text>
        ) : (
          lectures.slice(0, 3).map((lec, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: i < 2 ? 11 : 0 }}>
              <Text style={s.todayTime}>{formatDisplayTime(lec.start)}</Text>
              <Text style={s.todayCourse} numberOfLines={1}>{lec.course}</Text>
            </View>
          ))
        )}
        {lectures.length > 3 && (
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8 }}>+{lectures.length - 3} more</Text>
        )}
      </View>
      <View style={{ alignItems: "flex-end", justifyContent: "flex-end" }}>
        <Text style={s.dayText}>{dayPart1}</Text>
        <Text style={[s.dayText, { fontSize: 36, lineHeight: 42, marginTop: -4 }]}>{dayPart2}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Action Cards ──────────────────────────────────────────────────
function ActionCards({ navigation, onCreatePress }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 24 }}>
      <TouchableOpacity style={s.createCard} onPress={onCreatePress} activeOpacity={0.85}>
        <View>
          <Text style={s.createTitle}>CREATE</Text>
          <Text style={s.createSubtitle}>Schedule</Text>
          <Text style={s.createDesc}>Add your Timetable</Text>
        </View>
        <View style={s.createIconPill}>
          <SvgIcon name="calendar" size={30} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 12 }}>
        <TouchableOpacity style={s.addCard} onPress={() => navigation.navigate("AddExam")} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={s.addTitle}>ADD</Text>
            <Text style={s.addSubtitle}>Deadlines</Text>
          </View>
          <SvgIcon name="bell" size={32} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <TouchableOpacity style={s.addCard} onPress={() => navigation.navigate("GPA")} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={s.addTitle}>ADD</Text>
            <Text style={s.addSubtitle}>Results</Text>
          </View>
          <SvgIcon name="chart-line" size={32} color="rgba(255,255,255,0.9)" />
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
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const openSheet = () => {
    setSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: SHEET_H, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setSheetOpen(false));
  };

  useEffect(() => {
    loadUserData();
    loadHomeData();
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
      loadHomeData();
      checkOnboardingStatus();
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
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={{ width: 44 }}>
          {profileImage
            ? <Image source={{ uri: profileImage }} style={s.avatar} />
            : <View style={[s.avatar, { backgroundColor: "#535FFD", justifyContent: "center", alignItems: "center" }]}>
                <SvgIcon name="user" size={20} color="#FFFFFF" />
              </View>
          }
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
        <TodayCard lectures={todayLectures} navigation={navigation} />

        {/* Your Activities */}
        {todayLectures.length > 0 && (
          <View style={{ marginTop: 26, paddingHorizontal: 20 }}>
            <Text style={[s.sectionTitle, { color: theme.colors.textPrimary }]}>Your Activities</Text>
            <View style={{ flexDirection: "row", marginTop: 14 }}>
              {todayLectures.map((lec, i) => <ActivityCircle key={i} activity={lec} />)}
            </View>
          </View>
        )}

        {/* Action cards */}
        <ActionCards navigation={navigation} onCreatePress={openSheet} />

        {/* Academic Progress */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <GPACard gpaSummary={gpaSummary} onPress={() => navigation.navigate("GPA")} />
        </View>

        {/* Upcoming deadline */}
        {upcomingExam && (
          <TouchableOpacity
            style={[s.deadlineCard, { marginTop: 16, marginHorizontal: 20 }]}
            onPress={() => navigation.navigate("AddExam")}
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
        style={[s.scheduleSheet, { transform: [{ translateY: sheetAnim }] }]}
      >
        <View style={{ alignItems: "flex-end", marginBottom: 20 }}>
          <TouchableOpacity onPress={closeSheet} style={s.sheetCloseBtn}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: "300", lineHeight: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sheetTitle}>Choose Option</Text>
        <Text style={s.sheetSubtitle}>You can add your timetables and schedule{"\n"}through two main ways</Text>
        <View style={s.sheetBtnRow}>
          <TouchableOpacity
            style={s.sheetBtn}
            activeOpacity={0.85}
            onPress={() => { closeSheet(); setTimeout(() => navigation.navigate("AddActivity"), 300); }}
          >
            <Text style={s.sheetBtnText}>Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.sheetBtn}
            activeOpacity={0.85}
            onPress={() => { closeSheet(); setTimeout(() => navigation.navigate("AITimetableScanner"), 300); }}
          >
            <Text style={s.sheetBtnText}>AI Scan</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    backgroundColor: "#535FFD",
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 140,
    ...Platform.select({
      ios: { shadowColor: "#535FFD", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 0 },
    }),
  },
  todayTime: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "500", width: 38 },
  todayCourse: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", flex: 1 },
  dayText: { color: "#FFFFFF", fontSize: 58, fontWeight: "900", lineHeight: 62, letterSpacing: -1 },

  // Action cards
  createCard: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 20,
    padding: 18,
    minHeight: 190,
    justifyContent: "space-between",
  },
  createTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  createSubtitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 2 },
  createDesc: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 },
  createIconPill: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "#535FFD",
    justifyContent: "center", alignItems: "center",
  },
  addCard: {
    backgroundColor: "#535FFD",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    ...Platform.select({
      ios: { shadowColor: "#535FFD", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 0 },
    }),
  },
  addTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  addSubtitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", marginTop: 1 },

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
    height: SHEET_H,
    backgroundColor: "#535FFD",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    zIndex: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  sheetCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sheetSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 36,
  },
  sheetBtnRow: {
    flexDirection: "row",
    gap: 16,
  },
  sheetBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
  },
  sheetBtnText: {
    color: "#535FFD",
    fontSize: 16,
    fontWeight: "700",
  },
});

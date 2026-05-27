// screens/Home/HomeScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { Svg, Circle } from "react-native-svg";
import { getUserData, getCurrentUserInfo } from "../../services/userDataService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SvgIcon from "../../components/SvgIcon";
import NavigationBar from "../../components/NavigationBar";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../contexts/ThemeContext";
import { getStyles } from "./HomeScreen.styles";

const { width } = Dimensions.get("window");

// ── Skeleton ──────────────────────────────────────────────────────
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
  return (
    <Animated.View
      style={[{ backgroundColor: "#E2E8F0", borderRadius: 12, opacity: anim }, style]}
    />
  );
}

function HomeSkeletonLoader() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Today card skeleton */}
      <SkeletonBone style={{ height: 160, marginHorizontal: 20, marginTop: 20, borderRadius: 24 }} />
      {/* Circles skeleton */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 24, gap: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBone key={i} style={{ width: 64, height: 64, borderRadius: 32 }} />
        ))}
      </View>
      {/* Action cards skeleton */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 28, gap: 12 }}>
        <SkeletonBone style={{ flex: 1, height: 160, borderRadius: 20 }} />
        <SkeletonBone style={{ flex: 1, height: 160, borderRadius: 20 }} />
      </View>
    </ScrollView>
  );
}

// ── Activity Progress Circle ──────────────────────────────────────
const RING_SIZE = 100;
const RING_STROKE = 12;
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function parseStoredTime(t) {
  // Format: "H:MM AM/PM" where H is already 0-23
  if (!t) return 0;
  const m = /^(\d+):(\d+)/.exec(t.trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function formatShortTime(t) {
  if (!t) return "";
  const mins = parseStoredTime(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${display}${period}` : `${display}:${String(m).padStart(2, "0")}${period}`;
}

function ActivityCircle({ activity, theme }) {
  const [progress, setProgress] = useState(0);

  const calcProgress = () => {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const s = parseStoredTime(activity.start);
    const e = parseStoredTime(activity.end);
    if (e <= s || cur < s) return 0;
    if (cur >= e) return 1;
    return (cur - s) / (e - s);
  };

  useEffect(() => {
    const update = () => setProgress(calcProgress());
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const offset = CIRCUMFERENCE * (1 - progress);
  const isDone = progress >= 1;
  const isLive = progress > 0 && progress < 1;

  const DONE_COLOR = "#fdac1b";
  const ringColor = isDone ? DONE_COLOR : theme.colors.primary;
  const textColor = theme.colors.textPrimary;

  return (
    <View style={{ alignItems: "center", marginHorizontal: 10 }}>
      {/* Wheel */}
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.colors.border}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Progress arc — only render if > 0 */}
          {progress > 0 && (
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={ringColor}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2},${RING_SIZE / 2}`}
            />
          )}
        </Svg>
        {/* Inner content — course name centered */}
        <View
          style={{
            position: "absolute",
            top: RING_STROKE,
            left: RING_STROKE,
            right: RING_STROKE,
            bottom: RING_STROKE,
            borderRadius: (RING_SIZE - RING_STROKE * 2) / 2,
            backgroundColor: theme.colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 8,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "700",
              color: textColor,
              textAlign: "center",
              maxWidth: 64,
            }}
            numberOfLines={3}
          >
            {activity.course}
          </Text>
        </View>
      </View>

      {/* Status below the wheel */}
      <Text
        style={{
          fontSize: 9,
          marginTop: 6,
          color: isLive
            ? theme.colors.primary
            : isDone
            ? DONE_COLOR
            : theme.colors.textSecondary,
          fontWeight: isLive || isDone ? "600" : "400",
        }}
      >
        {isLive ? "Live" : isDone ? "Done" : formatShortTime(activity.start)}
      </Text>
    </View>
  );
}

// ── Today Banner ──────────────────────────────────────────────────
function TodayBanner({ lectures, theme, navigation }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <View
      style={{
        backgroundColor: theme.colors.primary,
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
          },
          android: { elevation: 0 },
        }),
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            opacity: 0.75,
          }}
        >
          TODAY
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.65 }}>
          {dateStr}
        </Text>
      </View>

      {lectures.length === 0 ? (
        <View style={{ paddingVertical: 10, alignItems: "center" }}>
          <Text style={{ color: "#FFFFFF", opacity: 0.7, fontSize: 14, fontWeight: "500" }}>
            No activities scheduled
          </Text>
        </View>
      ) : (
        <>
          {lectures.slice(0, 3).map((lec, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: i < Math.min(lectures.length, 3) - 1 ? 10 : 0,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.6)",
                  }}
                />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", flex: 1 }}
                  numberOfLines={1}
                >
                  {lec.course}
                </Text>
              </View>
              <Text style={{ color: "#FFFFFF", opacity: 0.75, fontSize: 13, marginLeft: 8 }}>
                {formatShortTime(lec.start)}
              </Text>
            </View>
          ))}
          {lectures.length > 3 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Timetable")}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: "#FFFFFF", opacity: 0.65, fontSize: 12, textAlign: "right" }}>
                +{lectures.length - 3} more
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// ── Action Card ───────────────────────────────────────────────────
function ActionCard({ label, subtitle, iconName, onPress, theme }) {
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 18,
        minHeight: 156,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          android: { elevation: 0 },
        }),
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: theme.colors.primaryLight,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <SvgIcon name={iconName} size={26} color={theme.colors.primary} />
      </View>
      <View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: theme.colors.textPrimary,
            marginBottom: 4,
            lineHeight: 20,
          }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── GPA Results Card ──────────────────────────────────────────────
function GPAResultsCard({ gpaSummary, theme, onPress }) {
  if (!gpaSummary || gpaSummary.length === 0) return null;

  const cgpa = (
    gpaSummary.reduce((sum, s) => sum + parseFloat(s.gpa), 0) / gpaSummary.length
  ).toFixed(2);

  return (
    <TouchableOpacity
      style={{
        marginHorizontal: 20,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          android: { elevation: 0 },
        }),
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary }}>
          GPA Results
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>CGPA</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.colors.primary }}>
            {cgpa}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: theme.colors.border, marginBottom: 12 }} />

      {/* Semester rows */}
      {gpaSummary.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 6,
            borderBottomWidth: i < gpaSummary.length - 1 ? 1 : 0,
            borderBottomColor: theme.colors.borderLight,
          }}
        >
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            {item.semester}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary }}>
            {item.gpa}
          </Text>
        </View>
      ))}
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

  const { theme } = useTheme();
  const styles = getStyles(theme);
  const PROFILE_IMAGE_KEY = "@profile_image";

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
      const day = new Date()
        .toLocaleString("en-US", { weekday: "long" })
        .toLowerCase();
      const timetable = userData.timetable || {};
      const currentSemester = userData.current_semester || 1;
      const todaysLectures =
        timetable[day]?.filter((l) => l.semester === currentSemester) || [];
      setTodayLectures(
        todaysLectures.map((l) => ({
          course: l.name,
          time: `${l.start} - ${l.end}`,
          start: l.start,
          end: l.end,
          room: l.room,
        }))
      );
    } catch {
      setTodayLectures([]);
    }
  };

  const loadGPASummary = (userData) => {
    try {
      const gpaData = userData.gpa_data || {};
      const summary = Object.keys(gpaData)
        .filter((k) => gpaData[k]?.gpa)
        .map((k) => ({
          semester: `Sem ${k.replace("semester", "")}`,
          gpa: parseFloat(gpaData[k].gpa).toFixed(2),
        }))
        .sort((a, b) => {
          const n = (s) => parseInt(s.semester.replace("Sem ", ""));
          return n(a) - n(b);
        });
      setGpaSummary(summary);
    } catch {
      setGpaSummary([]);
    }
  };

  const loadUpcomingExam = (userData) => {
    try {
      const exams = Array.isArray(userData.exams) ? userData.exams : [];
      const now = new Date();
      const upcoming = exams
        .filter((e) => {
          try { return new Date(e.date) >= now; } catch { return false; }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (upcoming.length > 0) {
        const ex = upcoming[0];
        const d = new Date(ex.date);
        setUpcomingExam({
          name: ex.name,
          formattedDate: d.toLocaleDateString(),
          start: ex.start || "TBD",
          semester: ex.semester,
        });
      } else {
        setUpcomingExam(null);
      }
    } catch {
      setUpcomingExam(null);
    }
  };

  const loadUserData = async () => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) return;
      const ud = await getUserData();
      if (ud?.nickname) {
        setUserNickname(ud.nickname);
      } else {
        setUserName(userInfo.email?.split("@")[0] || "User");
      }
      const saved = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (saved) setProfileImage(saved);
    } catch {
      setUserName("User");
    }
  };

  const getDisplayName = () => userNickname || userName || "User";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          type="home"
          greeting="Loading..."
          userName=""
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("NotificationsSettings")}
        />
        <HomeSkeletonLoader />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        type="home"
        greeting={getGreeting()}
        userName={getDisplayName()}
        profileImage={profileImage}
        onProfilePress={() => navigation.navigate("Profile")}
        onNotificationPress={() => navigation.navigate("NotificationsSettings")}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Onboarding nudge */}
        {needsOnboarding && (
          <View style={[styles.onboardingBanner, { backgroundColor: theme.colors.primaryLight }]}>
            <View style={styles.onboardingBannerContent}>
              <SvgIcon name="complete" size={48} color={theme.colors.primary} />
              <View style={styles.onboardingBannerText}>
                <Text style={[styles.onboardingBannerTitle, { color: theme.colors.textPrimary }]}>
                  Complete Your Profile
                </Text>
                <Text style={[styles.onboardingBannerSubtitle, { color: theme.colors.textSecondary }]}>
                  Tell us a bit about yourself
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.onboardingBannerButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("Onboarding")}
              >
                <Text style={styles.onboardingBannerButtonText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Today banner */}
        <TodayBanner
          lectures={todayLectures}
          theme={theme}
          navigation={navigation}
        />

        {/* Activity circles — only when today has activities */}
        {todayLectures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activities</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 12,
                paddingBottom: 4,
              }}
            >
              {todayLectures.map((lec, i) => (
                <ActivityCircle key={i} activity={lec} theme={theme} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action cards */}
        <View style={styles.section}>
          <View style={styles.actionCardsRow}>
            <ActionCard
              label="Manage Schedule"
              subtitle="View & edit timetable"
              iconName="timetable"
              onPress={() => navigation.navigate("Timetable")}
              theme={theme}
            />
            <ActionCard
              label="Calculate & Track Results"
              subtitle="GPA calculator"
              iconName="gpa"
              onPress={() => navigation.navigate("GPA")}
              theme={theme}
            />
          </View>
        </View>

        {/* GPA Results */}
        {gpaSummary.length > 0 && (
          <View style={styles.section}>
            <GPAResultsCard
              gpaSummary={gpaSummary}
              theme={theme}
              onPress={() => navigation.navigate("GPA")}
            />
          </View>
        )}

        {/* Upcoming exam */}
        {upcomingExam && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Deadline</Text>
            <View style={[styles.examCard, { backgroundColor: "#EF4444" }]}>
              <View style={styles.examHeader}>
                <View style={[styles.examIcon, { backgroundColor: "#FFFFFF20" }]}>
                  <SvgIcon name="bell" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.examTitleContainer}>
                  <Text style={[styles.examCourse, { color: "#FFFFFF" }]}>
                    {upcomingExam.name}
                  </Text>
                  <View style={styles.examDetailsRow}>
                    <View style={styles.examDetail}>
                      <SvgIcon name="calendar" size={13} color="#FFFFFF" />
                      <Text style={[styles.examDetailText, { color: "#FFFFFF" }]}>
                        {" "}{upcomingExam.formattedDate}
                      </Text>
                    </View>
                    <View style={styles.examDetail}>
                      <SvgIcon name="clock" size={13} color="#FFFFFF" />
                      <Text style={[styles.examDetailText, { color: "#FFFFFF" }]}>
                        {" "}{upcomingExam.start}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

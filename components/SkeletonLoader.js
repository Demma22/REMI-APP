import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const BONE_LIGHT = "#E2E8F0";
const BONE_DARK  = "#2A2A2A";

function useSkeletonTheme() {
  const { isDarkMode } = useTheme();
  return {
    card: isDarkMode
      ? { backgroundColor: "#1C1C1E", borderColor: "#2A2A2A" }
      : { backgroundColor: "#FFFFFF", borderColor: "#F1F5F9" },
    divider: isDarkMode ? "#2A2A2A" : "#F1F5F9",
    isDarkMode,
  };
}

// ── Base bone ──────────────────────────────────────────────────────
export function SkeletonBone({ style }) {
  const { isDarkMode } = useTheme();
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,    duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ backgroundColor: isDarkMode ? BONE_DARK : BONE_LIGHT }, { opacity: anim }, style]}
    />
  );
}

// ── Timetable screen: 7 day cards (no tab bar) ───────────────────
export function TimetableSkeleton() {
  const sk = useSkeletonTheme();
  // pattern of activity counts to mix active/empty days
  const pattern = [2, 0, 1, 3, 0, 2, 1];
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ gap: 14 }}>
        {pattern.map((activityCount, di) => (
          <View key={di} style={[sk.card, { borderRadius: 15, padding: 18 }]}>
            <View style={{ flexDirection: "row", alignItems: "stretch" }}>
              {/* Left: activity lines or empty label */}
              <View style={{ flex: 1, justifyContent: "center", gap: 10, paddingRight: 12, minHeight: 80 }}>
                {activityCount === 0 ? (
                  <SkeletonBone style={{ height: 13, width: "45%", borderRadius: 7 }} />
                ) : (
                  Array.from({ length: activityCount }).map((_, ai) => (
                    <View key={ai} style={{ gap: 5 }}>
                      <SkeletonBone style={{ height: 16, width: `${50 + ai * 14}%`, borderRadius: 8 }} />
                      <SkeletonBone style={{ height: 10, width: `${30 + ai * 10}%`, borderRadius: 7 }} />
                    </View>
                  ))
                )}
              </View>
              {/* Right: stacked day label block + action button */}
              <View style={{ alignItems: "flex-end", justifyContent: "space-between", minWidth: 72 }}>
                <SkeletonBone style={{ height: 50, width: 65, borderRadius: 10 }} />
                <SkeletonBone style={{ height: 30, width: 56, borderRadius: 15 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── List / AI scanner / deadlines: activity cards ─────────────────
export function ListSkeleton({ rows = 4 }) {
  const sk = useSkeletonTheme();
  return (
    <View style={s.page}>
      {/* Section label */}
      <SkeletonBone style={{ height: 13, width: 140, borderRadius: 7, marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[sk.card, { borderRadius: 15, padding: 20, marginBottom: 14, flexDirection: "row", alignItems: "stretch" }]}
        >
          {/* Left: name + time + optional room */}
          <View style={{ flex: 1, justifyContent: "center", gap: 6, paddingRight: 12 }}>
            <SkeletonBone style={{ height: 20, width: `${55 + i * 8}%`, borderRadius: 8 }} />
            <SkeletonBone style={{ height: 13, width: `${35 + i * 6}%`, borderRadius: 7 }} />
            {i % 2 === 0 && <SkeletonBone style={{ height: 13, width: "40%", borderRadius: 7 }} />}
          </View>
          {/* Right: date block (abbr + date line) + button */}
          <View style={{ alignItems: "flex-end", justifyContent: "space-between", minWidth: 90 }}>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <SkeletonBone style={{ height: 30, width: 60, borderRadius: 8 }} />
              <SkeletonBone style={{ height: 13, width: 50, borderRadius: 7 }} />
            </View>
            <SkeletonBone style={{ height: 30, width: 60, borderRadius: 15 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Profile screen ────────────────────────────────────────────────
export function ProfileSkeleton() {
  const sk = useSkeletonTheme();
  return (
    <View style={s.page}>
      {/* Profile card: avatar + name/email */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, paddingVertical: 8 }}>
        <SkeletonBone style={{ width: 76, height: 76, borderRadius: 38, marginRight: 18 }} />
        <View style={{ flex: 1, gap: 10 }}>
          <SkeletonBone style={{ height: 22, width: "55%", borderRadius: 8 }} />
          <SkeletonBone style={{ height: 13, width: "72%", borderRadius: 8 }} />
        </View>
      </View>

      {/* Quote section: header card + body card */}
      <View style={{ marginBottom: 20, gap: 8 }}>
        <SkeletonBone style={{ height: 56, borderRadius: 15 }} />
        <SkeletonBone style={{ height: 52, borderRadius: 15 }} />
      </View>

      {/* Account Information: label + 3-row card */}
      <View style={{ marginBottom: 20 }}>
        <SkeletonBone style={{ height: 11, width: 155, borderRadius: 6, marginBottom: 12 }} />
        <View style={[sk.card, { borderRadius: 15, paddingHorizontal: 20, overflow: "hidden" }]}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: i < 2 ? 1 : 0,
                borderBottomColor: sk.divider,
              }}
            >
              <SkeletonBone style={{ height: 14, width: "38%", borderRadius: 7 }} />
              <SkeletonBone style={{ height: 14, width: "28%", borderRadius: 7 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Logout button */}
      <SkeletonBone style={{ height: 50, borderRadius: 50 }} />
    </View>
  );
}

// ── Settings screen: section label + card rows ───────────────────
export function SettingsSkeleton() {
  const sk = useSkeletonTheme();
  // GENERAL (4 rows) + CONTACT US (2 rows)
  const sections = [
    { labelWidth: 75,  rows: 4 },
    { labelWidth: 105, rows: 2 },
  ];
  return (
    <View style={s.page}>
      {sections.map((sec, si) => (
        <View key={si} style={{ marginBottom: 28 }}>
          <SkeletonBone style={{ height: 11, width: sec.labelWidth, borderRadius: 6, marginBottom: 14 }} />
          <View style={[sk.card, { borderRadius: 15, overflow: "hidden" }]}>
            {Array.from({ length: sec.rows }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.listRow,
                  {
                    padding: 14,
                    borderBottomWidth: i < sec.rows - 1 ? 1 : 0,
                    borderBottomColor: sk.divider,
                  },
                ]}
              >
                <SkeletonBone style={{ width: 22, height: 22, borderRadius: 11, marginRight: 14 }} />
                <SkeletonBone style={{ height: 15, flex: 1, borderRadius: 8 }} />
                <SkeletonBone style={{ width: 22, height: 22, borderRadius: 11, marginLeft: 12 }} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Notifications settings: permission card + 3 toggle rows ──────
export function NotificationsSkeleton() {
  const sk = useSkeletonTheme();
  return (
    <View style={s.page}>
      {/* Permission status card */}
      <View style={[sk.card, s.listRow, { borderRadius: 15, padding: 16, marginBottom: 24 }]}>
        <SkeletonBone style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBone style={{ height: 15, width: "55%", borderRadius: 8 }} />
          <SkeletonBone style={{ height: 12, width: "80%", borderRadius: 7 }} />
        </View>
      </View>

      {/* Toggle rows */}
      {[0, 1, 2].map(i => (
        <View key={i} style={[sk.card, s.listRow, { borderRadius: 15, padding: 16, marginBottom: 12 }]}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone style={{ height: 15, width: `${50 + i * 10}%`, borderRadius: 8 }} />
            <SkeletonBone style={{ height: 12, width: `${70 + i * 8}%`, borderRadius: 7 }} />
          </View>
          <SkeletonBone style={{ width: 48, height: 28, borderRadius: 14 }} />
        </View>
      ))}
    </View>
  );
}

// ── Form screens: label + input rows ─────────────────────────────
export function FormSkeleton({ rows = 4 }) {
  return (
    <View style={s.page}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: 20 }}>
          <SkeletonBone style={{ height: 13, width: `${80 + i * 15}%`, borderRadius: 7, marginBottom: 10 }} />
          <SkeletonBone style={{ height: 52, borderRadius: 50 }} />
        </View>
      ))}
      <SkeletonBone style={{ height: 54, borderRadius: 50, marginTop: 8 }} />
    </View>
  );
}

// ── GPA screen: overall card + chart + semester cards ─────────────
export function GPASkeleton() {
  const sk = useSkeletonTheme();
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Overall GPA card */}
      <View style={[sk.card, { margin: 24, padding: 24, borderRadius: 15, alignItems: "center", gap: 12 }]}>
        <SkeletonBone style={{ height: 13, width: 110, borderRadius: 7 }} />
        <SkeletonBone style={{ height: 48, width: 90, borderRadius: 12 }} />
        <SkeletonBone style={{ height: 12, width: 150, borderRadius: 6 }} />
      </View>

      {/* Chart card */}
      <View style={[sk.card, { marginHorizontal: 24, padding: 20, borderRadius: 15 }]}>
        <SkeletonBone style={{ height: 18, width: "45%", borderRadius: 8, alignSelf: "center", marginBottom: 16 }} />
        <SkeletonBone style={{ height: 220, borderRadius: 12 }} />
      </View>

      {/* Semesters section */}
      <View style={{ paddingHorizontal: 24, marginTop: 30 }}>
        <SkeletonBone style={{ height: 20, width: 130, borderRadius: 8, marginBottom: 20 }} />
        {[0, 1, 2].map(i => (
          <View key={i} style={[sk.card, { borderRadius: 15, padding: 20, marginBottom: 16 }]}>
            {/* Semester name + gpa value */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ gap: 6, flex: 1 }}>
                <SkeletonBone style={{ height: 16, width: `${40 + i * 15}%`, borderRadius: 8 }} />
                <SkeletonBone style={{ height: 13, width: "32%", borderRadius: 7 }} />
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <SkeletonBone style={{ height: 24, width: 50, borderRadius: 8 }} />
                <SkeletonBone style={{ height: 11, width: 30, borderRadius: 6 }} />
              </View>
            </View>
            {/* Action indicator */}
            <SkeletonBone style={{ height: 13, width: "55%", borderRadius: 7 }} />
          </View>
        ))}
      </View>

      {/* Scan action button */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <SkeletonBone style={{ height: 60, borderRadius: 15 }} />
      </View>
    </ScrollView>
  );
}

// ── Onboarding: progress bar + question + options ─────────────────
export function OnboardingSkeleton() {
  const sk = useSkeletonTheme();
  return (
    <View style={{ flex: 1 }}>
      {/* Skip button area */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <SkeletonBone style={{ width: 40, height: 18, borderRadius: 8, marginLeft: "auto" }} />
      </View>
      {/* Progress dots/bar */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 32 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <SkeletonBone key={i} style={{ flex: 1, height: 5, borderRadius: 4 }} />
        ))}
      </View>
      <View style={s.page}>
        {/* Question title + subtitle */}
        <SkeletonBone style={{ height: 26, width: "75%", borderRadius: 10, marginBottom: 12 }} />
        <SkeletonBone style={{ height: 16, width: "90%", borderRadius: 8, marginBottom: 32 }} />
        {/* Option cards */}
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[sk.card, s.listRow, { borderRadius: 15, padding: 18, marginBottom: 12 }]}>
            <SkeletonBone style={{ width: 36, height: 36, borderRadius: 10, marginRight: 14 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone style={{ height: 15, width: `${55 + i * 8}%`, borderRadius: 8 }} />
              <SkeletonBone style={{ height: 12, width: `${40 + i * 6}%`, borderRadius: 7 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Dashboard / admin screen ──────────────────────────────────────
export function DashboardSkeleton() {
  const sk = useSkeletonTheme();
  return (
    <View style={s.page}>
      {/* 3 stat cards */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[sk.card, { borderRadius: 15, flex: 1, alignItems: "center", paddingVertical: 20 }]}>
            <SkeletonBone style={{ width: 36, height: 36, borderRadius: 18, marginBottom: 10 }} />
            <SkeletonBone style={{ height: 20, width: 50, borderRadius: 8, marginBottom: 6 }} />
            <SkeletonBone style={{ height: 11, width: 60, borderRadius: 7 }} />
          </View>
        ))}
      </View>
      {/* Chart */}
      <SkeletonBone style={{ height: 180, borderRadius: 15, marginBottom: 20 }} />
      {/* Data rows */}
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[sk.card, { borderRadius: 15, padding: 14, flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }]}>
          <SkeletonBone style={{ height: 14, width: "45%", borderRadius: 7 }} />
          <SkeletonBone style={{ height: 14, width: "25%", borderRadius: 7 }} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

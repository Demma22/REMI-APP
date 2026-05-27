// components/SkeletonLoader.js
import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

// ── Base bone ──────────────────────────────────────────────────────
export function SkeletonBone({ style }) {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[styles.bone, { opacity: anim }, style]}
    />
  );
}

// ── Pre-built skeleton layouts ─────────────────────────────────────

/** Profile screen: avatar card + action rows + account card */
export function ProfileSkeleton() {
  return (
    <View style={styles.page}>
      {/* Profile card */}
      <View style={[styles.card, { flexDirection: "row", alignItems: "center", marginBottom: 24 }]}>
        <SkeletonBone style={{ width: 72, height: 72, borderRadius: 36, marginRight: 16 }} />
        <View style={{ flex: 1, gap: 10 }}>
          <SkeletonBone style={{ height: 20, width: "60%", borderRadius: 8 }} />
          <SkeletonBone style={{ height: 14, width: "80%", borderRadius: 8 }} />
          <SkeletonBone style={{ height: 13, width: "45%", borderRadius: 8 }} />
        </View>
      </View>
      {/* Section title */}
      <SkeletonBone style={{ height: 16, width: 120, borderRadius: 8, marginBottom: 14 }} />
      {/* Action rows */}
      {[0, 1].map((i) => (
        <View key={i} style={[styles.listRow, { marginBottom: 12 }]}>
          <SkeletonBone style={{ width: 40, height: 40, borderRadius: 12, marginRight: 14 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone style={{ height: 15, width: "55%", borderRadius: 8 }} />
            <SkeletonBone style={{ height: 12, width: "80%", borderRadius: 8 }} />
          </View>
        </View>
      ))}
      {/* Account card */}
      <SkeletonBone style={{ height: 16, width: 150, borderRadius: 8, marginTop: 8, marginBottom: 14 }} />
      <View style={styles.card}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "#F1F5F9" }}>
            <SkeletonBone style={{ height: 13, width: "35%", borderRadius: 8 }} />
            <SkeletonBone style={{ height: 13, width: "40%", borderRadius: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Settings screen: multiple sections with menu rows */
export function SettingsSkeleton() {
  return (
    <View style={styles.page}>
      {[3, 2, 1, 2].map((count, si) => (
        <View key={si} style={{ marginBottom: 28 }}>
          <SkeletonBone style={{ height: 16, width: 110 + si * 20, borderRadius: 8, marginBottom: 14 }} />
          {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={[styles.listRow, styles.card, { marginBottom: 10 }]}>
              <SkeletonBone style={{ width: 44, height: 44, borderRadius: 14, marginRight: 14 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBone style={{ height: 15, width: "50%", borderRadius: 8 }} />
                <SkeletonBone style={{ height: 12, width: "75%", borderRadius: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Timetable screen: tab bar + day sections with lecture cards */
export function TimetableSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {/* Tab bar */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
        {[0, 1].map((i) => (
          <SkeletonBone key={i} style={{ flex: 1, height: 40, borderRadius: 20 }} />
        ))}
      </View>
      <View style={styles.page}>
        {[2, 1, 3].map((count, di) => (
          <View key={di} style={{ marginBottom: 20 }}>
            <SkeletonBone style={{ height: 14, width: 90, borderRadius: 8, marginBottom: 12 }} />
            {Array.from({ length: count }).map((_, i) => (
              <View key={i} style={[styles.card, { marginBottom: 10 }]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <SkeletonBone style={{ width: 4, height: 50, borderRadius: 4, marginRight: 14 }} />
                  <View style={{ flex: 1, gap: 10 }}>
                    <SkeletonBone style={{ height: 15, width: "60%", borderRadius: 8 }} />
                    <SkeletonBone style={{ height: 12, width: "40%", borderRadius: 8 }} />
                  </View>
                  <SkeletonBone style={{ width: 50, height: 28, borderRadius: 8 }} />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** GPA screen: overall GPA card + chart area + semester rows */
export function GPASkeleton() {
  return (
    <View style={styles.page}>
      {/* Overall GPA card */}
      <View style={[styles.card, { alignItems: "center", paddingVertical: 28, marginBottom: 20 }]}>
        <SkeletonBone style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
        <SkeletonBone style={{ height: 18, width: "40%", borderRadius: 8, marginBottom: 10 }} />
        <SkeletonBone style={{ height: 13, width: "60%", borderRadius: 8 }} />
      </View>
      {/* Chart placeholder */}
      <SkeletonBone style={{ height: 160, borderRadius: 20, marginBottom: 20 }} />
      {/* Semester rows */}
      <SkeletonBone style={{ height: 16, width: 130, borderRadius: 8, marginBottom: 14 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }]}>
          <SkeletonBone style={{ height: 14, width: "30%", borderRadius: 8 }} />
          <SkeletonBone style={{ height: 20, width: 50, borderRadius: 8 }} />
        </View>
      ))}
    </View>
  );
}

/** Notifications settings: toggle rows */
export function NotificationsSkeleton() {
  return (
    <View style={styles.page}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, styles.listRow, { marginBottom: 12 }]}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone style={{ height: 15, width: "55%", borderRadius: 8 }} />
            <SkeletonBone style={{ height: 12, width: "80%", borderRadius: 8 }} />
          </View>
          <SkeletonBone style={{ width: 48, height: 28, borderRadius: 14 }} />
        </View>
      ))}
    </View>
  );
}

/** Edit / form screens: label + input rows */
export function FormSkeleton({ rows = 3 }) {
  return (
    <View style={styles.page}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: 20 }}>
          <SkeletonBone style={{ height: 13, width: 100, borderRadius: 8, marginBottom: 8 }} />
          <SkeletonBone style={{ height: 50, borderRadius: 14 }} />
        </View>
      ))}
      <SkeletonBone style={{ height: 52, borderRadius: 16, marginTop: 12 }} />
    </View>
  );
}

/** Generic list screen: section title + N card rows */
export function ListSkeleton({ rows = 4 }) {
  return (
    <View style={styles.page}>
      <SkeletonBone style={{ height: 16, width: 120, borderRadius: 8, marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.card, styles.listRow, { marginBottom: 12 }]}>
          <SkeletonBone style={{ width: 44, height: 44, borderRadius: 14, marginRight: 14 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone style={{ height: 15, width: "55%", borderRadius: 8 }} />
            <SkeletonBone style={{ height: 12, width: "75%", borderRadius: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Generic stat / dashboard screen */
export function DashboardSkeleton() {
  return (
    <View style={styles.page}>
      {/* Stat row */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.card, { flex: 1, alignItems: "center", paddingVertical: 20 }]}>
            <SkeletonBone style={{ width: 36, height: 36, borderRadius: 18, marginBottom: 10 }} />
            <SkeletonBone style={{ height: 20, width: 50, borderRadius: 8, marginBottom: 6 }} />
            <SkeletonBone style={{ height: 11, width: 60, borderRadius: 8 }} />
          </View>
        ))}
      </View>
      {/* Chart */}
      <SkeletonBone style={{ height: 180, borderRadius: 20, marginBottom: 20 }} />
      {/* Rows */}
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }]}>
          <SkeletonBone style={{ height: 14, width: "45%", borderRadius: 8 }} />
          <SkeletonBone style={{ height: 14, width: "25%", borderRadius: 8 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: "#E2E8F0",
  },
  page: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

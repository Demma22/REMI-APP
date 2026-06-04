import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AnimatedGradientBg({ children, style }) {
  const progress = useRef(new Animated.Value(0)).current;
  const drift1   = useRef(new Animated.Value(0)).current;
  const drift2   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const main = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const d1 = Animated.loop(
      Animated.sequence([
        Animated.timing(drift1, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift1, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const d2 = Animated.loop(
      Animated.sequence([
        Animated.timing(drift2, { toValue: 1, duration: 9500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift2, { toValue: 0, duration: 9500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    main.start(); d1.start(); d2.start();
    return () => { main.stop(); d1.stop(); d2.stop(); };
  }, []);

  // ── Crossfade timing ────────────────────────────────────────────────
  // Each layer holds for ~30 % of the cycle and overlaps its neighbours
  // by 30 %, so the sum of all layer opacities is always ≥ 1.0 — no gap.
  const opA = progress.interpolate({
    inputRange:  [0, 0.2, 0.5, 0.7, 1],
    outputRange: [1, 1,   0,   0,   1],
  });
  const opB = progress.interpolate({
    inputRange:  [0, 0.2, 0.5, 0.65, 0.85, 1],
    outputRange: [0, 0,   1,   1,    0,    0],
  });
  const opC = progress.interpolate({
    inputRange:  [0, 0.65, 0.85, 0.9, 1],
    outputRange: [0, 0,    1,    1,   0],
  });

  // ── Slow positional drift ───────────────────────────────────────────
  const tyA = drift1.interpolate({ inputRange: [0, 1], outputRange: [0,  -28] });
  const txB = drift2.interpolate({ inputRange: [0, 1], outputRange: [0,   22] });
  const tyB = drift2.interpolate({ inputRange: [0, 1], outputRange: [0,  -18] });
  const tyC = drift1.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });

  const extLayer = { position: "absolute", top: -50, bottom: -50, left: -30, right: -30 };

  return (
    <View style={[styles.root, style]}>
      {/* Dark base — never pure black, always a trace of blue */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#020c30" }]} />

      {/* Permanent base tint — always opaque, the safety net for crossfade gaps */}
      <LinearGradient
        colors={["#1a2266", "#111a77", "#070b35"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated layers — extended 50 px beyond screen on each edge so drift
          never exposes the base; root's overflow:hidden clips the excess */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">

        {/* Layer A — deep brand blue-purple, TL → BR */}
        <Animated.View style={[extLayer, { opacity: opA, transform: [{ translateY: tyA }] }]}>
          <LinearGradient
            colors={["#1e2db5", "#0d1650", "#040d2e"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Layer B — brighter brand, TR → BL */}
        <Animated.View style={[extLayer, { opacity: opB, transform: [{ translateX: txB }, { translateY: tyB }] }]}>
          <LinearGradient
            colors={["#040d2e", "#2538cc", "#0d1650"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>

        {/* Layer C — brand-purple accent, near-vertical centre */}
        <Animated.View style={[extLayer, { opacity: opC, transform: [{ translateY: tyC }] }]}>
          <LinearGradient
            colors={["#0d1650", "rgba(83,95,253,0.88)", "#040d2e"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.35, y: 0 }}
            end={{ x: 0.65, y: 1 }}
          />
        </Animated.View>

      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
});

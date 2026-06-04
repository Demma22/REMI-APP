import React, { useRef, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  makeMutable,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from './SvgIcon';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { label: 'Schedule',  svgName: 'calendar', svgFill: 'calendar-fill', screen: 'Timetable' },
  { label: 'Deadlines', svgName: 'clock',    svgFill: 'clock-fill',    screen: 'Deadlines' },
  { label: 'Home',      svgName: 'home',     svgFill: 'house-fill',    screen: 'Home'      },
  { label: 'Focus',     svgName: 'focus',    svgFill: 'focus-fill',    screen: 'Focus'     },
  { label: 'Profile',   svgName: 'user',     svgFill: 'user-fill',     screen: 'Profile'   },
];

const LABEL_WIDTHS = { Schedule: 78, Focus: 54, Home: 52, Deadlines: 72, Profile: 50 };
const ACTIVE_FLEX  = { Schedule: 2.8, Deadlines: 2.65, Focus: 2.2, Home: 2.2, Profile: 2.1 };

const SPRING = { damping: 22, stiffness: 320, mass: 0.75 };
const PRESS_SPRING = { damping: 18, stiffness: 450 };

// ─── Single tab ───────────────────────────────────────────────────────────────

const TabItem = memo(({ item, isActive, onPress, flexSV, theme }) => {
  const activeFlex  = ACTIVE_FLEX[item.label] ?? 2.4;
  const labelWidth  = LABEL_WIDTHS[item.label] ?? 60;
  const scaleSV     = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    flex: flexSV.value,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const contentStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: interpolate(flexSV.value, [1, activeFlex], [0, 14]),
    transform: [{ scale: scaleSV.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    width: interpolate(flexSV.value, [1, activeFlex], [0, labelWidth]),
    opacity: interpolate(flexSV.value, [1, 1 + (activeFlex - 1) * 0.45, activeFlex], [0, 0, 1]),
    marginLeft: interpolate(flexSV.value, [1, activeFlex], [0, 5]),
    overflow: 'hidden',
  }));

  const handlePressIn = () => {
    scaleSV.value = withSpring(0.93, PRESS_SPRING);
  };

  const handlePressOut = () => {
    scaleSV.value = withSpring(1, PRESS_SPRING);
  };

  return (
    <Reanimated.View style={containerStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Reanimated.View style={contentStyle}>
          <SvgIcon name={isActive ? item.svgFill : item.svgName} size={20} color={isActive ? theme.colors.primary : theme.colors.navText} />
          <Reanimated.View style={labelStyle}>
            <Text style={[styles.label, { color: isActive ? theme.colors.primary : theme.colors.navText }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Reanimated.View>
        </Reanimated.View>
      </TouchableOpacity>
    </Reanimated.View>
  );
});

// ─── Bar ─────────────────────────────────────────────────────────────────────

const NavigationBar = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { theme }  = useTheme();
  const insets     = useSafeAreaInsets();
  const bottomPad  = insets.bottom > 0 ? insets.bottom : 8;

  const barContentWidth = useRef(0);

  // Pill shared values — position and width animate independently
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(60);

  // One mutable shared value per tab — makeMutable is the non-hook equivalent of
  // useSharedValue, safe to call inside useRef's initializer.
  const flexSVs = useRef(
    NAV_ITEMS.map(item =>
      makeMutable(item.screen === route.name ? (ACTIVE_FLEX[item.label] ?? 2.4) : 1)
    )
  ).current;

  // Calculate the x offset and width of the tab at `targetIdx` when it is active,
  // based on the bar's total content width. Pure math — no onLayout per tab needed.
  const calcPillLayout = useCallback((targetIdx) => {
    const bw = barContentWidth.current;
    if (!bw) return null;

    const flexes = NAV_ITEMS.map((item, i) =>
      i === targetIdx ? (ACTIVE_FLEX[item.label] ?? 2.4) : 1
    );
    const totalFlex = flexes.reduce((s, f) => s + f, 0);

    let x = 0;
    for (let i = 0; i < targetIdx; i++) x += bw * (flexes[i] / totalFlex);
    const w = bw * (flexes[targetIdx] / totalFlex);
    return { x, w };
  }, []);

  // Initialise pill position once the bar has been measured (fires once on mount)
  const initialRouteRef = useRef(route.name);
  const onBarLayout = useCallback((e) => {
    barContentWidth.current = e.nativeEvent.layout.width;
    const activeIdx = NAV_ITEMS.findIndex(i => i.screen === initialRouteRef.current);
    const layout = calcPillLayout(activeIdx);
    if (layout) {
      // Snap — no spring on first paint
      pillX.value = layout.x;
      pillW.value = layout.w;
    }
  }, [calcPillLayout]);

  const handlePress = useCallback((screen, idx) => {
    const layout = calcPillLayout(idx);
    if (layout) {
      pillX.value = withSpring(layout.x, SPRING);
      pillW.value = withSpring(layout.w, SPRING);
    }

    // Animate all tab flex values simultaneously
    NAV_ITEMS.forEach((item, i) => {
      const target = i === idx ? (ACTIVE_FLEX[item.label] ?? 2.4) : 1;
      flexSVs[i].value = withSpring(target, SPRING);
    });

    navigation.navigate(screen);
  }, [calcPillLayout, flexSVs, navigation]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
    borderColor: theme.colors.primary,
  }));

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: bottomPad,
          backgroundColor: theme.colors.navBackground,
          borderTopColor: theme.colors.navBorder,
        },
      ]}
    >
      {/* Inner row: pill sits here absolutely, tabs on top */}
      <View style={styles.tabsRow} onLayout={onBarLayout}>
        {/* Floating pill — rendered first so it sits beneath tab content */}
        <Reanimated.View style={[styles.pill, pillStyle]} pointerEvents="none" />

        {NAV_ITEMS.map((item, idx) => (
          <TabItem
            key={item.screen}
            item={item}
            isActive={route.name === item.screen}
            onPress={() => handlePress(item.screen, idx)}
            flexSV={flexSVs[idx]}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default NavigationBar;

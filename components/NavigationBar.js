import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from './SvgIcon';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { label: 'Schedule',  svgName: 'calendar',    screen: 'Timetable' },
  { label: 'Focus',     svgName: 'focus',        screen: 'Focus'     },
  { label: 'Home',      svgName: 'home',         screen: 'Home'      },
  { label: 'Deadlines', svgName: 'clock',        screen: 'Deadlines' },
  { label: 'Profile',   svgName: 'user',         screen: 'Profile'   },
];

// Widths (px) that the label text needs — measured per label at fontSize 13
const LABEL_WIDTHS = { Schedule: 78, Focus: 54, Home: 52, Deadlines: 72, Profile: 50 };

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;

  // One Animated.Value per tab: 0 = inactive, 1 = active
  const anims = useRef(
    NAV_ITEMS.map(item => new Animated.Value(item.screen === route.name ? 1 : 0))
  ).current;

  useEffect(() => {
    const activeIdx = NAV_ITEMS.findIndex(item => item.screen === route.name);
    anims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === activeIdx ? 1 : 0,
        useNativeDriver: false,
        tension: 60,
        friction: 9,
      }).start();
    });
  }, [route.name]);

  return (
    <View
      style={[
        styles.bar,
        { bottom: bottomPad, backgroundColor: theme.colors.navBackground, borderColor: theme.colors.navBorder },
      ]}
    >
      {NAV_ITEMS.map((item, idx) => {
        const active = route.name === item.screen;
        const labelW = LABEL_WIDTHS[item.label] ?? 60;

        // Container grows from flex 1 → 2.8 so other tabs slide outward smoothly
        const flex = anims[idx].interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });

        // Pill background fades in
        const pillBg = anims[idx].interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(83,95,253,0)', 'rgba(83,95,253,1)'],
        });

        // Horizontal padding of the pill grows to give breathing room around icon+label
        const pillPadH = anims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

        // Label container expands from 0 → measured width
        const labelContainerW = anims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, labelW] });

        // Gap between icon and label: 0 while collapsed, 5 when open
        const labelMarginL = anims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, 5] });

        // Label text fades in during the second half of the expand
        const labelOpacity = anims[idx].interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0, 0, 1],
        });

        return (
          <Animated.View
            key={item.screen}
            style={{ flex, alignItems: 'center', justifyContent: 'center' }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.pill,
                  { backgroundColor: pillBg, paddingHorizontal: pillPadH },
                ]}
              >
                <SvgIcon
                  name={item.svgName}
                  size={20}
                  color={active ? '#FFFFFF' : theme.colors.navText}
                />
                <Animated.View
                  style={{ width: labelContainerW, marginLeft: labelMarginL, overflow: 'hidden' }}
                >
                  <Animated.Text
                    style={[styles.label, { opacity: labelOpacity }]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Animated.Text>
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default NavigationBar;

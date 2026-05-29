import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from './SvgIcon';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { label: 'Schedule', svgName: 'calendar', screen: 'Timetable' },
  { label: 'GPA', svgName: 'chart-line', screen: 'GPA' },
  { label: 'Home', svgName: 'home', screen: 'Home' },
  { label: 'Deadlines', svgName: 'clock', screen: 'Deadlines' },
  { label: 'Profile', svgName: 'user', screen: 'Profile' },
];

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom + 8;
  const isActive = (screen) => route.name === screen;

  return (
    <View style={[styles.container, {
      bottom: bottomPadding,
      backgroundColor: theme.colors.navBackground,
      borderColor: theme.colors.navBorder,
    }]}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.screen);
        return (
          <TouchableOpacity
            key={item.screen}
            style={styles.item}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              <SvgIcon
                name={item.svgName}
                size={20}
                color={active ? '#FFFFFF' : theme.colors.navText}
              />
              {active && (
                <Text style={styles.pillLabel}>{item.label}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  pillActive: {
    backgroundColor: '#535FFD',
    paddingHorizontal: 14,
  },
  pillLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NavigationBar;

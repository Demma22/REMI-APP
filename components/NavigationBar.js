// components/NavigationBar.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from './SvgIcon';
import { useTheme } from '../contexts/ThemeContext';

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom + 8;

  const navItems = [
    { name: 'Home', svgName: 'home', screen: 'Home' },
    { name: 'Timetable', svgName: 'calendar', screen: 'Timetable' },
    { name: 'GPA', svgName: 'chart-line', screen: 'GPA' },
    { name: 'Settings', svgName: 'cog', screen: 'Settings' },
    { name: 'Profile', svgName: 'user', screen: 'Profile' },
  ];

  const isActive = (screenName) => route.name === screenName;

  const styles = getStyles(theme, bottomPadding);

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.navIconContainer,
            isActive(item.screen) && styles.activeIconContainer,
          ]}>
            <SvgIcon
              name={item.svgName}
              size={22}
              color={isActive(item.screen) ? theme.colors.primary : theme.colors.navText}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getStyles = (theme, bottomPadding) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: bottomPadding,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: theme.colors.navBackground,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 32,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.navBorder,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    width: 48,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: 'transparent',
  },
});

export default NavigationBar;

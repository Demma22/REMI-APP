// components/NavigationBar.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from './SvgIcon';
import { useTheme } from '../contexts/ThemeContext';

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding to account for Android navigation bar/gesture area
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom + 8;

  const navItems = [
    { 
      name: 'Home', 
      svgName: 'home',
      screen: 'Home',
      label: 'Home'
    },
    { 
      name: 'Timetable', 
      svgName: 'calendar',
      screen: 'Timetable',
      label: 'Timetable'
    },
    { 
      name: 'Chat', 
      svgName: 'message',
      screen: 'Chat',
      label: 'Chat'
    },
    { 
      name: 'GPA', 
      svgName: 'chart-line',
      screen: 'GPA',
      label: 'GPA'
    },
    { 
      name: 'Profile', 
      svgName: 'user',
      screen: 'Profile',
      label: 'Profile'
    },
  ];

  const isActive = (screenName) => {
    return route.name === screenName;
  };

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
            isActive(item.screen) && styles.activeIconContainer
          ]}>
            <SvgIcon 
              name={item.svgName} 
              size={22} 
              color={isActive(item.screen) ? theme.colors.primary : theme.colors.navText} 
            />
          </View>
          <Text style={[
            styles.navText,
            isActive(item.screen) && styles.activeText
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getStyles = (theme, bottomPadding) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: bottomPadding,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: theme.colors.navBackground,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 28,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.navBorder,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navIconContainer: {
    width: 40,
    height: 32,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: theme.colors.primaryLight,
  },
  navText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.navText,
  },
  activeText: {
    color: theme.colors.navActive,
    fontWeight: '600',
  },
});

export default NavigationBar;
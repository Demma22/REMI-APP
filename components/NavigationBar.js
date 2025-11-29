// components/NavigationBar.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    { 
      name: 'Home', 
      icon: '🏠', 
      screen: 'Home',
      label: 'Home'
    },
    { 
      name: 'Timetable', 
      icon: '📅', 
      screen: 'Timetable',
      label: 'Timetable'
    },
    { 
      name: 'Chat', 
      icon: '💬', 
      screen: 'Chat',
      label: 'Chat'
    },
    { 
      name: 'GPA', 
      icon: '📊', 
      screen: 'GPA',
      label: 'GPA'
    },
    { 
      name: 'Profile', 
      icon: '👤', 
      screen: 'Profile',
      label: 'Profile'
    },
  ];

  const isActive = (screenName) => {
    return route.name === screenName;
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.navIcon,
            isActive(item.screen) && styles.activeIcon
          ]}>
            {item.icon}
          </Text>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
    color: '#666666',
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeIcon: {
    color: '#535FFD',
  },
  activeText: {
    color: '#535FFD',
    fontWeight: '600',
  },
});

export default NavigationBar;
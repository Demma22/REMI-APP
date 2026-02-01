// contexts/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme colors for light and dark mode
export const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#535FFD',
    primaryLight: 'rgba(83, 95, 253, 0.1)',
    secondary: '#FF8A23',
    secondaryLight: 'rgba(255, 138, 35, 0.1)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    
    // Background colors
    background: '#FAFAFA',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#F8FAFC',
    
    // Text colors
    textPrimary: '#383940',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    
    // Border colors
    border: '#F1F5F9',
    borderLight: '#F8FAFC',
    borderDark: '#E2E8F0',
    
    // Card colors
    card: '#FFFFFF',
    cardLight: '#FAFAFA',
    
    // Shadow
    shadow: '#000000',
    
    // Input
    inputBackground: '#FFFFFF',
    inputBorder: '#F1F5F9',
    inputText: '#383940',
    placeholder: '#94A3B8',
    
    // Status
    active: '#10B981',
    inactive: '#94A3B8',
    
    // Navigation
    navBackground: '#FFFFFF',
    navBorder: '#F0F0F0',
    navText: '#666666',
    navActive: '#535FFD',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' },
    h2: { fontSize: 24, fontWeight: '700' },
    h3: { fontSize: 20, fontWeight: '700' },
    h4: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' },
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#7986FF',
    primaryLight: 'rgba(121, 134, 255, 0.2)',
    secondary: '#FF9F4D',
    secondaryLight: 'rgba(255, 159, 77, 0.2)',
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.2)',
    danger: '#F87171',
    dangerLight: 'rgba(248, 113, 113, 0.2)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.2)',
    
    // Threads Dark Mode Palette - True black with subtle gradients
    background: '#000000', // Pure black for main background (Threads uses true black)
    backgroundSecondary: '#0F0F0F', // Very dark gray for secondary backgrounds
    backgroundTertiary: '#1A1A1A', // Slightly lighter for tertiary backgrounds
    
    // Text colors - Threads uses high contrast white text
    textPrimary: '#FFFFFF', // Pure white for primary text
    textSecondary: '#E0E0E0', // Slightly off-white for secondary text
    textTertiary: '#A0A0A0', // Muted gray for tertiary text
    
    // Border colors - Threads uses very subtle borders
    border: '#2A2A2A', // Very dark gray borders
    borderLight: '#1A1A1A', // Even darker for light borders
    borderDark: '#0A0A0A', // Almost black for dark borders
    
    // Card colors
    card: '#0F0F0F', // Card background - very dark gray
    cardLight: '#000000', // Pure black for light cards
    
    // Shadow
    shadow: '#000000',
    
    // Input
    inputBackground: '#1A1A1A',
    inputBorder: '#2A2A2A',
    inputText: '#FFFFFF',
    placeholder: '#707070', // Threads uses a medium gray for placeholders
    
    // Status
    active: '#34D399',
    inactive: '#707070',
    
    // Navigation
    navBackground: '#0F0F0F',
    navBorder: '#2A2A2A',
    navText: '#E0E0E0',
    navActive: '#7986FF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' },
    h2: { fontSize: 24, fontWeight: '700' },
    h3: { fontSize: 20, fontWeight: '700' },
    h4: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' },
  },
};

// Create context
const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
  isDarkMode: false,
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when dark mode changes
  useEffect(() => {
    setTheme(isDarkMode ? darkTheme : lightTheme);
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (darkMode) => {
    try {
      await AsyncStorage.setItem('@theme_preference', darkMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    saveThemePreference(newDarkMode);
  };

  const setThemeMode = (darkMode) => {
    setIsDarkMode(darkMode);
    saveThemePreference(darkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Helper hook for styles
export const useStyles = (createStyles) => {
  const { theme } = useTheme();
  return createStyles(theme);
};
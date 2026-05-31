// components/ScreenHeader.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from './SvgIcon';
import { useTheme } from '../contexts/ThemeContext';

/**
 * type="home"   — greeting header with avatar on left, bell on right
 * type="back"   — page header with back button, centered title, optional right slot
 */
const ScreenHeader = ({
  type = 'back',
  // home props
  greeting,
  userName,
  profileImage,
  onProfilePress,
  onNotificationPress,
  // back props
  title,
  onBackPress,
  rightElement,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'ios' ? Math.max(insets.top, 44) : 40;
  const styles = getStyles(theme, topPad);

  if (type === 'home') {
    return (
      <View style={styles.homeContainer}>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImg} />
          ) : (
            <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primary }]}>
              <SvgIcon name="user" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.homeGreeting}>
          <Text style={styles.homeGreetingText}>{greeting}</Text>
          <Text style={styles.homeUserName}>{userName}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onNotificationPress}
          activeOpacity={0.8}
        >
          <SvgIcon name="bell" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.pageContainer, containerStyle]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.8}>
        <SvgIcon name="arrow-back" size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.pageTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSlot}>
        {rightElement ?? <View style={{ width: 40 }} />}
      </View>
    </View>
  );
};

const getStyles = (theme, topPad) =>
  StyleSheet.create({
    // ── Home header ────────────────────────────────────────────────
    homeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: topPad,
      paddingBottom: 18,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.backgroundSecondary,
      gap: 12,
    },
    profileBtn: {
      flexShrink: 0,
    },
    profileImg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    profilePlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    homeGreeting: {
      flex: 1,
    },
    homeGreetingText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 1,
    },
    homeUserName: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexShrink: 0,
    },

    // ── Back / page header ─────────────────────────────────────────
    pageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: topPad,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexShrink: 0,
    },
    pageTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginHorizontal: 8,
    },
    rightSlot: {
      width: 40,
      alignItems: 'flex-end',
      flexShrink: 0,
    },
  });

export default ScreenHeader;

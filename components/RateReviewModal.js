// components/RateReviewModal.js
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import SvgIcon from './SvgIcon';
import { setHasRated, incrementReminderCount } from '../utils/rateReviewTracker';

export default function RateReviewModal({ navigation, route }) {
  const { theme } = useTheme();

  const handleRate = async () => {
    try {
      await setHasRated();
      
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/idYOUR_APP_ID',
        android: 'https://play.google.com/store/apps/details?id=com.anonymous.remi',
      });
      
      const fallbackUrl = Platform.select({
        ios: 'https://apps.apple.com/app/idYOUR_APP_ID',
        android: 'https://play.google.com/store/apps/details?id=com.anonymous.remi',
      });
      
      const canOpen = await Linking.canOpenURL(storeUrl);
      
      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error opening store:', error);
      navigation.goBack();
    }
  };

  const handleRemindLater = async () => {
    await incrementReminderCount();
    navigation.goBack();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    rateButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    rateButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    remindButton: {
      backgroundColor: 'transparent',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    remindButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    dismissButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
    },
  });

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={handleRemindLater}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.dismissButton} onPress={handleRemindLater}>
            <SvgIcon name="close" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <SvgIcon name="star" size={32} color={theme.colors.secondary} />
          </View>

          <Text style={styles.title}>Love using REMI?</Text>
          <Text style={styles.subtitle}>
            Your rating helps us improve and reach more students. Rate us 5 stars on the app store!
          </Text>

          <TouchableOpacity style={styles.rateButton} onPress={handleRate}>
            <Text style={styles.rateButtonText}>Rate 5 Stars</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.remindButton} onPress={handleRemindLater}>
            <Text style={styles.remindButtonText}>Remind me later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
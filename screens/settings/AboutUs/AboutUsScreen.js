// screens/settings/AboutUsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import { getStyles } from './AboutUsScreen.styles';

export default function AboutUs({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Instagram link (created)
  const handleInstagram = () => {
    Linking.openURL('https://www.instagram.com/rem.i_app/').catch(() => {
      Alert.alert('Error', 'Could not open Instagram');
    });
  };

  // Twitter/X link (commented - not created yet)
  const handleTwitter = () => {
    Alert.alert(
      'Coming Soon',
      'Our Twitter account is coming soon! Follow us for updates.',
      [{ text: 'OK' }]
    );
    // Uncomment when account is created:
    // Linking.openURL('https://twitter.com/remi_app').catch(() => {
    //   Alert.alert('Error', 'Could not open Twitter');
    // });
  };

  // Threads link (commented - not created yet)
  const handleThreads = () => {
    Alert.alert(
      'Coming Soon',
      'Our Threads account is coming soon! Stay tuned.',
      [{ text: 'OK' }]
    );
    // Uncomment when account is created:
    // Linking.openURL('https://threads.net/@remi_app').catch(() => {
    //   Alert.alert('Error', 'Could not open Threads');
    // });
  };

  // TikTok link (commented - not created yet)
  const handleTikTok = () => {
    Alert.alert(
      'Coming Soon',
      'Our TikTok account is coming soon! Get ready for fun content.',
      [{ text: 'OK' }]
    );
    // Uncomment when account is created:
    // Linking.openURL('https://tiktok.com/@remi_app').catch(() => {
    //   Alert.alert('Error', 'Could not open TikTok');
    // });
  };

  const socials = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      handle: handleInstagram,
      created: true,
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: 'x',
      color: '#1DA1F2',
      handle: handleTwitter,
      created: false,
    },
    {
      id: 'threads',
      name: 'Threads',
      icon: 'threads',
      color: '#000000',
      handle: handleThreads,
      created: false,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'tiktok',
      color: '#000000',
      handle: handleTikTok,
      created: false,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo and Name */}

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            About REMI
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            REMI is your all-in-one academic assistant designed to help students manage their 
            studies effectively. From tracking lectures and exams to calculating GPA and providing 
            study reminders, REMI is here to make your academic journey smoother and more organized.
          </Text>
        </View>

    
        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Connect With Us
          </Text>
          <Text style={[styles.socialSubtitle, { color: theme.colors.textTertiary }]}>
            Follow us for updates, tips, and support
          </Text>
          
          <View style={styles.socialGrid}>
            {socials.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                ]}
                onPress={social.handle}
              >
                <View style={[styles.socialIconContainer, { backgroundColor: social.color + '20' }]}>
                  <SvgIcon name={social.icon} size={24} color={social.color} />
                </View>
                <Text style={[styles.socialName, { color: theme.colors.textPrimary }]}>
                  {social.name}
                </Text>
                {!social.created && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>
            S.N.D Product
          </Text>
          <Text style={[styles.copyrightText, { color: theme.colors.textTertiary }]}>
            © 2024 REMI. All rights reserved.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

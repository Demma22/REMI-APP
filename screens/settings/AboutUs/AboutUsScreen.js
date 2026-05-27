// screens/settings/AboutUsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import { getStyles } from './AboutUsScreen.styles';
import ScreenHeader from '../../../components/ScreenHeader';

export default function AboutUs({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Handle website link
  const handleWebsite = () => {
    Linking.openURL('https://sndstudio-ug.com/').catch(() => {
      Alert.alert('Error', 'Could not open website');
    });
  };

  // Instagram link
  const handleInstagram = () => {
    Linking.openURL('https://www.instagram.com/rem.i_app/').catch(() => {
      Alert.alert('Error', 'Could not open Instagram');
    });
  };

  // Twitter/X link (coming soon)
  const handleTwitter = () => {
    Alert.alert(
      'Coming Soon',
      'Our Twitter account is coming soon! Follow us for updates.',
      [{ text: 'OK' }]
    );
  };

  // Threads link (coming soon)
  const handleThreads = () => {
    Alert.alert(
      'Coming Soon',
      'Our Threads account is coming soon! Stay tuned.',
      [{ text: 'OK' }]
    );
  };

  // TikTok link (coming soon)
  const handleTikTok = () => {
    Alert.alert(
      'Coming Soon',
      'Our TikTok account is coming soon! Get ready for fun content.',
      [{ text: 'OK' }]
    );
  };

  const socials = [
    {
      id: 'website',
      name: 'Website',
      icon: 'web',
      color: '#535FFD',
      handle: handleWebsite,
      created: true,
    },
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
      <ScreenHeader title="About Us" onBackPress={() => navigation.goBack()} />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SND Studio Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/icons/snd.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* SND Studio Branding */}
        <View style={styles.studioSection}>
          <Text style={[styles.studioName, { color: theme.colors.primary }]}>
            SND Studio
          </Text>
          <Text style={[styles.studioTagline, { color: theme.colors.textSecondary }]}>
            Think It. Let's Create It.
          </Text>
        </View>

        {/* REMI Product Info */}
        <View style={styles.divider} />
        
        <View style={styles.productSection}>
          <Text style={[styles.productName, { color: theme.colors.textPrimary }]}>
            REMI
          </Text>
          <Text style={[styles.productDesc, { color: theme.colors.textSecondary }]}>
            Your all-in-one academic assistant designed to help students manage their 
            studies effectively. From tracking lectures and exams to calculating GPA and providing 
            study reminders, REMI is here to make your academic journey smoother and more organized.
          </Text>
        </View>

        {/* Website Button */}
        <TouchableOpacity 
          style={[styles.websiteButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleWebsite}
        >
          <SvgIcon name="web" size={20} color="#FFFFFF" />
          <Text style={styles.websiteButtonText}>Visit SND Studio Website</Text>
        </TouchableOpacity>

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
            © 2026 REMI. All rights reserved.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}
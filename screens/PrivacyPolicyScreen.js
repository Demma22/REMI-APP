// screens/PrivacyPolicyScreen.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* App Logo */}
          <View style={styles.appHeader}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Privacy Policy</Text>
            <Text style={styles.appTagline}>Your data is protected</Text>
          </View>

          {/* Last Updated */}
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>Last Updated: {new Date().toLocaleDateString()}</Text>
          </View>

          {/* Privacy Policy Content */}
          <View style={styles.section}>
            <Text style={styles.title}>REMI Privacy Policy</Text>
            
            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Introduction</Text>
              <Text style={styles.bodyText}>
                Remi is a mobile-based academic assistant designed to help university students manage timetables, GPA calculations, exams, and academic planning with AI support. This Privacy Policy explains how we collect, use, store, and protect your data.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Information We Collect</Text>
              <Text style={styles.bodyText}>
                We collect information you provide during registration and onboarding, including academic details such as course structure, timetable entries, exam schedules, and GPA records. We may also collect basic technical data required for app functionality.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>
              <Text style={styles.bodyText}>
                Your information is used to provide core app features such as timetable management, GPA calculation, exam planning, reminders, and personalized AI assistance. Data is processed only to improve your academic experience.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>AI Assistant and Data Access</Text>
              <Text style={styles.bodyText}>
                The AI assistant accesses limited academic data (timetable, exams, GPA history) strictly to provide personalized responses. Chat history is limited and automatically managed to preserve privacy.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Data Storage and Security</Text>
              <Text style={styles.bodyText}>
                All user data is securely stored using Firebase Firestore with authentication and access control. Data transmission is encrypted using HTTPS, and access is restricted to authorized users only.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Data Sharing</Text>
              <Text style={styles.bodyText}>
                Remi does not sell or share your personal data with third parties. Academic data is never shared externally except where required for essential app functionality (e.g., AI processing).
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>User Rights</Text>
              <Text style={styles.bodyText}>
                You may access, update, or delete your data at any time from within the app. You may also request account and data deletion by contacting support.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Children's Privacy</Text>
              <Text style={styles.bodyText}>
                Remi is intended for university students and is not designed for children under the age of 13.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Changes to This Policy</Text>
              <Text style={styles.bodyText}>
                We may update this Privacy Policy from time to time. Changes will be communicated through the app.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <Text style={styles.bodyText}>
                If you have questions or concerns about this Privacy Policy, please contact us via the support email provided in the app.
              </Text>
            </View>

            {/* Data Protection Principles */}
            <View style={styles.principlesContainer}>
              <Text style={styles.principlesTitle}>Our Data Protection Principles</Text>
              
              <View style={styles.principleItem}>
                <Text style={styles.principleEmoji}>📊</Text>
                <View style={styles.principleText}>
                  <Text style={styles.principleTitle}>Minimal Data Collection</Text>
                  <Text style={styles.principleDescription}>We only collect data essential for app functionality</Text>
                </View>
              </View>

              <View style={styles.principleItem}>
                <Text style={styles.principleEmoji}>🔒</Text>
                <View style={styles.principleText}>
                  <Text style={styles.principleTitle}>No External Sharing</Text>
                  <Text style={styles.principleDescription}>Your academic data stays within the app</Text>
                </View>
              </View>

              <View style={styles.principleItem}>
                <Text style={styles.principleEmoji}>🛡️</Text>
                <View style={styles.principleText}>
                  <Text style={styles.principleTitle}>End-to-End Security</Text>
                  <Text style={styles.principleDescription}>Encrypted storage and transmission</Text>
                </View>
              </View>

              <View style={styles.principleItem}>
                <Text style={styles.principleEmoji}>👤</Text>
                <View style={styles.principleText}>
                  <Text style={styles.principleTitle}>User Control</Text>
                  <Text style={styles.principleDescription}>Full control over your data at all times</Text>
                </View>
              </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.acceptButtonEmoji}>✓</Text>
              <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  backButtonText: {
    fontSize: 24,
    color: "#383940",
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 24,
  },
  appHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: "#64748B",
  },
  updateContainer: {
    alignItems: "center",
    marginBottom: 32,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  updateText: {
    fontSize: 14,
    color: "#64748B",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 24,
    textAlign: "center",
  },
  paragraph: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
  },
  principlesContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  principlesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 16,
    textAlign: "center",
  },
  principleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  principleEmoji: {
    fontSize: 24,
    width: 40,
    textAlign: "center",
  },
  principleText: {
    flex: 1,
  },
  principleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 2,
  },
  principleDescription: {
    fontSize: 12,
    color: "#64748B",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    backgroundColor: "#535FFD",
  },
  acceptButtonEmoji: {
    fontSize: 20,
    color: "white",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
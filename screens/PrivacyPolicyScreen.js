import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function PrivacyPolicyScreen({ navigation }) {
  const handleDataDelete = () => {
    navigation.navigate("DataDelete");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>REMI Privacy Policy</Text>
          
          <Text style={styles.lastUpdated}>Last Updated: February 2024</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introduction</Text>
            <Text style={styles.sectionText}>
              REMI is a mobile-based academic assistant designed to help university students manage timetables, GPA calculations, exams, and academic planning with AI support. This Privacy Policy explains how we collect, use, store, and protect your data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information you provide during registration and onboarding, including academic details such as course structure, timetable entries, exam schedules, and GPA records. We may also collect basic technical data required for app functionality.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              Your information is used solely to provide REMI's core features, including timetable management, GPA calculation, exam planning, reminders, and personalized AI assistance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Assistant and Data Access</Text>
            <Text style={styles.sectionText}>
              The AI assistant accesses limited academic data (such as timetables, exams, and GPA history) strictly to provide personalized responses. Chat history is limited and managed to preserve user privacy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Storage and Security</Text>
            <Text style={styles.sectionText}>
              All user data is securely stored using Firebase Firestore with authentication and access controls. Data transmission is encrypted using HTTPS, and access is restricted to authorized users only.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.sectionText}>
              REMI does not sell or share personal data with third parties. Academic data is not shared externally except where required for essential app functionality, such as AI processing.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Rights</Text>
            <Text style={styles.sectionText}>
              Users may access, update, or request deletion of their data at any time.
            </Text>
            <TouchableOpacity onPress={handleDataDelete}>
              <Text style={styles.linkText}>To request deletion of your account and associated data, please visit our Data Deletion page.</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children's Privacy</Text>
            <Text style={styles.sectionText}>
              REMI is intended for university students and is not designed for children under the age of 13.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy from time to time. Any changes will be communicated through the app or updated on this page.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Text style={styles.sectionText}>
              For questions regarding this Privacy Policy, our primary support channel is within the REMI app. For direct assistance, you may also contact us:

Email: denisssendagire22@gmail.com

WhatsApp: +256 742 072 661
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backText: { 
    fontSize: 24, 
    color: "#535FFD", 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#383940",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: "#64748B",
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 24,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 16,
    color: "#535FFD",
    textDecorationLine: 'underline',
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});
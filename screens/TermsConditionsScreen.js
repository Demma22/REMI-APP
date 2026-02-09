// screens/TermsConditionsScreen.js
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

export default function TermsConditionsScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
          </View>

          {/* Last Updated */}
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>📅 Last Updated: {new Date().toLocaleDateString()}</Text>
          </View>

          {/* Terms Content */}
          <View style={styles.section}>
            <Text style={styles.title}>REMI Terms and Conditions</Text>
            
            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Introduction</Text>
              <Text style={styles.bodyText}>
                These Terms and Conditions govern your use of the Remi mobile application. By using the app, you agree to these terms.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Use of the App</Text>
              <Text style={styles.bodyText}>
                Remi is provided as an academic assistance tool. You agree to use the app only for lawful and educational purposes.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>User Accounts</Text>
              <Text style={styles.bodyText}>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted through your account.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Academic Data Accuracy</Text>
              <Text style={styles.bodyText}>
                While Remi provides automated GPA calculations and scheduling tools, the app does not guarantee academic outcomes. Users are responsible for verifying official academic records.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>AI Assistance Disclaimer</Text>
              <Text style={styles.bodyText}>
                The AI assistant provides guidance based on user-provided academic data. Responses are informational and should not replace official academic advice from your institution.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Intellectual Property</Text>
              <Text style={styles.bodyText}>
                All content, features, and functionality of the Remi app are the property of the developer and may not be copied or redistributed without permission.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Limitation of Liability</Text>
              <Text style={styles.bodyText}>
                Remi is provided on an 'as is' basis. We are not liable for any academic decisions, data loss, or damages resulting from app use.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Termination</Text>
              <Text style={styles.bodyText}>
                We reserve the right to suspend or terminate accounts that misuse the app or violate these terms.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Changes to Terms</Text>
              <Text style={styles.bodyText}>
                We may update these Terms and Conditions periodically. Continued use of the app indicates acceptance of updated terms.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Governing Law</Text>
              <Text style={styles.bodyText}>
                These Terms and Conditions are governed by the laws applicable in Uganda.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <Text style={styles.bodyText}>
                For questions regarding these Terms, please contact us through the support email provided in the app.
              </Text>
            </View>

            {/* Agreement Confirmation */}
            <View style={styles.agreementContainer}>
              <Text style={styles.agreementEmoji}>✅</Text>
              <Text style={styles.agreementText}>
                By using REMI, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
              </Text>
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
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
    marginBottom: 24,
    gap: 12,
  },
  agreementEmoji: {
    fontSize: 24,
    marginTop: -2,
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#383940",
    flex: 1,
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
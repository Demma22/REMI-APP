import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";

export default function DataDeleteScreen({ navigation }) {
  const email = "denisssendagire22@gmail.com";
  const whatsappNumber = "+256 742 072 661";

  const handleEmailPress = async () => {
    const url = `mailto:${email}?subject=REMI Data Deletion Request`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      alert("Unable to open email client");
    }
  };

  const handleWhatsAppPress = async () => {
    const url = `whatsapp://send?phone=256742072661&text=Hello REMI Support, I would like to request data deletion.`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      alert("Unable to open WhatsApp");
    }
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
          <Text style={styles.headerTitle}>Data Deletion</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>REMI – Account & Data Deletion</Text>
          
          <Text style={styles.paragraph}>
            This page explains how users of the REMI mobile application can request deletion of specific data or deletion of their entire account and all associated data.
          </Text>

          <Text style={styles.sectionTitle}>Deletion Options</Text>

          <Text style={styles.subsectionTitle}>1. Delete Specific Data (Partial Deletion)</Text>
          <Text style={styles.paragraph}>
            Users may request deletion of specific academic or app-related data while keeping their REMI account active.
          </Text>
          
          <Text style={styles.paragraph}>
            Where possible, users can manage and delete certain data directly within the app, such as:
          </Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Timetable entries</Text>
            <Text style={styles.bulletItem}>• Exam schedules</Text>
            <Text style={styles.bulletItem}>• GPA records</Text>
            <Text style={styles.bulletItem}>• Chat history and reminders</Text>
          </View>
          
          <Text style={styles.paragraph}>
            If a specific data item cannot be deleted directly in the app, users may contact REMI support to request manual deletion of the selected data. After verification, only the requested data will be deleted and the user may continue using their account.
          </Text>

          <Text style={styles.subsectionTitle}>2. Delete Account & All Data (Full Deletion)</Text>
          <Text style={styles.paragraph}>
            Users may also request permanent deletion of their REMI account and all associated data. This action removes all stored information and access to the account.
          </Text>
          
          <Text style={styles.paragraph}>
            After full account deletion, users must create a new account to use REMI again.
          </Text>

          <Text style={styles.sectionTitle}>How to Request Deletion</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Open the REMI app</Text>
            <Text style={styles.bulletItem}>• Go to Settings</Text>
            <Text style={styles.bulletItem}>• Under Data Management</Text>
            <Text style={styles.bulletItem}>• Tap Delete Account & Data</Text>
            <Text style={styles.bulletItem}>• Choose Contact Support</Text>
          </View>
          
          <Text style={styles.paragraph}>
            You will be directed to the REMI support contact page, where you can reach us via email, phone, or WhatsApp to submit either a partial or full deletion request.
          </Text>

          <Text style={styles.sectionTitle}>Verification</Text>
          <Text style={styles.paragraph}>
            To protect user privacy and security, we verify account ownership before processing any deletion request.
          </Text>

          <Text style={styles.sectionTitle}>Data That May Be Deleted</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• User account and authentication information (full deletion only)</Text>
            <Text style={styles.bulletItem}>• Academic data including timetables, exams, and GPA records</Text>
            <Text style={styles.bulletItem}>• Chat history and AI interaction data</Text>
          </View>

          <Text style={styles.sectionTitle}>After Deletion</Text>
          <Text style={styles.paragraph}>
            For partial deletion requests, only the selected data will be removed and the account will remain active.
          </Text>
          
          <Text style={styles.paragraph}>
            For full account deletion requests, all associated data is permanently removed from our systems. This action cannot be undone.
          </Text>

          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.paragraph}>
            Please contact us using one of the methods below. Include your username for faster service.
          </Text>

          <View style={styles.contactSection}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={handleEmailPress}
            >
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>{email}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={handleWhatsAppPress}
            >
              <Text style={styles.contactLabel}>WhatsApp:</Text>
              <Text style={styles.contactValue}>{whatsappNumber}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Privacy Policy</Text>
          </TouchableOpacity>

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
    fontSize: 22,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 16,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 6,
  },
  contactSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  contactItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: "#535FFD",
  },
  backButton: {
    backgroundColor: "#535FFD",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20,
  },
});
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Clipboard,
  Platform,
} from "react-native";
import SvgIcon from "../../components/SvgIcon";
import NavigationBar from "../../components/NavigationBar";
import { useTheme } from '../../contexts/ThemeContext';

export default function ContactUsScreen({ navigation }) {
  const { theme } = useTheme();
  
  const email = "denisssendagire22@gmail.com";
  const phoneNumber = "0742072661";
  const whatsappNumber = "256742072661"; // Added country code for Uganda (256)
  
  const handleEmailPress = async () => {
    const url = `mailto:${email}?subject=REMI App Support&body=Hello REMI Support Team,%0D%0A%0D%0A`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open email client");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open email client");
    }
  };
  
  const handlePhoneCall = async () => {
    const url = `tel:${phoneNumber}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to make a call");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to make a call");
    }
  };
  
  const handleWhatsAppPress = async () => {
    // Clean the phone number - remove any spaces, dashes, plus signs
    const cleanNumber = whatsappNumber.replace(/[\s\+\-]/g, '');
    
    // Try multiple WhatsApp URL formats
    const whatsappUrls = [
      `whatsapp://send?phone=${cleanNumber}&text=Hello REMI Support Team, I need assistance with:`,
      `https://wa.me/${cleanNumber}?text=Hello REMI Support Team, I need assistance with:`,
      `https://api.whatsapp.com/send?phone=${cleanNumber}&text=Hello REMI Support Team, I need assistance with:`,
    ];
    
    try {
      // Try the first URL (native app)
      let canOpen = await Linking.canOpenURL(whatsappUrls[0]);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrls[0]);
        return;
      }
      
      // If native app doesn't work, try web URLs
      for (let i = 1; i < whatsappUrls.length; i++) {
        try {
          canOpen = await Linking.canOpenURL(whatsappUrls[i]);
          if (canOpen) {
            await Linking.openURL(whatsappUrls[i]);
            return;
          }
        } catch (error) {
          continue;
        }
      }
      
      // If none work, show appropriate message
      Alert.alert(
        "Cannot Open WhatsApp",
        "Please make sure WhatsApp is installed, or try contacting us via email or phone.",
        [{ text: "OK", style: "default" }]
      );
      
    } catch (error) {

      Alert.alert(
        "Error",
        "Unable to open WhatsApp. You can copy the number and open WhatsApp manually.",
        [
          { text: "OK", style: "default" },
          { 
            text: "Copy Number", 
            onPress: () => handleCopyToClipboard(whatsappNumber, "WhatsApp number")
          }
        ]
      );
    }
  };
  
  const handleCopyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

  const styles = getStyles(theme);

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
          <Text style={styles.headerTitle}>CONTACT US</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Simple Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Get in Touch</Text>
            <Text style={styles.heroSubtitle}>
              Contact us for support, feedback, or questions
            </Text>
          </View>

          {/* Contact Methods - Simplified */}
          <View style={styles.contactMethods}>
            
            {/* Email */}
            <View style={[styles.contactCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.contactHeader}>
                <SvgIcon name="mail" size={24} color={theme.colors.primary} />
                <Text style={styles.contactTitle}>Email</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.contactDetail}
                onPress={() => handleCopyToClipboard(email, "Email")}
                onLongPress={() => handleCopyToClipboard(email, "Email")}
              >
                <Text style={styles.contactText}>{email}</Text>
                <SvgIcon name="copy" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleEmailPress}
              >
                <SvgIcon name="send" size={18} color="white" />
                <Text style={styles.actionButtonText}>Send Email</Text>
              </TouchableOpacity>
            </View>

            {/* Phone */}
            <View style={[styles.contactCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.contactHeader}>
                <SvgIcon name="phone" size={24} color={theme.colors.success} />
                <Text style={styles.contactTitle}>Phone</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.contactDetail}
                onPress={() => handleCopyToClipboard(phoneNumber, "Phone number")}
                onLongPress={() => handleCopyToClipboard(phoneNumber, "Phone number")}
              >
                <Text style={styles.contactText}>{phoneNumber}</Text>
                <SvgIcon name="copy" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                onPress={handlePhoneCall}
              >
                <SvgIcon name="phone" size={18} color="white" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* WhatsApp */}
            <View style={[styles.contactCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.contactHeader}>
                <SvgIcon name="whatsapp" size={24} color="#25D366" />
                <Text style={styles.contactTitle}>WhatsApp</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.contactDetail}
                onPress={() => handleCopyToClipboard(whatsappNumber, "WhatsApp number")}
                onLongPress={() => handleCopyToClipboard(whatsappNumber, "WhatsApp number")}
              >
                <Text style={styles.contactText}>{whatsappNumber}</Text>
                <SvgIcon name="copy" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                onPress={handleWhatsAppPress}
              >
                <SvgIcon name="whatsapp" size={18} color="white" />
                <Text style={styles.actionButtonText}>Message on WhatsApp</Text>
              </TouchableOpacity>
              
            </View>
          </View>


          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
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
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backText: { 
    fontSize: 24, 
    color: theme.colors.primary, 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactMethods: {
    gap: 16,
    marginBottom: 32,
  },
  contactCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tipsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 80,
  },
});
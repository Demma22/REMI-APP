import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Clipboard,
  Platform,
} from "react-native";
import SvgIcon from "../../../components/SvgIcon";
import NavigationBar from "../../../components/NavigationBar";
import { useTheme } from '../../../contexts/ThemeContext';
import { getStyles } from './ContactUsScreen.styles';

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

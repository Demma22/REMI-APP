// screens/settings/SettingsHome/SettingsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../supabase";
import { getUserData, signOutUser } from "../../../services/userDataService";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from "../../../contexts/ThemeContext";
import { getStyles } from "./SettingsScreen.styles";

const ADMIN_EMAILS = ["denis@gmail.com", "your-email@gmail.com"];

export default function SettingsScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme);

  useEffect(() => {
    loadUserData();
    checkAdminStatus();
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
      checkAdminStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAdmin(!!(session?.user && ADMIN_EMAILS.includes(session.user.email)));
  };

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      if (data) setUserData(data);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: performLogout },
    ]);
  };

  const performLogout = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      navigation.reset({ index: 0, routes: [{ name: "SplashIntro" }] });
    } catch {
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account & Data",
      "To delete your account and all associated data, please contact our support team.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contact Support", onPress: () => navigation.navigate("ContactUs") },
      ]
    );
  };

  const avatarUri = userData?.avatar_url || null;

  const settingsHeader = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <SvgIcon name="arrow-back" size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Settings</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.8}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }]}>
            <SvgIcon name="user" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {settingsHeader}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {settingsHeader}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Admin Section */}
        {isAdmin && (
          <>
            <Text style={styles.sectionLabel}>ADMIN</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("StatisticsDashboard")} activeOpacity={0.7}>
                <SvgIcon name="chart-line" size={20} color={theme.colors.textPrimary} />
                <Text style={styles.rowLabel}>Statistics Dashboard</Text>
                <Text style={styles.chevron}>{"›"}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* General Section */}
        <Text style={styles.sectionLabel}>GENERAL</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <SvgIcon name="bell" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={notificationsOn}
              onValueChange={(val) => {
                setNotificationsOn(val);
                navigation.navigate("NotificationsSettings");
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.colors.border}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <SvgIcon name={isDarkMode ? "sun" : "moon"} size={20} color={theme.colors.textPrimary} />
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.colors.border}
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleLogout} activeOpacity={0.7} disabled={signingOut}>
            <SvgIcon name="complete" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.rowLabel}>Logout</Text>
            {signingOut
              ? <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              : <Text style={styles.chevron}>{"›"}</Text>
            }
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <SvgIcon name="trash" size={20} color={theme.colors.danger} />
            <Text style={[styles.rowLabel, { color: theme.colors.danger }]}>Delete Account</Text>
            <Text style={[styles.chevron, { color: theme.colors.danger }]}>{"›"}</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Us Section */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("ContactUs")} activeOpacity={0.7}>
            <SvgIcon name="send" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.rowLabel}>Send Feedback</Text>
            <Text style={styles.chevron}>{"›"}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("AboutUs")} activeOpacity={0.7}>
            <SvgIcon name="info" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.rowLabel}>Our Socials</Text>
            <Text style={styles.chevron}>{"›"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

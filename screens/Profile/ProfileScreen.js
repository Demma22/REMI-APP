// screens/Profile/ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../supabase";
import { getUserData, signOutUser } from "../../services/userDataService";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from '../../contexts/ThemeContext';
import { getStyles } from "./ProfileScreen.styles";
import { ProfileSkeleton } from "../../components/SkeletonLoader";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState(null);
  
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    loadUserProfile();
    const focus = navigation.addListener("focus", loadUserProfile);
    return focus;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigation.navigate("Login");
        return;
      }
      setSupabaseUser(session.user);
      const data = await getUserData();
      if (data) setUserData(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: performLogout
        }
      ]
    );
  };

  const performLogout = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      navigation.reset({ index: 0, routes: [{ name: 'SplashIntro' }] });
    } catch (error) {
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
      setSigningOut(false);
    }
  };

  const handleEditPhoto = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => pickImage("camera") },
      { text: "Choose from Library", onPress: () => pickImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickImage = async (source) => {
    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Gallery permission is required.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    }
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalAvatarUri(uri);
      await uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri) => {
    setUploadingPhoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const fileExt = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
      const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";
      const fileName = `${session.user.id}.${fileExt}`;

      const formData = new FormData();
      formData.append("file", { uri, name: fileName, type: mimeType });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, formData, { upsert: true, contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", session.user.id);
      if (dbError) throw dbError;

      setUserData(prev => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert("Success", "Profile photo updated!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
      setLocalAvatarUri(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getCourseName = () => {
    if (!userData?.course) return "Not set";
    return userData.course
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getOnboardingAnswers = () => {
    return {
      heardFrom: userData?.heardFrom || "Not answered",
      purpose: userData?.purpose || [],
      studyStage: userData?.studyStage || "Not answered",
      ageRange: userData?.ageRange || "Not answered",
    };
  };

  const getPurposeDisplay = () => {
    const purposes = userData?.purpose || [];
    if (purposes.length === 0) return "Not answered";
    return purposes.map(p => p.replace('_', ' ').toUpperCase()).join(", ");
  };

  const getHeardFromDisplay = () => {
    const heardMap = {
      'family_friend': 'Friends & Family',
      'social_media': 'Social Media',
      'snd_studio': 'SND Studio Website',
      'app_store': 'App Store',
      'other': 'Other'
    };
    return heardMap[userData?.heardFrom] || userData?.heardFrom || "Not answered";
  };

  const getStudyStageDisplay = () => {
    const stageMap = {
      'high_school': 'High School',
      'undergraduate': 'Undergraduate',
      'graduate': 'Graduate',
      'professional': 'Professional',
      'not_studying': 'Not studying'
    };
    return stageMap[userData?.studyStage] || userData?.studyStage || "Not answered";
  };

  const getAgeRangeDisplay = () => {
    const ageMap = {
      'under_18': 'Under 18',
      '18_24': '18-24',
      '25_34': '25-34',
      '35_44': '35-44',
      '45_plus': '45+'
    };
    return ageMap[userData?.ageRange] || userData?.ageRange || "Not answered";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="PROFILE" onBackPress={() => navigation.goBack()} />
        <ProfileSkeleton />
        <NavigationBar />
      </View>
    );
  }

  const onboarding = getOnboardingAnswers();

  return (
    <View style={styles.container}>
      <ScreenHeader title="PROFILE" onBackPress={() => navigation.goBack()} />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={handleEditPhoto} disabled={uploadingPhoto}>
                {(localAvatarUri || userData?.avatar_url) ? (
                  <Image
                    source={{ uri: localAvatarUri || userData.avatar_url }}
                    style={styles.profileImage}
                    onError={() => {
                      if (!localAvatarUri) setUserData(prev => ({ ...prev, avatar_url: null }));
                    }}
                  />
                ) : (
                  <View style={[styles.profileImage, { backgroundColor: theme.colors.primary }]}>
                    <SvgIcon name="user" size={32} color="white" />
                  </View>
                )}
                <View style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: theme.colors.card,
                }}>
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <SvgIcon name="edit" size={11} color="#fff" />
                  }
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.nickname || userData?.username || "User"}
              </Text>
              <Text style={styles.profileEmail}>@{userData?.username || ""}</Text>
              {userData?.course && (
                <Text style={[styles.profileCourse, { color: theme.colors.primary }]}>
                  {getCourseName()}
                </Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditNickname")}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <SvgIcon name="edit" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit Nickname</Text>
                <Text style={styles.actionSubtitle}>Change how you appear in the app</Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
                <SvgIcon name="cog" size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Settings</Text>
                <Text style={styles.actionSubtitle}>Manage your preferences</Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>User ID</Text>
                <Text style={styles.accountValue}>
                  {supabaseUser?.id?.substring(0, 8)}...
                </Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Account Created</Text>
                <Text style={styles.accountValue}>
                  {supabaseUser?.created_at
                    ? new Date(supabaseUser.created_at).toLocaleDateString()
                    : "Unknown"
                  }
                </Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Last Sign In</Text>
                <Text style={styles.accountValue}>
                  {supabaseUser?.last_sign_in_at
                    ? new Date(supabaseUser.last_sign_in_at).toLocaleDateString()
                    : "Unknown"
                  }
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.colors.danger }]}
            onPress={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../supabase";
import { getUserData, signOutUser } from "../../services/userDataService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavigationBar from "../../components/NavigationBar";
import SvgIcon from "../../components/SvgIcon";
import { useTheme } from "../../contexts/ThemeContext";
import { getStyles } from "./ProfileScreen.styles";
import { ProfileSkeleton } from "../../components/SkeletonLoader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


const DEFAULT_QUOTE = "We suffer more often in imagination than in reality.";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState(null);

  const [viewPhotoVisible, setViewPhotoVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);

  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();

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

  const handleEditPhoto = () => {
    const hasPhoto = !!(localAvatarUri || userData?.avatar_url);
    const options = [];
    if (hasPhoto) {
      options.push({ text: "View", onPress: () => setViewPhotoVisible(true) });
    }
    options.push(
      { text: "Take Photo", onPress: () => pickImage("camera") },
      { text: "Choose from Library", onPress: () => pickImage("library") },
      { text: "Cancel", style: "cancel" }
    );
    Alert.alert("Profile Photo", "Choose an option", options);
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

      setUserData((prev) => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert("Success", "Profile photo updated!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
      setLocalAvatarUri(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openQuoteEditor = () => {
    setQuoteInput(userData?.favorite_quote || "");
    setQuoteModalVisible(true);
  };

  const saveQuote = async () => {
    setSavingQuote(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ favorite_quote: quoteInput.trim() || null })
        .eq("id", session.user.id);
      if (error) throw error;
      setUserData((prev) => ({ ...prev, favorite_quote: quoteInput.trim() || null }));
      setQuoteModalVisible(false);
    } catch (error) {
      console.error("Save quote error:", error);
      Alert.alert("Error", "Failed to save quote. Please try again.");
    } finally {
      setSavingQuote(false);
    }
  };

  const currentAvatarUri = localAvatarUri || userData?.avatar_url || null;
  const displayQuote = userData?.favorite_quote || DEFAULT_QUOTE;
  const displayName = userData?.nickname || userData?.username || "User";
  const displayEmail = supabaseUser?.email || "";

  const profileHeader = (
    <View style={[styles.profileHeader, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.profileBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <SvgIcon name="arrow-back" size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={() => navigation.navigate("Settings")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ width: 44, alignItems: "flex-end" }}
      >
        <SvgIcon name="cog" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {profileHeader}
        <ProfileSkeleton />
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {profileHeader}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <TouchableOpacity
            onPress={handleEditPhoto}
            disabled={uploadingPhoto}
            style={styles.avatarWrapper}
            activeOpacity={0.85}
          >
            {currentAvatarUri ? (
              <Image source={{ uri: currentAvatarUri }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }]}>
                <SvgIcon name="user" size={32} color="#FFFFFF" />
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View style={styles.onlineDot} />
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{displayName}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("EditNickname")} style={styles.editNameBtn}>
                <SvgIcon name="edit" size={15} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
        </View>

        {/* Favorite Quote */}
        <View style={styles.quoteSection}>
          <SvgIcon name="quote" size={130} color="#535FFD" style={styles.quoteDecorIcon} />

          <View style={styles.quoteHeader}>
            <Text style={styles.quoteHeaderText}>Favorite Quote</Text>
          </View>

          <View style={{ height: 8 }} />

          <TouchableOpacity style={styles.quoteBody} onPress={openQuoteEditor} activeOpacity={0.8}>
            <Text style={styles.quoteText} numberOfLines={3}>{displayQuote}</Text>
            <SvgIcon name="edit" size={16} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        {/* Account Information */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>User ID</Text>
              <Text style={styles.accountValue}>{supabaseUser?.id?.substring(0, 8)}...</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Account Created</Text>
              <Text style={styles.accountValue}>
                {supabaseUser?.created_at
                  ? new Date(supabaseUser.created_at).toLocaleDateString()
                  : "Unknown"}
              </Text>
            </View>
            <View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.accountLabel}>Last Sign In</Text>
              <Text style={styles.accountValue}>
                {supabaseUser?.last_sign_in_at
                  ? new Date(supabaseUser.last_sign_in_at).toLocaleDateString()
                  : "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={theme.colors.danger} />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <NavigationBar />

      {/* View Full Photo Modal */}
      <Modal visible={viewPhotoVisible} transparent animationType="fade" onRequestClose={() => setViewPhotoVisible(false)}>
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setViewPhotoVisible(false)}>
            <SvgIcon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {currentAvatarUri ? (
            <Image
              source={{ uri: currentAvatarUri }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.photoModalImage, { backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }]}>
              <SvgIcon name="user" size={80} color="#FFFFFF" />
            </View>
          )}
        </View>
      </Modal>

      {/* Edit Quote Modal */}
      <Modal visible={quoteModalVisible} transparent animationType="slide" onRequestClose={() => setQuoteModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.quoteModalOverlay}>
            <View style={styles.quoteModalSheet}>
              <Text style={styles.quoteModalTitle}>Edit Favorite Quote</Text>
              <TextInput
                style={styles.quoteInput}
                value={quoteInput}
                onChangeText={setQuoteInput}
                placeholder="Enter your favorite quote..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                maxLength={200}
                autoFocus
              />
              <Text style={styles.quoteCharCount}>{quoteInput.length}/200</Text>
              <View style={styles.quoteModalActions}>
                <TouchableOpacity
                  style={[styles.quoteModalBtn, styles.quoteModalCancelBtn]}
                  onPress={() => setQuoteModalVisible(false)}
                >
                  <Text style={[styles.quoteModalBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quoteModalBtn, styles.quoteModalSaveBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={saveQuote}
                  disabled={savingQuote}
                >
                  {savingQuote
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={[styles.quoteModalBtnText, { color: "#fff" }]}>Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

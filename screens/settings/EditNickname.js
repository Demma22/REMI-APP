import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from "react-native";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTheme } from '../../contexts/ThemeContext';

export default function EditNickname({ navigation, route }) {
  const [nick, setNick] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentNickname, setCurrentNickname] = useState("");

  const { theme } = useTheme();

  useEffect(() => {
    const loadCurrentNickname = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentNick = userData.nickname || "";
          setCurrentNickname(currentNick);
          setNick(currentNick);
          
          if (currentNick) {
            validateNickname(currentNick);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    loadCurrentNickname();
  }, []);

  const validateNickname = (text) => {
    setNick(text);
    setIsTouched(true);

    const t = text.trim();
    const valid =
      t.length >= 2 &&
      t.length <= 20 &&
      /^[a-zA-Z0-9\s\-_]+$/.test(t) &&
      !/\s{2,}/.test(t);

    setIsValid(valid);
  };

  const saveNickname = async () => {
    if (!isValid) {
      Alert.alert("Invalid Nickname", "Please enter a valid nickname.");
      return;
    }

    const trimmedNick = nick.trim();

    if (trimmedNick === currentNickname) {
      Alert.alert("No Changes", "Your nickname is already set to this.");
      return;
    }

    setLoading(true);

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          nickname: trimmedNick,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      Alert.alert(
        "Success", 
        "Your nickname has been updated!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      Alert.alert("Error", "Could not update nickname. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getValidationMessage = () => {
    if (!isTouched || nick.trim().length === 0) return "Enter your preferred nickname";
    const t = nick.trim();

    if (t.length < 2) return "Nickname must be at least 2 characters";
    if (t.length > 20) return "Nickname must be 20 characters or less";
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(t))
      return "Only letters, numbers, spaces, hyphens, and underscores allowed";
    if (/\s{2,}/.test(t)) return "No consecutive spaces allowed";

    return "Looks good!";
  };

  const getValidationColor = () => {
    if (!isTouched || nick.trim().length === 0) return theme.colors.textTertiary;
    return isValid ? theme.colors.success : theme.colors.error;
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={handleCancel}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT NICKNAME</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Change Your Nickname</Text>
              
              {currentNickname && (
                <View style={styles.currentNicknameContainer}>
                  <Text style={styles.currentNicknameLabel}>Current:</Text>
                  <Text style={styles.currentNickname}>{currentNickname}</Text>
                </View>
              )}
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Nickname</Text>

                <TextInput
                  style={[
                    styles.input,
                    isTouched && {
                      borderColor: getValidationColor(),
                    },
                  ]}
                  placeholder="Enter your new nickname..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={nick}
                  onChangeText={validateNickname}
                  onSubmitEditing={saveNickname}
                  autoCapitalize="words"
                  maxLength={20}
                  autoCorrect={false}
                  returnKeyType="done"
                  autoFocus={true}
                />

                <View style={styles.counterContainer}>
                  <Text style={styles.counterText}>{nick.length}/20</Text>
                </View>
              </View>

              <Text style={[styles.validationText, { color: getValidationColor() }]}>
                {getValidationMessage()}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isValid && nick.trim() !== currentNickname ? styles.saveButtonActive : styles.saveButtonDisabled,
                ]}
                disabled={!isValid || nick.trim() === currentNickname || loading}
                onPress={saveNickname}
              >
                {loading ? (
                  <Text style={styles.saveButtonText}>Updating...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>Update Nickname</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  currentNicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.mode === 'dark' ? 'rgba(83, 95, 253, 0.15)' : 'rgba(83, 95, 253, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentNicknameLabel: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 8,
  },
  currentNickname: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  counterContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  counterText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonSection: {
    marginTop: 20,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
});
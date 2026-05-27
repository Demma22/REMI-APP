// screens/settings/EditNickname.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { getUserData, updateUserData } from "../../../services/userDataService";
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from "../../../components/SvgIcon";
import { getStyles } from "./EditNickname.styles";
import ScreenHeader from "../../../components/ScreenHeader";

export default function EditNickname({ navigation, route }) {
  const [nick, setNick] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentNickname, setCurrentNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const loadCurrentNickname = async () => {
      try {
        const data = await getUserData();
        const currentNick = data?.nickname || "";
        setCurrentNickname(currentNick);
        setNick(currentNick);
        if (currentNick) validateNickname(currentNick);
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

    setIsSaving(true);

    try {
      await updateUserData({ nickname: trimmedNick });

      Alert.alert(
        "Success!",
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
      setIsSaving(false);
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

    return "Looks good! ✓";
  };

  const getValidationColor = () => {
    if (!isTouched || nick.trim().length === 0) return theme.colors.textTertiary;
    return isValid ? "#10B981" : "#EF4444";
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="EDIT NICKNAME" onBackPress={handleCancel} />

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
            {/* Purple Edit Card */}
            <View style={styles.editCard}>
              <View style={styles.cardHeader}>
                <SvgIcon name="user" size={24} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Change Nickname</Text>
              </View>

              {/* Current Nickname Display */}
              {currentNickname && (
                <View style={styles.currentNicknameContainer}>
                  <Text style={styles.currentNicknameLabel}>Current:</Text>
                  <Text style={styles.currentNickname}>{currentNickname}</Text>
                </View>
              )}

              {/* Input Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Nickname</Text>
                <TextInput
                  style={[
                    styles.input,
                    isTouched && isValid && styles.inputValid,
                    isTouched && !isValid && styles.inputInvalid,
                  ]}
                  placeholder="Enter your new nickname..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
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

              {/* Validation Message */}
              <Text style={[styles.validationText, { color: getValidationColor() }]}>
                {getValidationMessage()}
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isValid && nick.trim() !== currentNickname && !isSaving
                      ? styles.saveButtonActive 
                      : styles.saveButtonDisabled,
                  ]}
                  disabled={!isValid || nick.trim() === currentNickname || isSaving}
                  onPress={saveNickname}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#535FFD" />
                  ) : (
                    <Text style={styles.saveButtonText}>Update Nickname</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
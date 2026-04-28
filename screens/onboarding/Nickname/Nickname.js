import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from "react-native";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useTheme } from '../../../contexts/ThemeContext';
import { getStyles } from './Nickname.styles';

const { height } = Dimensions.get("window");

export default function Nickname({ navigation }) {
  const [nick, setNick] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  const { theme } = useTheme();

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

  const handleCancel = () => {
    Alert.alert(
      "Cancel Setup",
      "Are you sure you want to cancel? You'll need to sign up again.",
      [
        {
          text: "No, Continue",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => navigation.navigate("Signup")
        }
      ]
    );
  };

  // Save nickname to Firestore and navigate to Course screen
  const saveNicknameAndProceed = async () => {
    if (!isValid) {
      Alert.alert("Invalid Nickname", "Please enter a valid nickname.");
      return;
    }

    const trimmedNick = nick.trim();

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          nickname: trimmedNick,
          createdAt: new Date(),
        },
        { merge: true }
      );

      navigation.navigate("Course", { nick: trimmedNick }); // Use navigate instead of replace

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not save nickname.");
    }
  };

  const getValidationMessage = () => {
    if (!isTouched || nick.trim().length === 0) return null;
    const t = nick.trim();

    if (t.length < 2) return "Nickname must be at least 2 characters";
    if (t.length > 20) return "Nickname must be 20 characters or less";
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(t))
      return "Only letters, numbers, spaces, hyphens, and underscores allowed";
    if (/\s{2,}/.test(t)) return "No consecutive spaces allowed";

    return "Looks good!";
  };

  const getValidationColor = () => {
    if (!isTouched || nick.trim().length === 0) return theme.colors.textSecondary;
    return isValid ? "#10B981" : "#EF4444";
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>

      {/* Header with Cancel Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NICKNAME</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Header Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>What should I call you?</Text>
            <Text style={styles.subtitle}>
              Choose a nickname that I can use to personalize your experience
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Nickname</Text>

              <TextInput
                style={[
                  styles.input,
                  isTouched && {
                    borderColor: getValidationColor(),
                    backgroundColor: isValid ? "#F0F9FF" : "#FFFFFF",
                  },
                ]}
                placeholder="Enter your preferred nickname..."
                placeholderTextColor="#94A3B8"
                value={nick}
                onChangeText={validateNickname}
                onSubmitEditing={saveNicknameAndProceed}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={20}
                returnKeyType="done"
              />

              <View style={styles.counterContainer}>
                <Text style={styles.counterText}>{nick.length}/20</Text>
              </View>
            </View>

            {isTouched && nick.trim().length > 0 && (
              <View style={styles.validationContainer}>
                <Text style={[styles.validationText, { color: getValidationColor() }]}>
                  {getValidationMessage()}
                </Text>
              </View>
            )}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Button Section */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isValid ? styles.nextButtonActive : styles.nextButtonDisabled,
          ]}
          disabled={!isValid}
          onPress={saveNicknameAndProceed}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

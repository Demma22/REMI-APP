import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ScrollView
} from "react-native";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function EditNickname({ navigation, route }) {
  const [nick, setNick] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentNickname, setCurrentNickname] = useState("");

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  // Check if we're in edit mode and load current nickname
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
          
          // Validate the current nickname
          if (currentNick) {
            validateNickname(currentNick);
          }
        }
      } catch (error) {
        console.log("Error loading current nickname:", error);
      }
    };

    loadCurrentNickname();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
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

    // Check if nickname actually changed
    if (trimmedNick === currentNickname) {
      Alert.alert("No Changes", "Your nickname is already set to this.");
      return;
    }

    setLoading(true);

    try {
      // Update nickname in Firestore
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
      console.log("Error updating nickname:", error);
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
    if (!isTouched || nick.trim().length === 0) return "#64748B";
    return isValid ? "#10B981" : "#EF4444";
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
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
                    backgroundColor: isValid ? "#F0F9FF" : "#FFFFFF",
                  },
                ]}
                placeholder="Enter your new nickname..."
                placeholderTextColor="#94A3B8"
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

          {/* Action Buttons - Fixed at bottom */}
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
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
  },
  circle1: {
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(83, 95, 253, 0.08)',
  },
  circle2: {
    bottom: -150,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(247, 133, 34, 0.06)',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  currentNicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentNicknameLabel: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "600",
    marginRight: 8,
  },
  currentNickname: {
    fontSize: 14,
    color: "#535FFD",
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
    color: "#383940",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    padding: 18,
    borderRadius: 16,
    fontSize: 18,
    color: "#383940",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  counterContainer: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
  counterText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: '500',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonSection: {
    marginTop: 'auto', // This pushes buttons to bottom
    marginBottom: 20,
  },
  saveButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonActive: {
    backgroundColor: "#535FFD",
    shadowColor: "#535FFD",
    shadowOpacity: 0.3,
  },
  saveButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
});
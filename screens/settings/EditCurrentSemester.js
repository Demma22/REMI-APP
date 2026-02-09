import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert
} from "react-native";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTheme } from '../../contexts/ThemeContext'; // Add this import

export default function EditCurrentSemester({ navigation, route }) {
  const [current, setCurrent] = useState(null);
  const [totalSemesters, setTotalSemesters] = useState(0);
  const [currentSemester, setCurrentSemester] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);
  
  const { theme } = useTheme(); // Get theme from context

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const total = userData.total_semesters || 0;
          const currentSem = userData.current_semester || 0;
          
          setTotalSemesters(total);
          setCurrentSemester(currentSem);
          setCurrent(currentSem); // Set current selection to existing semester
        }
      } catch (error) {
        Alert.alert("Error", "Could not load your data");
      }
    };

    loadUserData();

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

  const saveCurrentSemester = async () => {
    if (!current) {
      Alert.alert("Select Semester", "Please select a semester.");
      return;
    }

    // Check if semester actually changed
    if (current === currentSemester) {
      Alert.alert("No Changes", "You're already in this semester.");
      return;
    }

    setLoading(true);

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          current_semester: current,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      Alert.alert(
        "Success", 
        `Your current semester has been updated to Semester ${current}!`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert("Error", "Failed to save your selection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const getSemesterDescription = (semesterNum) => {
    if (semesterNum === 1) return "First semester";
    if (semesterNum === totalSemesters) return "Final semester";
    if (semesterNum > 1 && semesterNum < totalSemesters) return "Continuing";
    return "";
  };

  const getSemesterStatus = (semesterNum) => {
    if (semesterNum === currentSemester) return "Current";
    if (semesterNum < currentSemester) return "Completed";
    if (semesterNum > currentSemester) return "Upcoming";
    return "";
  };

  const isSemesterSelectable = (semesterNum) => {
    // Users can only select semesters from their current semester onward
    return semesterNum >= currentSemester && semesterNum <= totalSemesters;
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1, { backgroundColor: theme.mode === 'dark' ? 'rgba(83, 95, 253, 0.05)' : 'rgba(83, 95, 253, 0.08)' }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: theme.mode === 'dark' ? 'rgba(247, 133, 34, 0.04)' : 'rgba(247, 133, 34, 0.06)' }]} />
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
          <Text style={styles.headerTitle}>CHANGE SEMESTER</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Update Your Current Semester</Text>
          <Text style={styles.subtitle}>
            Select your current semester. You can only progress forward.
          </Text>
          
          {currentSemester > 0 && (
            <View style={styles.currentInfo}>
              <Text style={styles.currentLabel}>Currently in:</Text>
              <Text style={styles.currentSemester}>Semester {currentSemester}</Text>
            </View>
          )}
        </View>

        {/* Semester Selection */}
        <View style={styles.selectionSection}>
          <ScrollView 
            style={styles.semestersScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.semestersContainer}
          >
            {totalSemesters > 0 ? (
              [...Array(totalSemesters)].map((_, i) => {
                const semesterNum = i + 1;
                const isSelected = current === semesterNum;
                const isSelectable = isSemesterSelectable(semesterNum);
                const isCurrent = semesterNum === currentSemester;
                
                return (
                  <TouchableOpacity
                    key={semesterNum}
                    style={[
                      styles.semesterCard,
                      isSelected && styles.semesterCardSelected,
                      !isSelectable && styles.semesterCardDisabled,
                      isCurrent && styles.semesterCardCurrent
                    ]}
                    onPress={() => isSelectable && setCurrent(semesterNum)}
                    disabled={!isSelectable}
                  >
                    <View style={styles.semesterContent}>
                      <View style={[
                        styles.semesterNumber,
                        isSelected && styles.semesterNumberSelected,
                        !isSelectable && styles.semesterNumberDisabled,
                        isCurrent && styles.semesterNumberCurrent
                      ]}>
                        <Text style={[
                          styles.semesterNumberText,
                          isSelected && styles.semesterNumberTextSelected,
                          !isSelectable && styles.semesterNumberTextDisabled
                        ]}>
                          {semesterNum}
                        </Text>
                      </View>
                      <View style={styles.semesterInfo}>
                        <View style={styles.semesterHeader}>
                          <Text style={[
                            styles.semesterTitle,
                            isSelected && styles.semesterTitleSelected,
                            !isSelectable && styles.semesterTitleDisabled
                          ]}>
                            Semester {semesterNum}
                          </Text>
                          <Text style={[
                            styles.semesterStatus,
                            isCurrent && styles.semesterStatusCurrent,
                            !isSelectable && styles.semesterStatusDisabled
                          ]}>
                            {getSemesterStatus(semesterNum)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                    
                    {isCurrent && !isSelected && (
                      <View style={styles.currentIndicator}>
                        <Text style={styles.currentIndicatorText}>NOW</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No semester data found. Please complete your profile first.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              current && current !== currentSemester ? styles.saveButtonActive : styles.saveButtonDisabled
            ]}
            onPress={saveCurrentSemester}
            disabled={!current || current === currentSemester || loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Updating..." : `Set to Semester ${current}`}
            </Text>
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
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  },
  circle2: {
    bottom: -150,
    left: -100,
    width: 300,
    height: 300,
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
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.mode === 'dark' ? 'rgba(83, 95, 253, 0.15)' : 'rgba(83, 95, 253, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentLabel: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 8,
  },
  currentSemester: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  selectionSection: {
    flex: 1,
    marginBottom: 40,
  },
  semestersScroll: {
    flex: 1,
  },
  semestersContainer: {
    paddingBottom: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  semesterCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  semesterCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.mode === 'dark' ? 'rgba(83, 95, 253, 0.15)' : '#F0F9FF',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  semesterCardDisabled: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.border,
  },
  semesterCardCurrent: {
    borderColor: theme.colors.secondary,
  },
  semesterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  semesterNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  semesterNumberSelected: {
    backgroundColor: theme.colors.primary,
  },
  semesterNumberDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  semesterNumberCurrent: {
    backgroundColor: theme.colors.secondary,
  },
  semesterNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  semesterNumberTextSelected: {
    color: "#FFFFFF",
  },
  semesterNumberTextDisabled: {
    color: theme.colors.textTertiary,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  semesterTitleSelected: {
    color: theme.colors.primary,
  },
  semesterTitleDisabled: {
    color: theme.colors.textTertiary,
  },
  semesterStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  semesterStatusCurrent: {
    color: theme.colors.secondary,
    backgroundColor: theme.mode === 'dark' ? 'rgba(247, 133, 34, 0.2)' : '#FFF7ED',
  },
  semesterStatusDisabled: {
    color: theme.colors.textTertiary,
    backgroundColor: theme.colors.disabled,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  currentIndicator: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonSection: {
    marginBottom: 40,
  },
  saveButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.disabled,
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
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
});
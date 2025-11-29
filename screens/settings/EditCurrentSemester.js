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

export default function EditCurrentSemester({ navigation, route }) {
  const [current, setCurrent] = useState(null);
  const [totalSemesters, setTotalSemesters] = useState(0);
  const [currentSemester, setCurrentSemester] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

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
        console.log("Error loading user data:", error);
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
      console.error("Firestore Error:", error);
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

  return (
    <View style={styles.container}>
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
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(83, 95, 253, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentLabel: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "600",
    marginRight: 8,
  },
  currentSemester: {
    fontSize: 14,
    color: "#535FFD",
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
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 22,
  },
  semesterCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  semesterCardSelected: {
    borderColor: "#535FFD",
    backgroundColor: "#F0F9FF",
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  semesterCardDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  semesterCardCurrent: {
    borderColor: "#FF8A23",
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
    backgroundColor: "#F1F5F9",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  semesterNumberSelected: {
    backgroundColor: "#535FFD",
  },
  semesterNumberDisabled: {
    backgroundColor: "#E2E8F0",
  },
  semesterNumberCurrent: {
    backgroundColor: "#FF8A23",
  },
  semesterNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
  },
  semesterNumberTextSelected: {
    color: "#FFFFFF",
  },
  semesterNumberTextDisabled: {
    color: "#94A3B8",
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
    color: "#383940",
  },
  semesterTitleSelected: {
    color: "#535FFD",
  },
  semesterTitleDisabled: {
    color: "#94A3B8",
  },
  semesterStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  semesterStatusCurrent: {
    color: "#FF8A23",
    backgroundColor: "#FFF7ED",
  },
  semesterStatusDisabled: {
    color: "#94A3B8",
    backgroundColor: "#F8FAFC",
  },
  semesterSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  currentIndicator: {
    backgroundColor: "#FF8A23",
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
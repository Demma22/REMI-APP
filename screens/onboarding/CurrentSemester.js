import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert
} from "react-native";

// ⭐ Firestore imports - same pattern as previous screens
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function CurrentSemester({ navigation, route }) {
  const { nick, course, semesters } = route.params;
  const [current, setCurrent] = useState(null);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  React.useEffect(() => {
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

  const saveCurrentSemesterAndProceed = async () => {
    if (!current) {
      Alert.alert(
        "Select Semester",
        "Please select your current semester to continue.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // ⭐ Save current semester to Firestore - same pattern as previous screens
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          current_semester: current,
          onboarding_completed: true, // Mark onboarding as complete
          updatedAt: new Date(),
        },
        { merge: true } // Merge with existing data
      );

      console.log("✅ Current semester saved to Firestore");

      // ⭐ Navigate to Home screen - onboarding complete!
      navigation.replace("Home");
      
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Failed to save your selection. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CURRENT SEMESTER</Text>
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
          <Text style={styles.title}>Which semester are you in?</Text>
          <Text style={styles.subtitle}>
            Select your current semester from the options below
          </Text>
        </View>

        {/* Semester Selection */}
        <View style={styles.selectionSection}>
          <ScrollView 
            style={styles.semestersScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.semestersContainer}
          >
            {[...Array(semesters)].map((_, i) => {
              const semesterNum = i + 1;
              const isSelected = current === semesterNum;
              
              return (
                <TouchableOpacity
                  key={semesterNum}
                  style={[
                    styles.semesterCard,
                    isSelected && styles.semesterCardSelected
                  ]}
                  onPress={() => setCurrent(semesterNum)}
                >
                  <View style={styles.semesterContent}>
                    <View style={[
                      styles.semesterNumber,
                      isSelected && styles.semesterNumberSelected
                    ]}>
                      <Text style={[
                        styles.semesterNumberText,
                        isSelected && styles.semesterNumberTextSelected
                      ]}>
                        {semesterNum}
                      </Text>
                    </View>
                    <View style={styles.semesterInfo}>
                      <Text style={[
                        styles.semesterTitle,
                        isSelected && styles.semesterTitleSelected
                      ]}>
                        Semester {semesterNum}
                      </Text>
                      <Text style={styles.semesterSubtitle}>
                        {semesterNum === 1 && "First semester"}
                        {semesterNum === semesters && "Final semester"}
                        {semesterNum > 1 && semesterNum < semesters && "Continuing"}
                      </Text>
                    </View>
                  </View>
                  
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Action Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              current ? styles.nextButtonActive : styles.nextButtonDisabled
            ]}
            onPress={saveCurrentSemesterAndProceed}
            disabled={!current}
          >
            <Text style={styles.nextButtonText}>
              Complete Setup
            </Text>
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
  semesterNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
  },
  semesterNumberTextSelected: {
    color: "#FFFFFF",
  },
  semesterInfo: {
    flex: 1,
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  semesterTitleSelected: {
    color: "#535FFD",
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
  buttonSection: {
    marginBottom: 40,
  },
  nextButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonActive: {
    backgroundColor: "#535FFD",
    shadowColor: "#535FFD",
    shadowOpacity: 0.3,
  },
  nextButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
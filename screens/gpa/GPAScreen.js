import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions 
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import NavigationBar from "../../components/NavigationBar";

const { width } = Dimensions.get("window");

export default function GPAScreen({ navigation }) {
  if (!auth.currentUser) {
    return <Text style={styles.center}>Not logged in</Text>;
  }

  const [gpas, setGpas] = useState({});
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    loadData(); 
    const focus = navigation.addListener("focus", loadData);
    return focus;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user document from Firestore - same as GPACalculationScreen
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Get GPA data from gpa_data object - same structure as GPACalculationScreen
        const gpaData = data.gpa_data || {};
        
        // Convert to the format expected by the chart: { semester1: "3.5", semester2: "3.8", ... }
        const formattedGpas = {};
        Object.keys(gpaData).forEach(semesterKey => {
          if (gpaData[semesterKey] && gpaData[semesterKey].gpa) {
            formattedGpas[semesterKey] = gpaData[semesterKey].gpa.toString();
          }
        });
        
        setGpas(formattedGpas);
      }
    } catch (error) {
      console.log("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallGPA = () => {
    const validGpas = Object.values(gpas).filter(gpa => gpa && !isNaN(parseFloat(gpa)));
    if (validGpas.length === 0) return null;
    
    const sum = validGpas.reduce((total, gpa) => total + parseFloat(gpa), 0);
    return (sum / validGpas.length).toFixed(2);
  };

  const getChartData = () => {
    if (!userData?.units) return null;

    const labels = [];
    const data = [];

    // Get all available semesters from units data
    const availableSemesters = Object.keys(userData.units).sort((a, b) => parseInt(a) - parseInt(b));
    
    availableSemesters.forEach(semesterNumber => {
      const semesterKey = `semester${semesterNumber}`;
      labels.push(`S${semesterNumber}`);
      data.push(gpas[semesterKey] ? parseFloat(gpas[semesterKey]) : 0);
    });

    return { labels, data };
  };

  const overallGPA = getOverallGPA();
  const chartData = getChartData();
  const hasCalculatedGPA = Object.values(gpas).some(gpa => gpa && !isNaN(parseFloat(gpa)));
  const availableSemesters = userData?.units ? Object.keys(userData.units).sort((a, b) => parseInt(a) - parseInt(b)) : [];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>GPA OVERVIEW</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptySub}>Loading your GPA data...</Text>
          </View>
        </View>
        <NavigationBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GPA OVERVIEW</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overall GPA Card */}
        {overallGPA && (
          <View style={styles.overallCard}>
            <Text style={styles.overallTitle}>OVERALL GPA</Text>
            <Text style={styles.overallGPA}>{overallGPA}</Text>
            <Text style={styles.overallSubtitle}>
              Based on {Object.values(gpas).filter(gpa => gpa && !isNaN(parseFloat(gpa))).length} semesters
            </Text>
          </View>
        )}

        {/* GPA Progress Chart */}
        {chartData && hasCalculatedGPA && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>GPA Progress</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.data }]
              }}
              width={width - 80}
              height={220}
              chartConfig={{
                backgroundColor: "#FFFFFF",
                backgroundGradientFrom: "#FFFFFF",
                backgroundGradientTo: "#FFFFFF",
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(83, 95, 253, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(56, 57, 64, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#535FFD"
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Semesters List */}
        <View style={styles.semestersSection}>
          <Text style={styles.sectionTitle}>Semester GPAs</Text>
          
          {availableSemesters.length > 0 ? (
            availableSemesters.map((semesterNumber) => {
              const semesterKey = `semester${semesterNumber}`;
              const semesterGPA = gpas[semesterKey];
              const hasGPA = semesterGPA && !isNaN(parseFloat(semesterGPA));
              const courseCount = userData.units[semesterNumber]?.length || 0;

              return (
                <TouchableOpacity 
                  key={semesterKey}
                  style={styles.semesterCard}
                  onPress={() => navigation.navigate("GPACalculation", { semesterKey })}
                >
                  <View style={styles.semesterHeader}>
                    <View style={styles.semesterInfo}>
                      <Text style={styles.semesterName}>Semester {semesterNumber}</Text>
                      <Text style={styles.courseCount}>{courseCount} courses</Text>
                    </View>
                    <View style={styles.gpaSection}>
                      {hasGPA ? (
                        <>
                          <Text style={styles.gpaValue}>{semesterGPA}</Text>
                          <Text style={styles.gpaLabel}>GPA</Text>
                        </>
                      ) : (
                        <Text style={styles.noGPA}>Not Calculated</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.actionIndicator}>
                    <Text style={styles.actionText}>
                      {hasGPA ? "Tap to recalculate →" : "Tap to calculate →"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No Academic Profile</Text>
              <Text style={styles.emptySubtitle}>
                Set up your academic profile to start tracking GPA
              </Text>
            </View>
          )}
        </View>

        {/* Calculate New Button */}
        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={() => navigation.navigate("GPACalculation", { semesterKey: null })}
        >
          <Text style={styles.calculateButtonText}>+ Calculate New Semester GPA</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#383940",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  overallCard: {
    backgroundColor: "#535FFD",
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  overallTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  overallGPA: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 8,
  },
  overallSubtitle: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    margin: 24,
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 16,
    textAlign: "center",
  },
  chart: {
    borderRadius: 16,
  },
  semestersSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 20,
  },
  semesterCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 4,
  },
  courseCount: {
    fontSize: 14,
    color: "#64748B",
  },
  gpaSection: {
    alignItems: "flex-end",
  },
  gpaValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#535FFD",
    marginBottom: 2,
  },
  gpaLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  noGPA: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  actionIndicator: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionText: {
    fontSize: 14,
    color: "#535FFD",
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  calculateButton: {
    backgroundColor: "#535FFD",
    margin: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  calculateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20,
  },
  content: {
    padding: 24,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  emptySub: { 
    color: "#666", 
    textAlign: "center",
    lineHeight: 20,
  },
});
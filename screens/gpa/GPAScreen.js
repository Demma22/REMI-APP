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
import SvgIcon from "../../components/SvgIcon"; // Add this import for SVG icons
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get("window");

export default function GPAScreen({ navigation }) {
  if (!auth.currentUser) {
    return <Text style={styles.center}>Not logged in</Text>;
  }

  const [gpas, setGpas] = useState({});
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { theme } = useTheme();

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

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
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

  const hasGPAData = Object.values(gpas).some(gpa => gpa && !isNaN(parseFloat(gpa)));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <SvgIcon name="arrow-back" size={20} color={theme.colors.primary} />
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
          <View style={[styles.overallCard, { backgroundColor: theme.colors.primary }]}>
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
                backgroundColor: theme.colors.card,
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 2,
                color: (opacity = 1) => theme.mode === 'dark' 
                  ? `rgba(121, 134, 255, ${opacity})` 
                  : `rgba(83, 95, 253, ${opacity})`,
                labelColor: (opacity = 1) => theme.mode === 'dark'
                  ? `rgba(241, 245, 249, ${opacity})`
                  : `rgba(56, 57, 64, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: theme.colors.primary
                },
                propsForBackgroundLines: {
                  stroke: theme.colors.border,
                  strokeWidth: 1,
                },
                propsForLabels: {
                  fill: theme.colors.textSecondary,
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
                          <Text style={[styles.gpaValue, { color: theme.colors.primary }]}>{semesterGPA}</Text>
                          <Text style={styles.gpaLabel}>GPA</Text>
                        </>
                      ) : (
                        <Text style={styles.noGPA}>Not Calculated</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={[styles.actionIndicator, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                      {hasGPA ? "Tap to recalculate" : "Tap to calculate"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { fontSize: 48 }]}>📊</Text>
              <Text style={styles.emptyTitle}>No Academic Profile</Text>
              <Text style={styles.emptySubtitle}>
                Set up your academic profile to start tracking GPA
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Container */}
        <View style={styles.actionsContainer}>
          {/* Calculate New Button
          <TouchableOpacity 
            style={[styles.calculateButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate("GPACalculation", { semesterKey: null })}
          >
            <SvgIcon name="calculator" size={20} color="white" />
            <Text style={styles.calculateButtonText}>Calculate New GPA</Text>
          </TouchableOpacity>  */}

          {/* Export Button - only show if there's GPA data */}
          {hasGPAData && (
            <TouchableOpacity 
              style={[styles.exportButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => navigation.navigate("ExportGPA")}
            >
              <SvgIcon name="pdf" size={20} color="white" />
              <Text style={styles.exportButtonText}>Export GPA Report</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  overallCard: {
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: theme.colors.primary,
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
    backgroundColor: theme.colors.card,
    margin: 24,
    padding: 20,
    borderRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
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
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  semesterCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  courseCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  gpaSection: {
    alignItems: "flex-end",
  },
  gpaValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
  },
  gpaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  noGPA: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontStyle: "italic",
  },
  actionIndicator: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  calculateButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: theme.colors.primary,
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
  exportButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  exportButtonText: {
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
    backgroundColor: theme.colors.card,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  emptySub: { 
    color: theme.colors.textSecondary, 
    textAlign: "center",
    lineHeight: 20,
  },
});
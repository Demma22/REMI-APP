import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity,
  ScrollView,
  Dimensions 
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import NavigationBar from "../../../components/NavigationBar";
import SvgIcon from "../../../components/SvgIcon";
import { useTheme } from '../../../contexts/ThemeContext';
import { getStyles } from './GPAScreen.styles';

const { width } = Dimensions.get("window");

export default function GPAScreen({ navigation }) {
  if (!auth.currentUser) {
    return <Text style={styles.center}>Not logged in</Text>;
  }

  const [gpas, setGpas] = useState({});
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState("uganda");
  
  const { theme } = useTheme();

  useEffect(() => { 
    loadData(); 
    const focus = navigation.addListener("focus", loadData);
    return focus;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Load selected curriculum
        if (data.selected_curriculum) {
          setSelectedCurriculum(data.selected_curriculum);
        }
        
        // Get GPA data from gpa_data object
        const gpaData = data.gpa_data || {};
        
        // Convert to the format expected by the chart
        const formattedGpas = {};
        Object.keys(gpaData).forEach(semesterKey => {
          if (gpaData[semesterKey] && gpaData[semesterKey].gpa) {
            formattedGpas[semesterKey] = gpaData[semesterKey].gpa.toString();
          }
        });
        
        setGpas(formattedGpas);
      }
    } catch (error) {
      console.error("Error loading data:", error);
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
                  onPress={() => navigation.navigate("ScanResults", { semesterKey })}
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
              <SvgIcon name="highschool" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Academic Profile</Text>
              <Text style={styles.emptySubtitle}>
                Set up your academic profile to start tracking GPA
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Container */}
        <View style={styles.actionsContainer}>
          {/* Scan Results Button - NEW */}
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate("ScanResults")}
          >
            <SvgIcon name="scan" size={20} color="white" />
            <Text style={styles.scanButtonText}>Scan Results</Text>
          </TouchableOpacity>

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
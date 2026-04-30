// screens/admin/StatisticsDashboard/StatisticsDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { auth, db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTheme } from '../../../contexts/ThemeContext';
import SvgIcon from '../../../components/SvgIcon';
import NavigationBar from '../../../components/NavigationBar';
import { getStyles } from './StatisticsDashboard.styles';

const { width } = Dimensions.get('window');

const ADMIN_EMAIL = 'denis@gmail.com';

// Pie chart colors
const PIE_COLORS = [
  '#535FFD', '#FDAC1B', '#10B981', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7', '#EAB308', '#3B82F6', '#F43F5E'
];

export default function StatisticsDashboard({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onboardingCompleted: 0,
    usersWithTimetable: 0,
    usersWithGPA: 0,
    heardFrom: {},
    purpose: {},
    studyStage: {},
    ageRange: {},
  });
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const currentUser = auth.currentUser;
    if (currentUser?.email === ADMIN_EMAIL) {
      setIsAuthorized(true);
      loadStatistics();
    } else {
      setIsAuthorized(false);
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let totalUsers = 0;
      let onboardingCompleted = 0;
      let usersWithTimetable = 0;
      let usersWithGPA = 0;
      const heardFromCount = {};
      const purposeCount = {};
      const studyStageCount = {};
      const ageRangeCount = {};
      const recent = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        totalUsers++;
        
        if (userData.onboarding_completed === true) {
          onboardingCompleted++;
        }
        
        const timetable = userData.timetable || {};
        const hasLectures = Object.values(timetable).some(day => day && day.length > 0);
        if (hasLectures) usersWithTimetable++;
        
        const gpaData = userData.gpa_data || {};
        const hasGPA = Object.keys(gpaData).length > 0;
        if (hasGPA) usersWithGPA++;
        
        if (userData.heardFrom) {
          heardFromCount[userData.heardFrom] = (heardFromCount[userData.heardFrom] || 0) + 1;
        }
        
        if (userData.purpose && Array.isArray(userData.purpose)) {
          userData.purpose.forEach(p => {
            purposeCount[p] = (purposeCount[p] || 0) + 1;
          });
        }
        
        if (userData.studyStage) {
          studyStageCount[userData.studyStage] = (studyStageCount[userData.studyStage] || 0) + 1;
        }
        
        if (userData.ageRange) {
          ageRangeCount[userData.ageRange] = (ageRangeCount[userData.ageRange] || 0) + 1;
        }
        
        if (userData.onboarding_completed_at) {
          let completedAt = userData.onboarding_completed_at;
          if (completedAt && completedAt.toDate) {
            completedAt = completedAt.toDate();
          } else if (completedAt) {
            completedAt = new Date(completedAt);
          }
          
          recent.push({
            nickname: userData.nickname || 'Anonymous',
            heardFrom: userData.heardFrom,
            studyStage: userData.studyStage,
            hasTimetable: hasLectures,
            hasGPA: hasGPA,
            completedAt: completedAt,
          });
        }
      }
      
      recent.sort((a, b) => b.completedAt - a.completedAt);
      
      setStats({
        totalUsers,
        onboardingCompleted,
        usersWithTimetable,
        usersWithGPA,
        heardFrom: heardFromCount,
        purpose: purposeCount,
        studyStage: studyStageCount,
        ageRange: ageRangeCount,
      });
      setRecentUsers(recent.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const getHeardFromLabel = (id) => {
    const labels = {
      family_friend: 'Friends & Family',
      social_media: 'Social Media',
      snd_studio: 'SND Studio Website',
      app_store: 'App Store',
      other: 'Other',
    };
    return labels[id] || id;
  };

  const getPurposeLabel = (id) => {
    const labels = {
      productivity: 'Productivity',
      habit_tracking: 'Habit tracking',
      time_management: 'Time management',
      focus: 'Focus',
    };
    return labels[id] || id;
  };

  const getStudyStageLabel = (id) => {
    const labels = {
      high_school: 'High School',
      undergraduate: 'Undergraduate',
      graduate: 'Graduate',
      professional: 'Professional',
      not_studying: 'Not studying',
    };
    return labels[id] || id;
  };

  const getAgeRangeLabel = (id) => {
    const labels = {
      under_18: 'Under 18',
      '18_24': '18-24',
      '25_34': '25-34',
      '35_44': '35-44',
      '45_plus': '45+',
    };
    return labels[id] || id;
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <SvgIcon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );

  // Simple pie chart using SVG circles with stroke-dasharray
  const renderPieChart = (data, total) => {
    const items = Object.entries(data);
    if (items.length === 0) {
      return <Text style={[styles.noDataText, { color: theme.colors.textTertiary }]}>No data available</Text>;
    }
    
    // Sort by count descending
    items.sort((a, b) => b[1] - a[1]);
    
    const size = 180;
    const center = size / 2;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;
    const slices = [];
    
    items.forEach(([key, count], index) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      const dashLength = (percentage / 100) * circumference;
      
      slices.push({
        key,
        count,
        percentage,
        color: PIE_COLORS[index % PIE_COLORS.length],
        label: getLabelForType(key),
        dashLength,
        offset: currentOffset,
      });
      
      currentOffset += dashLength;
    });
    
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={theme.colors.border}
              strokeWidth={30}
            />
            {/* Pie slices as stroke circles */}
            {slices.map((slice, idx) => (
              <Circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={30}
                strokeDasharray={`${slice.dashLength} ${circumference}`}
                strokeDashoffset={-slice.offset}
                rotation="-90"
                originX={center}
                originY={center}
              />
            ))}
            {/* Inner circle for donut effect */}
            <Circle
              cx={center}
              cy={center}
              r={45}
              fill={theme.colors.card}
            />
            <SvgText
              x={center}
              y={center - 8}
              textAnchor="middle"
              fontSize={20}
              fontWeight="bold"
              fill={theme.colors.textPrimary}
            >
              {total}
            </SvgText>
            <SvgText
              x={center}
              y={center + 12}
              textAnchor="middle"
              fontSize={10}
              fill={theme.colors.textSecondary}
            >
              Total
            </SvgText>
          </Svg>
        </View>
        
        <View style={styles.legendContainer}>
          {slices.map((slice, idx) => (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
              <Text style={[styles.legendLabel, { color: theme.colors.textPrimary }]}>
                {slice.label}
              </Text>
              <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                {slice.count} ({slice.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getLabelForType = (key) => {
    let label = getHeardFromLabel(key);
    if (label !== key) return label;
    label = getPurposeLabel(key);
    if (label !== key) return label;
    label = getStudyStageLabel(key);
    if (label !== key) return label;
    label = getAgeRangeLabel(key);
    return label;
  };

  if (!isAuthorized) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistics</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.unauthorizedContainer}>
          <SvgIcon name="lock" size={48} color={theme.colors.danger} />
          <Text style={[styles.unauthorizedTitle, { color: theme.colors.textPrimary }]}>
            Access Denied
          </Text>
          <Text style={[styles.unauthorizedText, { color: theme.colors.textSecondary }]}>
            This page is only accessible to administrators.
          </Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistics</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
        <NavigationBar />
      </View>
    );
  }

  const completionRate = stats.totalUsers > 0 
    ? ((stats.onboardingCompleted / stats.totalUsers) * 100).toFixed(1) 
    : 0;

  const heardFromTotal = Object.values(stats.heardFrom).reduce((a, b) => a + b, 0);
  const purposeTotal = Object.values(stats.purpose).reduce((a, b) => a + b, 0);
  const studyStageTotal = Object.values(stats.studyStage).reduce((a, b) => a + b, 0);
  const ageRangeTotal = Object.values(stats.ageRange).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <SvgIcon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Summary Stats Row */}
          <View style={styles.statsRow}>
            {renderStatCard('Total Users', stats.totalUsers, 'user', theme.colors.primary)}
            {renderStatCard('Completed Onboarding', stats.onboardingCompleted, 'check-circle', theme.colors.success)}
            {renderStatCard('Completion Rate', `${completionRate}%`, 'pie-chart', theme.colors.secondary)}
          </View>

          {/* Feature Usage Stats Row */}
          <View style={styles.statsRow}>
            {renderStatCard('Timetable Created', `${stats.usersWithTimetable}`, 'calendar', theme.colors.primary)}
            {renderStatCard('GPA Calculated', `${stats.usersWithGPA}`, 'book', theme.colors.secondary)}
            {renderStatCard('Feature Usage', `${((stats.usersWithTimetable + stats.usersWithGPA) / (stats.totalUsers * 2) * 100).toFixed(1)}%`, 'trending-up', '#10B981')}
          </View>

          {/* How did you hear about REMI? - Pie Chart */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              How did you hear about REMI?
            </Text>
            {renderPieChart(stats.heardFrom, heardFromTotal)}
          </View>

          {/* What do you want to use REMI for? - Pie Chart */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              What do you want to use REMI for?
            </Text>
            {renderPieChart(stats.purpose, purposeTotal)}
          </View>

          {/* Study Stage - Pie Chart */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Study Stage
            </Text>
            {renderPieChart(stats.studyStage, studyStageTotal)}
          </View>

          {/* Age Range - Pie Chart */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Age Range
            </Text>
            {renderPieChart(stats.ageRange, ageRangeTotal)}
          </View>

          {/* Recent Users */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Recent Onboarding Completions
            </Text>
            {recentUsers.map((user, index) => (
              <View key={index} style={styles.recentUserItem}>
                <View style={styles.recentUserAvatar}>
                  <Text style={styles.recentUserInitial}>
                    {user.nickname?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.recentUserInfo}>
                  <Text style={[styles.recentUserName, { color: theme.colors.textPrimary }]}>
                    {user.nickname}
                  </Text>
                  <Text style={[styles.recentUserDetail, { color: theme.colors.textSecondary }]}>
                    {getStudyStageLabel(user.studyStage)} • {getHeardFromLabel(user.heardFrom)}
                  </Text>
                  <View style={styles.recentUserBadges}>
                    {user.hasTimetable && (
                      <View style={[styles.badge, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Timetable</Text>
                      </View>
                    )}
                    {user.hasGPA && (
                      <View style={[styles.badge, { backgroundColor: theme.colors.secondaryLight }]}>
                        <Text style={[styles.badgeText, { color: theme.colors.secondary }]}>GPA</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.recentUserDate, { color: theme.colors.textTertiary }]}>
                  {user.completedAt?.toLocaleDateString?.() || 'Recent'}
                </Text>
              </View>
            ))}
            {recentUsers.length === 0 && (
              <Text style={[styles.noDataText, { color: theme.colors.textTertiary }]}>No recent users</Text>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}
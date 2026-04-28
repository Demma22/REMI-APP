// screens/HomeScreen.styles.js
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waveEmoji: {
    fontSize: 24,
  },
  profileSection: {
    marginLeft: 15,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  welcome: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  section: {
    marginBottom: 24,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    paddingLeft: 0,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  paginationDot: {
    marginHorizontal: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  examCard: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  examHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  examTitleContainer: {
    flex: 1,
  },
  examCourse: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  examDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  examDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  examDetailText: {
    fontSize: 12,
    fontWeight: "500",
  },
  examFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF30',
  },
  semesterBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  semesterText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  bottomHint: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: "italic",
  },
});

export const getMenuItemStyles = (theme, color) => StyleSheet.create({
  menuItem: {
    width: (width - 60) / 3,
    borderRadius: 20,
    padding: 16,
    marginBottom: 1,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: theme.colors.secondary + '40',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: color + '20',
  },
  menuText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  menuSubtitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export const getStatItemStyles = (theme) => StyleSheet.create({
  statItem: {
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: theme.colors.primary + '20',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export const getSummaryCardStyles = (theme, colors) => StyleSheet.create({
  summaryCard: {
    width: width - 40,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    minHeight: 40,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
    backgroundColor: colors.iconBackground,
  },
  cardTitleContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textColor,
    lineHeight: 18,
  },
  cardContent: {
    minHeight: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  summaryEmpty: {
    color: colors.textColor,
    fontSize: 13,
    fontWeight: '600',
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  emptySubtitle: {
    color: colors.textColor,
    fontSize: 11,
    textAlign: "center",
    opacity: 0.8,
  },
  lectureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  lectureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 8,
    flexShrink: 0,
    backgroundColor: colors.accent,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureCourse: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textColor,
    marginBottom: 2,
  },
  lectureTime: {
    fontSize: 11,
    color: colors.textColor,
    opacity: 0.9,
  },
  gpaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.accent}30`,
  },
  overallGpaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: `${colors.accent}40`,
  },
  gpaSemester: {
    fontSize: 13,
    color: colors.textColor,
    opacity: 0.9,
  },
  overallGpaLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textColor,
  },
  gpaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textColor,
  },
  overallGpaValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textColor,
  },
  moreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 4,
  },
  moreText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent,
  },
});

export const getSettingsMenuItemStyles = (theme) => StyleSheet.create({
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  logoWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLogo: {
    width: 100,
    height: 50,
    resizeMode: 'contain',
  },
});
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const getStyles = (theme) => StyleSheet.create({
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
    borderRadius: 15,
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
    borderRadius: 15,
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
    borderRadius: 15,
  },
  
  // Curriculum Bar - positioned below header
  curriculumBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  curriculumBarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  curriculumBarText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
  
  // Semesters Section - proper spacing
  semestersSection: {
    marginTop: 30,
    paddingHorizontal: 24,
    marginBottom: 16,
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
    borderRadius: 15,
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
  
  // Empty State - with proper spacing
  emptyState: {
    backgroundColor: theme.colors.card,
    padding: 40,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginHorizontal: 24,
    marginBottom: 24,
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
  
  // Action Buttons Container
  actionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  exportButton: {
    padding: 20,
    borderRadius: 15,
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
    borderRadius: 15,
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
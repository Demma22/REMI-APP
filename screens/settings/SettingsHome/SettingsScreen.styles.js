// styles/SettingsScreen.styles.js
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
    paddingBottom: 100,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,

    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { 
    fontSize: 24, 
    color: '#FFFFFF', 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: '#000000',
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  // Danger button without red strip - just red text
  dangerButton: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: `${theme.colors.danger}10`,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  accountInfo: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  accountIcon: {
    marginRight: 8,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  accountStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: theme.colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20,
  },
  // Version info styles
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  copyrightText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
});
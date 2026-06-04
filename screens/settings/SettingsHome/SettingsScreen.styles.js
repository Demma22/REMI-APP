// screens/settings/SettingsHome/SettingsScreen.styles.js
import { StyleSheet } from "react-native";

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header — same formula as HomeScreen: insets.top + 12
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 15,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },

  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 50,
  },

  chevron: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    lineHeight: 26,
  },
});

// screens/Home/HomeScreen.styles.js
import { StyleSheet, Platform } from "react-native";

export const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 120,
    },

    // ── Section ──────────────────────────────────────────────────
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      marginBottom: 14,
      paddingHorizontal: 20,
    },

    // ── Activity circles row ──────────────────────────────────────
    circlesRow: {
      paddingHorizontal: 20,
      paddingBottom: 4,
    },

    // ── Action cards ──────────────────────────────────────────────
    actionCardsRow: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
    },

    // ── Upcoming exam card ────────────────────────────────────────
    examCard: {
      borderRadius: 15,
      padding: 16,
      marginHorizontal: 20,
      ...Platform.select({
        ios: {
          shadowColor: "#EF4444",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        android: { elevation: 0 },
      }),
    },
    examHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
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
      fontSize: 15,
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

    // ── Onboarding nudge banner ───────────────────────────────────
    onboardingBanner: {
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 15,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    onboardingBannerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    onboardingBannerText: {
      flex: 1,
    },
    onboardingBannerTitle: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 2,
    },
    onboardingBannerSubtitle: {
      fontSize: 11,
    },
    onboardingBannerButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 15,
    },
    onboardingBannerButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
  });

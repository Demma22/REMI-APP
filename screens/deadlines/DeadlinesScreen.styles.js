import { StyleSheet, Dimensions } from "react-native";

const PURPLE = "#535FFD";

export const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      gap: 14,
    },

    // ── Header avatar ──────────────────────────────────────────────────────
    headerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 2,
      borderColor: PURPLE,
    },
    headerAvatarPlaceholder: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
    },

    // ── Deadline card ──────────────────────────────────────────────────────
    card: {
      borderRadius: 22,
      padding: 20,
      flexDirection: "row",
      alignItems: "stretch",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    cardLeft: {
      flex: 1,
      justifyContent: "center",
      gap: 4,
      paddingRight: 12,
    },
    cardName: {
      fontSize: 20,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    cardTime: {
      fontSize: 14,
      color: "rgba(255,255,255,0.75)",
      fontWeight: "500",
    },
    cardRoom: {
      fontSize: 14,
      color: "rgba(255,255,255,0.65)",
    },

    cardRight: {
      alignItems: "flex-end",
      justifyContent: "space-between",
      minWidth: 90,
    },
    cardDateBlock: {
      alignItems: "flex-end",
    },
    cardDayAbbr: {
      fontSize: 28,
      fontWeight: "900",
      color: "#FFFFFF",
      lineHeight: 30,
      letterSpacing: 0.5,
    },
    cardDate: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255,255,255,0.85)",
    },

    daysLeftBadge: {
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
    },
    pastBadge: {
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    daysLeftText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#D32F2F",
      letterSpacing: 0.4,
    },

    // ── Empty state ────────────────────────────────────────────────────────
    emptyState: {
      alignItems: "center",
      marginTop: 80,
      gap: 8,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    emptySubText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    // ── FAB ────────────────────────────────────────────────────────────────
    addButton: {
      position: "absolute",
      bottom: 90,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: PURPLE,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: PURPLE,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },

    bottomSpacing: {
      height: 100,
    },
  });

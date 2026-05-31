import { StyleSheet } from "react-native";

const PURPLE = '#535FFD';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },

  // ── Header avatar ─────────────────────────────────────────────────────────
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Timetable: weekly day cards ───────────────────────────────────────────
  timetableContainer: {
    gap: 14,
  },
  weekDayCard: {
    borderRadius: 22,
    padding: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  weekDayCardPurple: {
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
  },
  weekDayCardEmpty: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  weekDayCardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // Left side: activities
  weekDayLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
    minHeight: 80,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  activitySeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activityTime: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    width: 46,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  noActivityText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
  },
  noActivityTextEmpty: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },

  // Right side: day label + button
  weekDayRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 72,
  },
  dayLabelContainer: {
    alignItems: 'flex-end',
  },
  dayAbbrText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  dayAbbrTextDark: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  dayWordText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dayWordTextDark: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  editDayBtn: {
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 12,
  },
  editDayBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  addDayBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 12,
  },
  addDayBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: theme.colors.primary,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  // ── Deadlines tab ─────────────────────────────────────────────────────────
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  examCard: {
    backgroundColor: PURPLE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  examHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  examName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  examDetails: {
    gap: 6,
  },
  examInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  examInfoText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  pastExamCard: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pastExamName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  pastExamInfoText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  addDeadlineBtn: {
    backgroundColor: theme.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  addDeadlineBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  bottomSpacing: {
    height: 100,
  },

  // ── Modals / sheets shared ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sheetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sheetItemTime: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    width: 40,
  },
  sheetItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  sheetChevron: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  sheetCancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
  },
  sheetCancelWhite: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  // ── Add sheet (purple) ────────────────────────────────────────────────────
  addSheetPurple: {
    backgroundColor: PURPLE,
  },
  addSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  addSheetIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSheetTextContainer: {
    flex: 1,
  },
  addSheetItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  addSheetItemDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // ── Activity detail popup ─────────────────────────────────────────────────
  activityDetailCard: {
    backgroundColor: PURPLE,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  activityDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  activityDetailName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    paddingRight: 12,
  },
  closeX: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  activityDetailBody: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  activityDetailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  detailDeleteText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 15,
  },
  detailEditBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  detailEditText: {
    color: PURPLE,
    fontWeight: '700',
    fontSize: 15,
  },
});

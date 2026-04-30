// screens/chatbot/ChatScreen.styles.js
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const getStyles = (theme, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Gradient Overlay at Top - Reduced height
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,  // Reduced from 350 to just cover the status bar area
    zIndex: 15,
    pointerEvents: 'none',
  },
  
  content: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingTop: 100,  // Increased from 20 to push messages below floating buttons
    paddingBottom: 20,
  },
  
  // Floating Buttons
  floatingBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingClearBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: { 
    color: theme.colors.textSecondary, 
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14,
  },
  
  // Thinking Dots
  thinkingDotsContainer: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    zIndex: 10,
  },
  thinkingDotsBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thinkingRobot: {
    marginRight: 8,
  },
  thinkingDotsText: {
    fontSize: 18,
    fontWeight: "bold",
    width: 30,
  },
  
  // Input Bar - UNCHANGED
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlignVertical: "center",
    marginRight: 12,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  
  // User Message - Card Style
  bubble: {
    padding: 14,
    borderRadius: 20,
    marginVertical: 6,
    maxWidth: "80%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  userText: { 
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginTop: -2,
  },
  
  // AI Response - No Card, Just Text on Background
  remiTextContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
    paddingHorizontal: 8,
    maxWidth: "85%",
  },
  remiText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
    marginLeft: 8,
  },
  remiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    marginTop: -2,
  },
  structuredBubble: {
    maxWidth: "90%",
  },
  
  // Structured Data Container
  structuredContainer: {
    marginVertical: 8,
    width: "100%",
  },
  
  // Card Styles (for structured responses - lectures, exams, GPA)
  lectureCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    marginHorizontal: 16,
  },
  lectureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  lectureNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lectureNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lectureName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  lectureDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  examCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    marginHorizontal: 16,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  examNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  examName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  examDetails: {
    gap: 4,
  },
  gpaCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 16,
  },
  gpaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  gpaTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  gpaValueContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  gpaValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  gpaCredits: {
    fontSize: 11,
  },
  gpaSummary: {
    fontSize: 12,
    textAlign: 'center',
  },
});
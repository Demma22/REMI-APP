import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
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
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  backText: { 
    fontSize: 24, 
    color: "#535FFD", 
    fontWeight: "300",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#383940",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#383940",
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#383940",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 16,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 6,
  },
  contactSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  contactItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#383940",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: "#535FFD",
  },
  backButton: {
    backgroundColor: "#535FFD",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20,
  },
});
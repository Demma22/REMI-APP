import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated,
  ScrollView
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashIntro({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Design */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.appName}>REMI</Text>
            <Text style={styles.tagline}>Your Smart Academic Companion</Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(83, 95, 253, 0.1)' }]}>
                <Text style={[styles.featureEmoji, { color: '#535FFD' }]}>📅</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Timetable</Text>
                <Text style={styles.featureDesc}>Organize your classes and schedule</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(247, 133, 34, 0.1)' }]}>
                <Text style={[styles.featureEmoji, { color: '#F78522' }]}>📊</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>GPA Tracker</Text>
                <Text style={styles.featureDesc}>Monitor your academic performance</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(56, 57, 64, 0.1)' }]}>
                <Text style={[styles.featureEmoji, { color: '#383940' }]}>🤖</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>AI Assistant</Text>
                <Text style={styles.featureDesc}>Get academic help anytime</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("Signup")}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
  },
  circle1: {
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(83, 95, 253, 0.08)',
  },
  circle2: {
    bottom: -150,
    left: -100,
    width: 350,
    height: 350,
    backgroundColor: 'rgba(247, 133, 34, 0.06)',
  },
  circle3: {
    top: '40%',
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(56, 57, 64, 0.05)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#535FFD",
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: "900",
    color: "#383940",
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 50,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#383940",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  buttonsSection: {
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: "#535FFD",
    width: '100%',
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#535FFD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    width: '100%',
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#535FFD",
  },
  secondaryButtonText: {
    color: "#535FFD",
    fontSize: 18,
    fontWeight: "700",
  },
  termsText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
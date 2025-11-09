import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Linking } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function LandingPage() {
  const router = useRouter();

  // Only show this page on web
  if (Platform.OS !== "web") {
    return null;
  }

  const handleDownloadApp = () => {
    // Expo link for the app
    window.location.href = "http://xdyx6-e-kamisos333-8081.exp.direct";
  };

  const handleOpenApp = () => {
    const expUrl = "exp://xdyx6-e-kamisos333-8081.exp.direct";
    window.location.href = expUrl;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Navigation */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/MedPost-Icon.png")}
          style={styles.logo}
        />
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Welcome to MedPost</Text>
          <Text style={styles.heroSubtitle}>
            Connecting those who care
          </Text>
          <Text style={styles.heroDescription}>
            MedPost is a premier platform connecting healthcare facilities with 
            qualified medical professionals. Whether you're a facility looking to 
            hire or a healthcare worker seeking your next opportunity, MedPost makes 
            it easy to find the perfect match.
          </Text>
        </View>
        <View style={styles.heroCTA}>
          <TouchableOpacity 
            style={[styles.ctaButton, styles.ctaPrimary]}
            onPress={handleOpenApp}
          >
            <Text style={styles.ctaButtonText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.ctaButton, styles.ctaSecondary]}
            onPress={handleOpenApp}
          >
            <Text style={styles.ctaSecondaryText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Choose MedPost?</Text>
        
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <MaterialIcons name="local-hospital" size={40} color="#00ced1" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>For Facilities</Text>
            <Text style={styles.featureText}>
              Post jobs, review applications, and connect with qualified healthcare professionals.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <MaterialIcons name="person" size={40} color="#00ced1" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>For Healthcare Workers</Text>
            <Text style={styles.featureText}>
              Explore opportunities, build your profile, and advance your healthcare career.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <MaterialIcons name="verified" size={40} color="#00ced1" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Verified Professionals</Text>
            <Text style={styles.featureText}>
              All profiles are verified to ensure quality and trust on both sides.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <MaterialIcons name="autorenew" size={40} color="#00ced1" style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Perfect Matches</Text>
            <Text style={styles.featureText}>
              Our intelligent matching search helps find the best opportunities and candidates.
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Create Your Account</Text>
            <Text style={styles.stepDescription}>
              Sign up as a healthcare facility or professional in minutes.
            </Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Build Your Profile</Text>
            <Text style={styles.stepDescription}>
              Complete your profile with your qualifications and experience.
            </Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Get Verified</Text>
            <Text style={styles.stepDescription}>
              Submit your credentials for verification and approval.
            </Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepTitle}>Connect & Apply</Text>
            <Text style={styles.stepDescription}>
              Browse opportunities or post jobs and start connecting.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaDescription}>
          Join healthcare professionals and facilities using MedPost.
        </Text>
        <TouchableOpacity 
          style={[styles.ctaButton, styles.ctaPrimary, styles.largeCTA]}
          onPress={handleOpenApp}
        >
          <Text style={styles.ctaButtonText}>Download the App</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 MedPost. All rights reserved.
        </Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
          <Text style={styles.footerDivider}>•</Text>
          <Text style={styles.footerLink}>Terms of Service</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafb",
    backgroundImage: "linear-gradient(to bottom, #f8fafb 0%, #e0f7f8 25%, #b3ecf0 60%, #00ced1 100%)",
  } as any,
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 2,
    backgroundColor: "#00ced1",
    borderBottomWidth: 1,
    borderBottomColor: "#009faa",
    position: "relative",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    position: "absolute",
    right: 40,
  },
  navLink: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  loginButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00ced1",
  },
  signupButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00ced1",
  },
  hero: {
    paddingHorizontal: 40,
    paddingVertical: 80,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  heroContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: "800",
    color:  "#2d7b81ff",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  heroTitleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#00ced1",
    borderRadius: 2,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 36,
  },
  heroDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 24,
    marginBottom: 32,
  },
  heroCTA: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  featuresSection: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 40,
    textAlign: "center",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  featureCard: {
    width: "22%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  featureText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  howItWorksSection: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    backgroundColor: "transparent",
    borderTopWidth: 0,
  },
  stepsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  stepCard: {
    width: "20%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00ced1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  } as any,
  ctaDescription: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.95,
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  } as any,
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    backgroundColor: "#fff",
  },
  ctaSecondary: {
    backgroundColor: "#00ced1",
    borderWidth: 0,
    borderColor: "transparent",
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00ced1",
  },
  ctaSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  largeCTA: {
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: "transparent",
    alignItems: "center",
    borderTopWidth: 0,
  },
  footerText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.7,
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  footerLink: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.7,
  },
  footerDivider: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.5,
  },
});

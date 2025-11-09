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
            <Text style={styles.ctaSecondaryText}>Log In</Text>
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
          Join healthcare professionals and facilities using MedPost
        </Text>
        <TouchableOpacity 
          style={[styles.ctaButton, styles.ctaPrimary, styles.largeCTA]}
          onPress={handleOpenApp}
        >
          <Text style={styles.ctaButtonText}>Download the App</Text>
        </TouchableOpacity>

        {/* Credits Section */}
        <View style={styles.creditsSection}>
          
          <View style={styles.creditsContainer}>
            <View style={styles.creditCard}>
              <Text style={styles.creditName}>Kamila Sostre Maldonado</Text>
              <View style={styles.socialLinks}>
                <TouchableOpacity onPress={() => Linking.openURL("https://www.linkedin.com/in/kamila-sostre-maldonado-60a760145")}>
                  <Text style={styles.socialLink}>LinkedIn</Text>
                </TouchableOpacity>
                <Text style={styles.socialDivider}>•</Text>
                <TouchableOpacity onPress={() => Linking.openURL("https://github.com/kamisos3")}>
                  <Text style={styles.socialLink}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.creditCard}>
              <Text style={styles.creditName}>Egmar Ortíz Ocasio</Text>
              <View style={styles.socialLinks}>
                <TouchableOpacity onPress={() => Linking.openURL("https://www.linkedin.com/in/egmar-ocasio-0b2108284")}>
                  <Text style={styles.socialLink}>LinkedIn</Text>
                </TouchableOpacity>
                <Text style={styles.socialDivider}>•</Text>
                <TouchableOpacity onPress={() => Linking.openURL("https://github.com/Egmarortiz")}>
                  <Text style={styles.socialLink}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 MedPost. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper to get responsive values based on screen width
const getResponsiveValue = (mobileValue: number, desktopValue: number): number => {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return mobileValue;
  }
  return desktopValue;
};

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
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 40,
    paddingVertical: 2,
    backgroundColor: "#00ced1",
    borderBottomWidth: 1,
    borderBottomColor: "#009faa",
    position: "relative",
  },
  logo: {
    width: typeof window !== "undefined" && window.innerWidth < 768 ? 70 : 100,
    height: typeof window !== "undefined" && window.innerWidth < 768 ? 70 : 100,
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
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 40,
    paddingVertical: typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 80,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  heroContent: {
    alignItems: "center",
    marginBottom: typeof window !== "undefined" && window.innerWidth < 768 ? 24 : 40,
  },
  heroTitle: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 32 : 56,
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
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 18 : 28,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: typeof window !== "undefined" && window.innerWidth < 768 ? 24 : 36,
  },
  heroDescription: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 14 : 16,
    color: "#555",
    textAlign: "center",
    maxWidth: typeof window !== "undefined" && window.innerWidth < 768 ? "90%" : 600,
    lineHeight: 24,
    marginBottom: 32,
  },
  heroCTA: {
    flexDirection: typeof window !== "undefined" && window.innerWidth < 768 ? "column" : "row",
    gap: 16,
    justifyContent: "center",
    width: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : "auto",
  },
  featuresSection: {
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 40,
    paddingVertical: typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 60,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 22 : 32,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: typeof window !== "undefined" && window.innerWidth < 768 ? 24 : 40,
    textAlign: "center",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 24,
    justifyContent: "center",
  },
  featureCard: {
    width: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : "22%",
    backgroundColor: "#fff",
    padding: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  featureText: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 12 : 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  howItWorksSection: {
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 40,
    paddingVertical: typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 60,
    backgroundColor: "transparent",
    borderTopWidth: 0,
  },
  stepsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 24,
    justifyContent: "center",
  },
  stepCard: {
    width: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : "20%",
    backgroundColor: "#fff",
    padding: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 24,
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
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 14 : 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 12 : 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 40,
    paddingVertical: typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 60,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 22 : 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  } as any,
  ctaDescription: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 14 : 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.95,
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  } as any,
  ctaButton: {
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 24 : 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : "auto",
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
    paddingHorizontal: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 40,
    paddingVertical: typeof window !== "undefined" && window.innerWidth < 768 ? 20 : 30,
    backgroundColor: "transparent",
    alignItems: "center",
    borderTopWidth: 0,
  },
  footerText: {
    fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? 12 : 14,
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
  creditsSection: {
    marginTop: typeof window !== "undefined" && window.innerWidth < 768 ? 20 : 40,
    paddingTop: 20,
    marginLeft: typeof window !== "undefined" && window.innerWidth < 768 ? 8 : 40,
    marginRight: typeof window !== "undefined" && window.innerWidth < 768 ? 8 : 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  creditsContainer: {
    flexDirection: typeof window !== "undefined" && window.innerWidth < 768 ? "column" : "row",
    justifyContent: "center",
    gap: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 32,
    flexWrap: "wrap",
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  creditCard: {
    marginBottom: 14,
    alignItems: "center",
  },
  creditName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
  },
  socialLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  socialLink: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  socialDivider: {
    fontSize: 12,
    color: "#ffffff",
  },
});

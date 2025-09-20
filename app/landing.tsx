import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6c5ce7" />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubbles" size={60} color="#ffffff" />
          </View>

          <Text style={styles.appTitle}>BulkSMS Pro</Text>
          <Text style={styles.tagline}>
            Send thousands of messages instantly
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Messages Sent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>99.9%</Text>
              <Text style={styles.statLabel}>Delivery Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Happy Users</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose BulkSMS Pro?</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash" size={24} color="#6c5ce7" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Lightning Fast</Text>
                <Text style={styles.featureDesc}>
                  Send thousands of messages in seconds with our optimized
                  delivery system
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people" size={24} color="#00cec9" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Contact Management</Text>
                <Text style={styles.featureDesc}>
                  Import and organize your contacts easily. Create groups for
                  targeted messaging
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="analytics" size={24} color="#fd79a8" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Delivery Reports</Text>
                <Text style={styles.featureDesc}>
                  Track message delivery status in real-time with detailed
                  analytics
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="card" size={24} color="#fdcb6e" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Flexible Payments</Text>
                <Text style={styles.featureDesc}>
                  Pay as you go with mobile money, cards, or prepaid credits
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pricing Preview */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Simple Pricing</Text>
          <View style={styles.pricingCard}>
            <Text style={styles.priceAmount}>$0.05</Text>
            <Text style={styles.priceUnit}>per SMS</Text>
            <Text style={styles.priceDesc}>
              No monthly fees • Pay only for what you send • Bulk discounts
              available
            </Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of businesses already using BulkSMS Pro
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/login")}
              activeOpacity={0.8}
            >
              <View style={styles.gradientButton}>
                <Text style={styles.primaryButtonText}>Get Started Free</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/login")}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                Already have an account?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  heroSection: {
    height: height * 0.45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6c5ce7",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.9,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "#ffffff",
    marginTop: 2,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 15,
  },
  scrollContent: {
    flex: 1,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
    marginBottom: 30,
  },
  featuresList: {
    gap: 25,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 14,
    color: "#636e72",
    lineHeight: 20,
  },
  pricingSection: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  pricingCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#6c5ce7",
  },
  priceUnit: {
    fontSize: 16,
    color: "#636e72",
    marginBottom: 10,
  },
  priceDesc: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 50,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
    marginBottom: 10,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  primaryButton: {
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#6c5ce7",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 30,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#6c5ce7",
    textDecorationLine: "underline",
  },
  bottomSpacer: {
    height: 40,
  },
});

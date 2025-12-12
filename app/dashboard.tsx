import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../src/services/api";

interface User {
  id: string;
  phone: string;
  name: string;
}

interface Statistics {
  totalSent: number;
  deliveryRate: number;
  totalContacts: number;
  totalCost: number;
  sentGrowth: number;
  balance: number;
  currency: string;
  usdEquivalent: number;
  thisMonth: {
    sent: number;
    cost: number;
  };
  allTime: {
    messages: number;
    recipients: number;
    failed: number;
  };
}

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        router.replace("/login");
        return;
      }
      loadUserData();
      loadStatistics();
    };
    checkAuth();

    // Animate content on load
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      const stats = await authService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
      // Set default statistics if API fails
      setStatistics({
        totalSent: 0,
        deliveryRate: 0,
        totalContacts: 0,
        totalCost: 0,
        sentGrowth: 0,
        balance: 10000,
        currency: "RWF",
        usdEquivalent: 7.52,
        thisMonth: { sent: 0, cost: 0 },
        allTime: { messages: 0, recipients: 0, failed: 0 },
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await AsyncStorage.multiRemove(["authToken", "userData"]);
          router.replace("/login" as any);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Header Section */}
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* App Name */}
          <Text style={styles.appName}>BULK SMS PRO</Text>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#ffffff40", "#ffffff20"]}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={28} color="#ffffff" />
            </LinearGradient>
          </View>

          <Text style={styles.dashboardTitle}>Dashboard</Text>
          {user && (
            <Text style={styles.welcomeText}>
              Welcome back, {user.name}! 👋
            </Text>
          )}
        </Animated.View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Enhanced Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Statistics</Text>
            <View style={styles.statusIndicator} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statsContainer}>
              {/* Messages Sent Card */}
              <View style={[styles.statCard, styles.blueCardShadow]}>
                <LinearGradient
                  colors={["#3b82f6", "#1d4ed8"]}
                  style={styles.statIcon}
                >
                  <Ionicons name="chatbubble" size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.statLabel}>Messages Sent</Text>
                <Text style={styles.statValue}>
                  {loadingStats
                    ? "..."
                    : statistics?.totalSent.toLocaleString() || "0"}
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={
                      (statistics?.sentGrowth || 0) >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={14}
                    color={
                      (statistics?.sentGrowth || 0) >= 0 ? "#10b981" : "#ef4444"
                    }
                  />
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color:
                          (statistics?.sentGrowth || 0) >= 0
                            ? "#10b981"
                            : "#ef4444",
                      },
                    ]}
                  >
                    {(statistics?.sentGrowth || 0) >= 0 ? "+" : ""}
                    {statistics?.sentGrowth || 0}%
                  </Text>
                </View>
              </View>

              {/* Delivery Rate Card */}
              <View style={[styles.statCard, styles.greenCardShadow]}>
                <LinearGradient
                  colors={["#10b981", "#059669"]}
                  style={styles.statIcon}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.statLabel}>Delivery Rate</Text>
                <Text style={styles.statValue}>
                  {loadingStats ? "..." : `${statistics?.deliveryRate || 0}%`}
                </Text>
                <Text style={styles.excellentText}>Excellent ✨</Text>
              </View>

              {/* Balance Card */}
              <View
                style={[
                  styles.statCard,
                  styles.purpleCardShadow,
                  { minWidth: 140 },
                ]}
              >
                <LinearGradient
                  colors={["#8b5cf6", "#7c3aed"]}
                  style={styles.statIcon}
                >
                  <Ionicons name="wallet" size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.statLabel}>Account Balance</Text>
                <Text style={styles.balanceValue}>
                  {loadingStats
                    ? "..."
                    : `${statistics?.currency || "RWF"} ${statistics?.balance.toLocaleString() || "0"}`}
                </Text>
                <Text style={styles.usdValue}>
                  ≈ ${statistics?.usdEquivalent.toFixed(2) || "0.00"} USD
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Enhanced Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* First Row - 3 Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.gridAction, styles.greenActionShadow]}
              onPress={() => router.push("/compose")}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.gridActionGradient}
              >
                <View style={styles.gridActionIcon}>
                  <Ionicons name="send" size={24} color="#ffffff" />
                </View>
                <Text style={styles.gridActionTitle}>Compose</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridAction, styles.blueActionShadow]}
              onPress={() => router.push("/contacts")}
            >
              <LinearGradient
                colors={["#3b82f6", "#1d4ed8"]}
                style={styles.gridActionGradient}
              >
                <View style={styles.gridActionIcon}>
                  <Ionicons name="people" size={24} color="#ffffff" />
                </View>
                <Text style={styles.gridActionTitle}>Contacts</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridAction, styles.orangeActionShadow]}
              onPress={() => router.push("/drafts")}
            >
              <LinearGradient
                colors={["#f59e0b", "#d97706"]}
                style={styles.gridActionGradient}
              >
                <View style={styles.gridActionIcon}>
                  <Ionicons name="document-text" size={24} color="#ffffff" />
                </View>
                <Text style={styles.gridActionTitle}>Drafts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Second Row - 2 Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.gridAction, styles.purpleActionShadow]}
              onPress={() => router.push("/history")}
            >
              <LinearGradient
                colors={["#8b5cf6", "#7c3aed"]}
                style={styles.gridActionGradient}
              >
                <View style={styles.gridActionIcon}>
                  <Ionicons name="time" size={24} color="#ffffff" />
                </View>
                <Text style={styles.gridActionTitle}>History</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridAction, styles.redActionShadow]}
              onPress={() => router.push("/payments")}
            >
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                style={styles.gridActionGradient}
              >
                <View style={styles.gridActionIcon}>
                  <Ionicons name="card" size={24} color="#ffffff" />
                </View>
                <Text style={styles.gridActionTitle}>Payments</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Empty space for alignment */}
            <View style={styles.gridAction} />
          </View>
        </View>

        {/* Enhanced Account Info */}
        {user && (
          <View style={[styles.accountSection, styles.cardShadow]}>
            <View style={styles.accountHeader}>
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                style={styles.accountIcon}
              >
                <Ionicons name="person" size={24} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.accountTitle}>Account Information</Text>
            </View>

            <View style={styles.accountInfo}>
              <View style={styles.accountItem}>
                <View style={styles.accountItemIcon}>
                  <Ionicons name="person-outline" size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text style={styles.accountItemLabel}>Full Name</Text>
                  <Text style={styles.accountItemValue}>{user.name}</Text>
                </View>
              </View>

              <View style={styles.accountItem}>
                <View
                  style={[
                    styles.accountItemIcon,
                    { backgroundColor: "#dcfce7" },
                  ]}
                >
                  <Ionicons name="call-outline" size={18} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.accountItemLabel}>Phone Number</Text>
                  <Text style={styles.accountItemValue}>{user.phone}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Enhanced Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, styles.logoutShadow]}
        >
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={24} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    paddingBottom: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    paddingRight: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    minWidth: 120,
  },
  blueCardShadow: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  greenCardShadow: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  purpleCardShadow: {
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  usdValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  excellentText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  gridAction: {
    flex: 1,
  },
  gridActionGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  gridActionIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridActionTitle: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  greenActionShadow: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  blueActionShadow: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  orangeActionShadow: {
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  purpleActionShadow: {
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  redActionShadow: {
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountSection: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  accountTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  accountInfo: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  accountItemIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountItemLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  accountItemValue: {
    color: "#111827",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  logoutShadow: {
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 12,
  },
});

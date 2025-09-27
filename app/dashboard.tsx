import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
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
        currency: 'RWF',
        usdEquivalent: 7.52,
        thisMonth: { sent: 0, cost: 0 },
        allTime: { messages: 0, recipients: 0, failed: 0 }
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
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header Section */}
      <LinearGradient
        colors={["#7c3aed", "#a855f7"]}
        className="h-[17vh] justify-center items-center rounded-b-3xl"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="items-center ">
          {/* App Name Added Here */}
          <Text className="text-base font-semibold text-white/80 mb-2">
            BULK SMS PRO.
          </Text>

          <View className="w-16 h-16 bg-white/20 rounded-full justify-center items-center mb-3">
            <Ionicons name="person" size={32} color="#ffffff" />
          </View>
          <Text className="text-2xl font-bold text-white mb-1">Dashboard</Text>
          {user && (
            <Text className="text-white/80 text-center px-4">
              Welcome back, {user.name}!
            </Text>
          )}
        </View>
      </LinearGradient>

      <View className="px-6 pt-6 pb-8">
        {/* Stats Cards */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Your Statistics</Text>
          <View className="flex-row justify-between">
            <View className="bg-white rounded-2xl p-4 flex-1 mr-3 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 bg-blue-100 rounded-lg justify-center items-center mr-2">
                  <Ionicons name="chatbubble" size={16} color="#3b82f6" />
                </View>
                <Text className="text-xs text-gray-600 font-medium">Sent</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {loadingStats ? "..." : statistics?.totalSent.toLocaleString() || "0"}
              </Text>
              <Text className={`text-xs font-medium ${
                (statistics?.sentGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(statistics?.sentGrowth || 0) >= 0 ? '+' : ''}{statistics?.sentGrowth || 0}% this month
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-4 flex-1 mr-3 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 bg-green-100 rounded-lg justify-center items-center mr-2">
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                </View>
                <Text className="text-xs text-gray-600 font-medium">Delivered</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {loadingStats ? "..." : `${statistics?.deliveryRate || 0}%`}
              </Text>
              <Text className="text-xs text-green-600 font-medium">
                Success Rate
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-4 flex-1 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 bg-purple-100 rounded-lg justify-center items-center mr-2">
                  <Ionicons name="wallet" size={16} color="#9333ea" />
                </View>
                <Text className="text-xs text-gray-600 font-medium">Balance</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {loadingStats ? "..." : `${statistics?.currency || 'RWF'} ${statistics?.balance.toLocaleString() || '0'}`}
              </Text>
              <Text className="text-xs text-gray-600 font-medium">
                ≈ ${statistics?.usdEquivalent.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Quick Actions</Text>
          <View className="gap-3">
            <TouchableOpacity
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              onPress={() => router.push("/contacts")}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="people" size={24} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">Manage Contacts</Text>
                  <Text className="text-sm text-gray-600">Import and organize your contact lists</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              onPress={() => router.push("/compose")}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="send" size={24} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">Compose Message</Text>
                  <Text className="text-sm text-gray-600">Create and send bulk messages</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              onPress={() => router.push("/drafts")}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="document-text" size={24} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">Saved Drafts</Text>
                  <Text className="text-sm text-gray-600">Load and manage your message drafts</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              onPress={() => router.push("/history")}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="time" size={24} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">Message History</Text>
                  <Text className="text-sm text-gray-600">View sent messages and delivery reports</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="card" size={24} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">Account & Payments</Text>
                  <Text className="text-sm text-gray-600">Manage billing and payment methods</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Info */}
        {user && (
          <View className="bg-white rounded-2xl p-5 mb-8 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-3">Account Information</Text>
            <View className="flex-row items-center mb-2">
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-2">{user.name}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="call" size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-2">{user.phone}</Text>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 rounded-2xl py-4 items-center shadow-sm"
        >
          <View className="flex-row items-center">
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

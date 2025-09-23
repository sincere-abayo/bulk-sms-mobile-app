import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LandingScreen() {
  // Simple fade-in animation for CTA
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        router.replace("/dashboard");
      }
    };
    checkAuth();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
      delay: 300,
    }).start();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#5427CE" />

      {/* Hero Section */}
      <LinearGradient
        colors={["#5427CE", "#3a79ed"]}
        className="h-[46vh] justify-center items-center rounded-b-3xl shadow-lg"
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="items-center px-8">
          <View
            className="mb-5 shadow-lg"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <LinearGradient
              colors={["#fff", "#8b5cf6"]}
              className="rounded-full p-6"
              start={{ x: 0.1, y: 0.2 }}
              end={{ x: 0.8, y: 1 }}
              style={{
                shadowColor: "#8b5cf6",
                shadowOpacity: 0.15,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Ionicons name="chatbubbles" size={60} color="#5427CE" />
            </LinearGradient>
          </View>

          <Text className="text-4xl font-extrabold text-white mb-2 text-center drop-shadow-lg">
            BulkSMS Pro
          </Text>
          <Text className="text-lg text-white/90 text-center mb-8">
            Send thousands of messages instantly
          </Text>

          <View className="flex-row items-center bg-white/30 rounded-2xl py-4 px-6">
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-white">10K+</Text>
              <Text className="text-xs text-white mt-1 opacity-80">Messages Sent</Text>
            </View>
            <View className="w-px h-8 bg-white/40 mx-4" />
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-white">99.9%</Text>
              <Text className="text-xs text-white mt-1 opacity-80">Delivery Rate</Text>
            </View>
            <View className="w-px h-8 bg-white/40 mx-4" />
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-white">500+</Text>
              <Text className="text-xs text-white mt-1 opacity-80">Happy Users</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Features Section */}
        <View className="px-5 pt-10">
          <Text className="text-2xl font-extrabold text-gray-900 text-center mb-8">
            Why Choose BulkSMS Pro?
          </Text>
          <View className="gap-8">
            {[
              {
                icon: "flash",
                color: "#7c3aed",
                title: "Lightning Fast",
                desc:
                  "Send thousands of messages in seconds with our optimized delivery system.",
              },
              {
                icon: "people",
                color: "#06b6d4",
                title: "Contact Management",
                desc:
                  "Import and organize your contacts easily. Create groups for targeted messaging.",
              },
              {
                icon: "analytics",
                color: "#ec4899",
                title: "Delivery Reports",
                desc:
                  "Track message delivery status in real-time with detailed analytics.",
              },
              {
                icon: "card",
                color: "#f59e0b",
                title: "Flexible Payments",
                desc:
                  "Pay as you go with mobile money, cards, or prepaid credits.",
              },
            ].map((f, i) => (
              <View key={f.title} className="flex-row items-start">
                <View
                  className="w-12 h-12 rounded-full justify-center items-center mr-4"
                  style={{
                    backgroundColor: "#f5f3ff",
                    shadowColor: f.color,
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Ionicons name={f.icon} size={26} color={f.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {f.title}
                  </Text>
                  <Text className="text-sm text-gray-600 leading-5">{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Preview */}
        <View className="px-5 pt-12">
          <Text className="text-2xl font-extrabold text-gray-900 text-center mb-8">
            Simple Pricing
          </Text>
          <View className="bg-gradient-to-tr from-white to-violet-100 rounded-2xl py-8 px-6 items-center shadow-xl border border-violet-100">
            <Text className="text-5xl font-extrabold text-purple-600">15 rwf</Text>
            <Text className="text-base text-gray-700 mb-3">per SMS</Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              No monthly fees • Pay only for what you send • Bulk discounts available
            </Text>
          </View>
        </View>

        {/* CTA Section */}
        <View className="px-5 pt-12 items-center">
          <Text className="text-3xl font-extrabold text-gray-900 text-center mb-2">
            Ready to get started?
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8">
            Join thousands of businesses already using BulkSMS Pro
          </Text>

          <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
            <LinearGradient
              colors={["#9333ea", "#2563eb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
            >
              <TouchableOpacity
                onPress={() => router.push("/login")}
                activeOpacity={0.85}
                className="py-5 px-8"
                style={{ alignItems: "center" }}
              >
                <View className="flex-row items-center justify-center gap-3">
                  <Text className="text-lg font-bold text-white tracking-wide">
                    Get Started Free
                  </Text>
                  <Ionicons name="arrow-forward" size={22} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          <TouchableOpacity
            className="mt-2 py-4 items-center"
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text className="text-base text-indigo-600 underline font-medium">
              Already have an account?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-10 mb-4 items-center opacity-70">
          <Text className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} BulkSMS Pro &mdash; All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
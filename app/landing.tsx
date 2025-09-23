import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Define type for features with proper Ionicons name type
type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  desc: string;
};

const features: Feature[] = [
  {
    icon: "flash",
    color: "#7c3aed",
    title: "Lightning Fast",
    desc: "Send thousands of messages in seconds with our optimized delivery system.",
  },
  {
    icon: "people",
    color: "#06b6d4",
    title: "Contact Management",
    desc: "Import and organize your contacts easily. Create groups for targeted messaging.",
  },
  {
    icon: "analytics",
    color: "#ec4899",
    title: "Delivery Reports",
    desc: "Track message delivery status in real-time with detailed analytics.",
  },
  {
    icon: "card",
    color: "#f59e0b",
    title: "Flexible Payments",
    desc: "Pay as you go with mobile money, cards, or prepaid credits.",
  },
];

export default function LandingScreen() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const featureAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        router.replace("/dashboard");
      }
    };
    checkAuth();
    // Animations
    Animated.stagger(300, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(featureAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#5427CE" />
      {/* Hero Section */}
      <View className="h-[47vh] rounded-b-3xl overflow-hidden shadow-lg">
        <LinearGradient
          colors={["#a6a2b1ff", "#9471dbff"]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
        {/* Animated Lottie Background */}
        <LottieView
          source={require("../assets/animated-animation.json")} // Download a subtle animated SVG or JSON from lottiefiles.com
          autoPlay
          loop
          style={{
            position: "absolute",
            width: width,
            height: 320,
            top: 0,
            left: 0,
            opacity: 0.4,
            zIndex: 1,
          }}
        />
        <Animated.View
          style={{
            flex: 1,
            zIndex: 2,
            opacity: fadeAnim,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 40,
          }}
        >
          <LinearGradient
            colors={["#fff", "#8b5cf6"]}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.7, y: 1 }}
            className="rounded-full p-6"
            style={{
              shadowColor: "#8b5cf6",
              shadowOpacity: 0.22,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              marginBottom: 18,
            }}
          >
            <Ionicons name="chatbubbles" size={60} color="#5427CE" />
          </LinearGradient>
          <Text className="text-4xl font-extrabold text-white mb-2 text-center drop-shadow-lg">
            BulkSMS Pro
          </Text>
          <Text className="text-lg text-white/90 text-center mb-7">
            Send thousands of messages instantly
          </Text>
          {/* Animated Stats Row */}
          <Animated.View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: 18,
              paddingVertical: 13,
              paddingHorizontal: 20,
              opacity: statsAnim,
              transform: [
                {
                  translateY: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            {[
              { label: "Messages Sent", value: "10K+" },
              { label: "Delivery Rate", value: "99.9%" },
              { label: "Happy Users", value: "500+" },
            ].map((stat, i) => (
              <View key={stat.label} style={{ alignItems: "center", flex: 1 }}>
                <Text className="text-xl font-bold text-white">{stat.value}</Text>
                <Text className="text-xs text-white mt-1 opacity-80">{stat.label}</Text>
                {i < 2 && (
                  <View
                    style={{
                      position: "absolute",
                      right: -1,
                      top: 5,
                      width: 1,
                      height: 30,
                      backgroundColor: "rgba(255,255,255,0.3)",
                    }}
                  />
                )}
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Features Section */}
        <View className="px-5 pt-10">
          <Text className="text-2xl font-extrabold text-gray-900 text-center mb-7">
            Why Choose BulkSMS Pro?
          </Text>
          <Animated.View style={{ opacity: featureAnim }}>
            <View className="gap-7">
              {features.map((f, idx) => (
                <Animated.View
                  key={f.title}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    backgroundColor: "#fff",
                    borderRadius: 14,
                    marginBottom: 2,
                    elevation: 3,
                    shadowColor: "#5427CE",
                    shadowOpacity: 0.09,
                    shadowRadius: 7,
                    shadowOffset: { width: 0, height: 2 },
                    padding: 15,
                    transform: [
                      {
                        translateY: featureAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30 * (idx + 1), 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#f5f3ff",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 15,
                      shadowColor: f.color,
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <Ionicons name={f.icon} size={26} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      {f.title}
                    </Text>
                    <Text className="text-sm text-gray-600 leading-5">{f.desc}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>
        {/* Pricing Preview */}
        <View className="px-5 pt-12">
          <Text className="text-2xl font-extrabold text-gray-900 text-center mb-8">
            Simple Pricing
          </Text>
          <LinearGradient
            colors={["#ede9fe", "#f5f3ff"]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              paddingVertical: 32,
              paddingHorizontal: 24,
              alignItems: "center",
              shadowColor: "#8b5cf6",
              shadowOpacity: 0.08,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text className="text-5xl font-extrabold text-purple-600">15 rwf</Text>
            <Text className="text-base text-gray-700 mb-3">per SMS</Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              No monthly fees • Pay only for what you send • Bulk discounts available
            </Text>
          </LinearGradient>
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
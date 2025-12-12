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
            Perfect for weddings, parties, meetings & events
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
                <Text className="text-xl font-bold text-white">
                  {stat.value}
                </Text>
                <Text className="text-xs text-white mt-1 opacity-80">
                  {stat.label}
                </Text>
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

          {/* Get Started Button in Hero */}
          <Animated.View
            style={{
              marginTop: 24,
              paddingHorizontal: 40,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/login")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#ffffff", "#f8fafc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#5427CE",
                      marginRight: 8,
                    }}
                  >
                    Get Started
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#5427CE" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* What Our App Can Help You Section */}
        <View className="px-5 pt-8 pb-6">
          <Text className="text-2xl font-extrabold text-gray-900 text-center mb-3">
            Perfect for Your Events
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            Whether you're planning a wedding, organizing a party, or
            coordinating a meeting, reach everyone instantly at an affordable
            price.
          </Text>

          {/* Event Use Cases */}
          <View className="gap-4">
            {[
              {
                icon: "heart" as keyof typeof Ionicons.glyphMap,
                title: "Weddings & Celebrations",
                description:
                  "Send invitations, updates, and thank you messages to all your guests",
                color: "#ec4899",
                bgColor: "#fdf2f8",
              },
              {
                icon: "musical-notes" as keyof typeof Ionicons.glyphMap,
                title: "Parties & Social Events",
                description:
                  "Coordinate party details, venue changes, and last-minute updates",
                color: "#8b5cf6",
                bgColor: "#f5f3ff",
              },
              {
                icon: "business" as keyof typeof Ionicons.glyphMap,
                title: "Business Meetings",
                description:
                  "Send meeting reminders, agenda updates, and follow-up messages",
                color: "#06b6d4",
                bgColor: "#f0fdfa",
              },
              {
                icon: "school" as keyof typeof Ionicons.glyphMap,
                title: "Community Events",
                description:
                  "Notify members about events, schedule changes, and important announcements",
                color: "#f59e0b",
                bgColor: "#fffbeb",
              },
            ].map((useCase, idx) => (
              <Animated.View
                key={useCase.title}
                style={{
                  backgroundColor: useCase.bgColor,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: `${useCase.color}20`,
                  transform: [
                    {
                      translateY: featureAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (idx + 1), 0],
                      }),
                    },
                  ],
                  opacity: featureAnim,
                }}
              >
                <View className="flex-row items-start">
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: useCase.color,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                      shadowColor: useCase.color,
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                    }}
                  >
                    <Ionicons name={useCase.icon} size={24} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-lg font-bold text-gray-900 mb-2">
                      {useCase.title}
                    </Text>
                    <Text className="text-sm text-gray-700 leading-5">
                      {useCase.description}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Value Proposition */}
          <View className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
            <View className="items-center">
              <View className="flex-row items-center mb-4">
                <Ionicons name="flash" size={24} color="#7c3aed" />
                <Text className="text-xl font-bold text-gray-900 ml-2">
                  Why Choose Us?
                </Text>
              </View>

              <View className="flex-row flex-wrap justify-center gap-4">
                {[
                  {
                    icon: "cash-outline",
                    text: "Low Cost",
                    subtext: "Only 15 RWF per SMS",
                  },
                  {
                    icon: "speedometer-outline",
                    text: "Instant Delivery",
                    subtext: "Reach everyone in seconds",
                  },
                  {
                    icon: "people-outline",
                    text: "Bulk Messaging",
                    subtext: "Send to thousands at once",
                  },
                  {
                    icon: "shield-checkmark-outline",
                    text: "Reliable",
                    subtext: "99.9% delivery rate",
                  },
                ].map((benefit) => (
                  <View
                    key={benefit.text}
                    className="items-center flex-1 min-w-[120px]"
                  >
                    <View className="w-12 h-12 bg-purple-100 rounded-full justify-center items-center mb-2">
                      <Ionicons
                        name={benefit.icon as any}
                        size={20}
                        color="#7c3aed"
                      />
                    </View>
                    <Text className="text-sm font-semibold text-gray-900 text-center">
                      {benefit.text}
                    </Text>
                    <Text className="text-xs text-gray-600 text-center">
                      {benefit.subtext}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-5 pt-6">
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
                    <Text className="text-sm text-gray-600 leading-5">
                      {f.desc}
                    </Text>
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
            <Text className="text-5xl font-extrabold text-purple-600">
              15 rwf
            </Text>
            <Text className="text-base text-gray-700 mb-3">per SMS</Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              No monthly fees • Pay only for what you send • Bulk discounts
              available
            </Text>
          </LinearGradient>
        </View>
        {/* CTA Section */}
        <View className="px-5 pt-12 items-center">
          <Text className="text-3xl font-extrabold text-gray-900 text-center mb-2">
            Ready for your next event?
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8">
            Join event organizers who trust BulkSMS Pro for seamless
            communication
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
                    Get Started
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
        <View className="mt-10 mb-4 items-center opacity-80">
          <Text className="text-sm text-gray-600 text-center font-medium">
            &copy; {new Date().getFullYear()} BulkSMS Pro by Codefusion Ltd
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-1">
            All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

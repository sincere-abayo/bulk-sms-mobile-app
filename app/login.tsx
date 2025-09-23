import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from "../src/services/api";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (phone.length !== 9) {
      Alert.alert("Error", "Please enter a valid 9-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      // Check if user exists and send OTP if needed
      const response = await authService.register(phone.trim());
      console.log("Register API Response:", response);

      if (response.userExists) {
        // User exists, store token and go to dashboard
        await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem("userData", JSON.stringify(response.user));
        router.replace("/dashboard");
      } else {
        // User doesn't exist, go to OTP verification
        const params = {
          phone: phone.trim(),
          userExists: "false",
          receivedOTP: response.otp
        };
        console.log("Navigating to OTP with params:", params);
        router.push({
          pathname: "/otp_verification",
          params,
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={["#7c3aed", "#a855f7"]}
          className="h-[30vh] justify-center items-center relative"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-6 w-10 h-10 bg-white/20 rounded-full justify-center items-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View className="items-center">
            <View className="w-16 h-16 bg-white/20 rounded-full justify-center items-center mb-3">
              <Ionicons name="log-in" size={32} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-white mb-1">Welcome Back</Text>
            <Text className="text-white/80 text-center px-6 text-sm">
              Sign in to your account
            </Text>
          </View>
        </LinearGradient>

        {/* Login Form */}
        <View className="px-6 pt-8 flex-1">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Sign In
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Enter your phone number to receive an OTP
            </Text>
          </View>

          {/* Phone Input */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <View className="flex-row items-center mr-3">
                <Text className="text-gray-600 mr-1">🇷🇼</Text>
                <Text className="text-gray-600 text-sm">+250</Text>
              </View>
              <TextInput
                className="flex-1 text-gray-900 text-base"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={9}
              />
            </View>
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            onPress={handleSendOTP}
            disabled={isLoading}
            className="mb-6"
          >
            <LinearGradient
              colors={["#7c3aed", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Text */}
          <View className="items-center">
            <Text className="text-gray-600 text-center text-sm">
              We'll send a 6-digit code to verify your number
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
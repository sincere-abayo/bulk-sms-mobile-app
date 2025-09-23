import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../src/services/api";

export default function OTPVerificationScreen() {
  const { phone, receivedOTP, userExists } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Check if user exists based on parameter
  const isExistingUser = userExists === "true";


  // Debug log parameters
  React.useEffect(() => {
    console.log("OTP Screen Parameters:", { phone, userExists, isExistingUser });
  }, [phone, userExists, isExistingUser]);

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    if (!isExistingUser && !name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!phone) {
      Alert.alert("Error", "Missing phone number. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOTP(
        phone as string,
        otp,
        isExistingUser ? undefined : name.trim()
      );

      // Store token and user data
      await AsyncStorage.setItem("authToken", response.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.user));

      Alert.alert("Success", isExistingUser ? "Login successful!" : "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/dashboard" as any),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phone) {
      Alert.alert("Error", "Phone number not found");
      return;
    }

    setResendLoading(true);
    try {
      const response = await authService.register(phone as string);
      Alert.alert("Success", "OTP sent successfully!");
      console.log("Resent OTP:", response.otp);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-purple-600">
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header with back button */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-purple-600">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Verify OTP</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 bg-white rounded-t-3xl"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View className="items-center px-6 pt-8 pb-6">
          <View className="w-20 h-20 bg-purple-100 rounded-full justify-center items-center mb-4">
            <Ionicons name="lock-closed" size={40} color="#7c3aed" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Verification</Text>
          <Text className="text-gray-600 text-center mb-1">Enter the 6-digit code sent to</Text>
          <Text className="text-lg font-semibold text-purple-600">{phone || "Your phone"}</Text>
        </View>

        {/* SMS Info Notice */}
        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-center bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 mb-3">
            <Ionicons name="time" size={20} color="#3b82f6" />
            <Text className="text-blue-600 font-medium ml-2 text-center">
              Please wait 1-2 minutes for your SMS verification code
            </Text>
          </View>
          <View className="flex-row items-center justify-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <Ionicons name="flash" size={16} color="#16a34a" />
            <Text className="text-green-600 font-medium ml-2 text-sm text-center">
              OTP will appear above your keyboard when SMS arrives 📱
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <View className="px-6">
          <View className="mb-6">
            <TextInput
              className="bg-gray-50 border-2 border-purple-200 rounded-xl py-4 px-6 text-2xl text-center text-gray-900 font-semibold tracking-widest"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode" // iOS auto-fill hint
              autoComplete="sms-otp"        // Android auto-fill hint
            />
          </View>

          {/* Name input for new users */}
          {!isExistingUser && (
            <View className="mb-6">
              <TextInput
                className="bg-gray-50 border-2 border-purple-200 rounded-xl py-4 px-6 text-gray-900 text-base"
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={loading}
            className="mb-6"
          >
            <LinearGradient
              colors={["#7c3aed", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Verifying..." : "Verify OTP"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendLoading}
            className="flex-row justify-center items-center"
          >
            <Text className="text-gray-600">Didn't receive code? </Text>
            <Text className={`font-medium ${resendLoading ? 'text-gray-400' : 'text-purple-600'}`}>
              {resendLoading ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


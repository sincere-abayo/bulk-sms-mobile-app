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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
        router.replace("/dashboard");
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = () => {
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    router.push({
      pathname: "/otp-verification",
      params: { phone: phone.trim() },
    });
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
          className="h-[35vh] justify-center items-center rounded-b-3xl"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="items-center">
            <View className="w-20 h-20 bg-white/20 rounded-full justify-center items-center mb-4">
              <Ionicons name="chatbubbles" size={40} color="#ffffff" />
            </View>
            <Text className="text-3xl font-bold text-white mb-2">Welcome Back</Text>
            <Text className="text-white/80 text-center px-8">
              Sign in to continue sending bulk messages
            </Text>
          </View>
        </LinearGradient>

        {/* Login Form */}
        <View className="px-6 pt-8 flex-1">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Sign In
            </Text>
            <Text className="text-gray-600 text-center">
              Enter your credentials to access your account
            </Text>
          </View>

          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <View className="flex-row items-center mr-3">
                <Text className="text-gray-600 mr-1">🇷🇼</Text>
                <Text className="text-gray-600">+250</Text>
              </View>
              <TextInput
                className="flex-1 text-gray-900 text-base"
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={9}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <TextInput
                className="flex-1 text-gray-900 text-base"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="ml-2"
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="mb-6"
          >
            <LinearGradient
              colors={["#7c3aed", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold text-lg">
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="px-4 text-gray-500 text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Phone Auth Button */}
          <TouchableOpacity
            onPress={handlePhoneAuth}
            className="bg-gray-100 border border-gray-200 rounded-xl py-4 items-center mb-8"
          >
            <View className="flex-row items-center">
              <Ionicons name="phone-portrait" size={20} color="#374151" />
              <Text className="text-gray-700 font-medium text-base ml-2">
                Sign In with Phone
              </Text>
            </View>
          </TouchableOpacity>

          {/* Links */}
          <View className="items-center">
            <TouchableOpacity className="mb-4">
              <Text className="text-purple-600 font-medium">Forgot Password?</Text>
            </TouchableOpacity>
            <View className="flex-row">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Text className="text-purple-600 font-medium">Contact Support</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
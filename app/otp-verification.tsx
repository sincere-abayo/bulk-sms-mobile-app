import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../src/services/api";

const { width, height } = Dimensions.get("window");

export default function OTPVerificationScreen() {
  const { phone, name, otp: receivedOTP } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    if (!phone || !name) {
      Alert.alert("Error", "Missing phone number or name. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOTP(
        phone as string,
        otp,
        name as string
      );

      // Store token and user data
      await AsyncStorage.setItem("authToken", response.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.user));

      Alert.alert("Success", "Login successful!", [
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6c5ce7" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="lock-closed" size={50} color="#6c5ce7" />
          </View>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={styles.phoneNumber}>{phone}</Text>
        </View>

        {/* Demo OTP Notice */}
        <View style={styles.demoContainer}>
          <Ionicons name="information-circle" size={20} color="#fd79a8" />
          <Text style={styles.demoText}>Demo OTP: {receivedOTP}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="hourglass" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive code? </Text>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6c5ce7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#6c5ce7",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 30,
  },
  logoSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#2d3436",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#636e72",
    marginBottom: 5,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#6c5ce7",
  },
  demoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff5f7",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#fd79a8",
  },
  demoText: {
    fontSize: 14,
    color: "#fd79a8",
    fontWeight: "600",
    marginLeft: 8,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    color: "#2d3436",
    fontWeight: "600",
    borderWidth: 2,
    borderColor: "#6c5ce7",
  },
  button: {
    backgroundColor: "#6c5ce7",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#6c5ce7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 16,
    color: "#636e72",
  },
  resendLink: {
    fontSize: 16,
    color: "#6c5ce7",
    fontWeight: "600",
  },
});

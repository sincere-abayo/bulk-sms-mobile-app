import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NetworkProvider } from "../src/contexts/NetworkContext";
import { OfflineWarning } from "../components/OfflineWarning";
import "../global.css";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      console.log("Auth token found:", !!token); // Debug log
      setIsAuthenticated(!!token);
    } catch (error) {
      console.log("Auth check error:", error); // Debug log
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    // Show loading or splash screen
    return null;
  }

  console.log("Is authenticated:", isAuthenticated); // Debug log

  return (
    <NetworkProvider>
      <OfflineWarning />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="otp_verification"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="contacts"
          options={{
            title: "Contacts",
            headerStyle: { backgroundColor: "#7c3aed" },
            headerTintColor: "#ffffff",
          }}
        />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="compose" options={{ headerShown: false }} />
        <Stack.Screen name="drafts" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NetworkProvider>
  );
}

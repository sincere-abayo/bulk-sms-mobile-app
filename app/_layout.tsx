import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="otp-verification"
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack>
  );
}

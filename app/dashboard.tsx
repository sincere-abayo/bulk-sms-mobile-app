import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  phone: string;
  name: string;
}

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        router.replace("/login");
        return;
      }
      loadUserData();
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Bulk SMS</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Hello, {user.name}!</Text>
          <Text style={styles.phoneText}>Phone: {user.phone}</Text>
        </View>
      )}

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>Manage Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>Send SMS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>Message History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>Account & Payments</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 30,
    color: "#333",
  },
  userInfo: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  userText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  phoneText: {
    fontSize: 16,
    color: "#666",
  },
  menuContainer: {
    flex: 1,
  },
  menuButton: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  menuButtonText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

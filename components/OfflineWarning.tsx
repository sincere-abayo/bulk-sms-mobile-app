import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../src/contexts/NetworkContext";

const { width } = Dimensions.get("window");

export const OfflineWarning: React.FC = () => {
  const { isConnected, isWarningVisible, hideOfflineWarning } = useNetwork();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isWarningVisible && !isConnected) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        hideOfflineWarning();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [isWarningVisible, isConnected, slideAnim, hideOfflineWarning]);

  if (!isWarningVisible || isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: "#dc2626",
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingTop: 50, // Account for status bar
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="cloud-offline" size={12} color="#ffffff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            You're Offline
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 12,
            }}
          >
            Sending messages and login require internet connection
          </Text>
        </View>

        <TouchableOpacity
          onPress={hideOfflineWarning}
          style={{
            padding: 4,
            marginLeft: 8,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

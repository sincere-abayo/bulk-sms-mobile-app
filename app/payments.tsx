import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PaymentMethod {
  id: string;
  type: "mobile_money" | "card";
  name: string;
  details: string;
  icon: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: "topup" | "sms_charge";
  status: "completed" | "pending" | "failed";
  description: string;
  date: string;
  paymentMethod: string;
}

export default function PaymentsScreen() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(10000);
  const [currency] = useState("RWF");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "mobile_money",
      name: "MTN Mobile Money",
      details: "**** **** 4423",
      icon: "phone-portrait",
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      name: "Visa Card",
      details: "**** **** **** 1234",
      icon: "card",
      isDefault: false,
    },
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      amount: 5000,
      currency: "RWF",
      type: "topup",
      status: "completed",
      description: "Account Top-up",
      date: "2024-12-12T10:30:00Z",
      paymentMethod: "MTN Mobile Money",
    },
    {
      id: "2",
      amount: 450,
      currency: "RWF",
      type: "sms_charge",
      status: "completed",
      description: "SMS Campaign - 30 messages",
      date: "2024-12-11T15:45:00Z",
      paymentMethod: "MTN Mobile Money",
    },
    {
      id: "3",
      amount: 2000,
      currency: "RWF",
      type: "topup",
      status: "pending",
      description: "Account Top-up",
      date: "2024-12-10T09:15:00Z",
      paymentMethod: "Visa Card",
    },
  ]);

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("1");

  useEffect(() => {
    loadUserData();
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

  const handleTopUp = () => {
    if (!topUpAmount || parseInt(topUpAmount) < 1000) {
      Alert.alert("Error", "Minimum top-up amount is 1,000 RWF");
      return;
    }

    const selectedMethod = paymentMethods.find(
      (m) => m.id === selectedPaymentMethod
    );

    Alert.alert(
      "Confirm Top-up",
      `Top-up ${parseInt(topUpAmount).toLocaleString()} RWF using ${selectedMethod?.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // Simulate payment processing
            Alert.alert(
              "Success",
              "Top-up request submitted! You will receive a confirmation shortly."
            );
            setShowTopUpModal(false);
            setTopUpAmount("");
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === "topup" ? "add-circle" : "remove-circle";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header */}
      <LinearGradient
        colors={["#7c3aed", "#a855f7"]}
        style={{
          paddingBottom: 24,
          paddingTop: 40,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{ fontSize: 24, fontWeight: "bold", color: "#ffffff" }}
            >
              Payments
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 14 }}>
              Manage your account & payments
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={{
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Current Balance
              </Text>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 36,
                  fontWeight: "bold",
                  marginBottom: 16,
                }}
              >
                {balance.toLocaleString()} {currency}
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14 }}>
                ≈ ${(balance / 1300).toFixed(2)} USD
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowTopUpModal(true)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text
                  style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}
                >
                  Top Up Balance
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Payment Methods */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Payment Methods
          </Text>

          {paymentMethods.map((method) => (
            <View
              key={method.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={
                  method.type === "mobile_money"
                    ? ["#10b981", "#059669"]
                    : ["#3b82f6", "#1d4ed8"]
                }
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name={method.icon as any} size={24} color="#ffffff" />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {method.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  {method.details}
                </Text>
              </View>

              {method.isDefault && (
                <View
                  style={{
                    backgroundColor: "#10b981",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    Default
                  </Text>
                </View>
              )}

              <TouchableOpacity style={{ marginLeft: 12, padding: 4 }}>
                <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 16,
              borderWidth: 2,
              borderColor: "#e5e7eb",
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={24} color="#6b7280" />
            <Text style={{ color: "#6b7280", fontWeight: "500", marginTop: 8 }}>
              Add Payment Method
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Recent Transactions
          </Text>

          {transactions.map((transaction) => (
            <View
              key={transaction.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    transaction.type === "topup" ? "#dcfce7" : "#fef3c7",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name={getTransactionIcon(transaction.type)}
                  size={20}
                  color={transaction.type === "topup" ? "#10b981" : "#f59e0b"}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {transaction.description}
                </Text>
                <Text
                  style={{ fontSize: 14, color: "#6b7280", marginBottom: 2 }}
                >
                  {transaction.paymentMethod}
                </Text>
                <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                  {formatDate(transaction.date)}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: transaction.type === "topup" ? "#10b981" : "#ef4444",
                    marginBottom: 4,
                  }}
                >
                  {transaction.type === "topup" ? "+" : "-"}
                  {transaction.amount.toLocaleString()} {transaction.currency}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: `${getStatusColor(transaction.status)}20`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: getStatusColor(transaction.status),
                      textTransform: "capitalize",
                    }}
                  >
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 24,
              margin: 24,
              width: "90%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "bold", color: "#111827" }}
              >
                Top Up Balance
              </Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              Enter the amount you want to add to your account
            </Text>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Amount (RWF)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: "#f9fafb",
                }}
                placeholder="Enter amount (min. 1,000)"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 12,
                }}
              >
                Payment Method
              </Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setSelectedPaymentMethod(method.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor:
                      selectedPaymentMethod === method.id
                        ? "#7c3aed"
                        : "#e5e7eb",
                    backgroundColor:
                      selectedPaymentMethod === method.id
                        ? "#f3f4f6"
                        : "#ffffff",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        selectedPaymentMethod === method.id
                          ? "#7c3aed"
                          : "#d1d5db",
                      backgroundColor:
                        selectedPaymentMethod === method.id
                          ? "#7c3aed"
                          : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedPaymentMethod === method.id && (
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    )}
                  </View>
                  <Ionicons
                    name={method.icon as any}
                    size={20}
                    color="#6b7280"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={{ fontSize: 16, color: "#111827" }}>
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleTopUp}
              style={{
                backgroundColor: "#7c3aed",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}
              >
                Confirm Top-up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

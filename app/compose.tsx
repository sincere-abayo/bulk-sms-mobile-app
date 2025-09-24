import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { databaseService, type CachedContact } from "../src/services/database";
import { useNetwork } from "../src/contexts/NetworkContext";

interface SelectedContact {
  id: string;
  name: string;
  phone: string;
}

export default function ComposeScreen() {
  const { isConnected, showOfflineWarning } = useNetwork();
  const [message, setMessage] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<CachedContact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // SMS Constants
  const SMS_COST_PER_MESSAGE = 15; // RWF
  const MAX_SMS_LENGTH = 160;

  useEffect(() => {
    loadUserAndContacts();
  }, []);

  const loadUserAndContacts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const uid = payload.userId;
        setUserId(uid);

        // Load cached contacts
        const contacts = await databaseService.getCachedContacts(uid);
        setAvailableContacts(contacts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleContactSelection = (contact: CachedContact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts(prev => [...prev, {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
      }]);
    }
  };

  const calculateCost = () => {
    const messageLength = message.length;
    const smsCount = Math.ceil(messageLength / MAX_SMS_LENGTH) || 1;
    return selectedContacts.length * smsCount * SMS_COST_PER_MESSAGE;
  };

  const getCharacterCount = () => {
    const current = message.length;
    const remaining = MAX_SMS_LENGTH - (current % MAX_SMS_LENGTH);
    const smsCount = Math.ceil(current / MAX_SMS_LENGTH) || 1;
    return { current, remaining, smsCount };
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert("Error", "Please select at least one contact");
      return;
    }

    if (!isConnected) {
      showOfflineWarning();
      Alert.alert(
        "Offline Mode",
        "Messages will be queued and sent when you're back online."
      );
    }

    setIsLoading(true);
    try {
      const messageData = {
        id: Date.now().toString(),
        userId,
        messageId: Date.now().toString(),
        contactIds: JSON.stringify(selectedContacts.map(c => c.id)),
        message: message.trim(),
        status: 'pending' as 'pending' | 'sending' | 'completed' | 'failed',
        priority: 1,
        scheduledAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errorMessage: undefined,
      };

      // Queue the message for sending
      await databaseService.queueBatch(messageData);

      Alert.alert(
        "Success",
        isConnected
          ? "Message queued for sending!"
          : "Message saved offline. Will be sent when online."
      );

      // Reset form
      setMessage("");
      setSelectedContacts([]);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!message.trim() && selectedContacts.length === 0) {
      Alert.alert("Error", "Nothing to save as draft");
      return;
    }

    try {
      const draft = {
        id: Date.now().toString(),
        userId,
        title: `Draft ${new Date().toLocaleDateString()}`,
        content: message.trim(),
        recipientCount: selectedContacts.length,
        contactIds: JSON.stringify(selectedContacts.map(c => c.id)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databaseService.saveDraftMessage(draft);
      Alert.alert("Success", "Draft saved successfully!");
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert("Error", "Failed to save draft");
    }
  };

  const { current, remaining, smsCount } = getCharacterCount();
  const totalCost = calculateCost();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header */}
      <LinearGradient
        colors={["#7c3aed", "#a855f7"]}
        className="h-[12vh] justify-end pb-4"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View className="flex-row items-center justify-between px-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-white">Compose Message</Text>

          <TouchableOpacity
            onPress={saveDraft}
            className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="save" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Recipients Section */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Recipients</Text>
            <TouchableOpacity
              onPress={() => setShowContactModal(true)}
              className="flex-row items-center bg-purple-100 px-3 py-1 rounded-full"
            >
              <Ionicons name="add" size={16} color="#7c3aed" />
              <Text className="text-purple-600 font-medium ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {selectedContacts.length > 0 ? (
            <View className="flex-row flex-wrap">
              {selectedContacts.map((contact) => (
                <View
                  key={contact.id}
                  className="bg-purple-100 px-3 py-1 rounded-full mr-2 mb-2 flex-row items-center"
                >
                  <Text className="text-purple-700 text-sm">{contact.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleContactSelection(contact as any)}
                    className="ml-2"
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Ionicons name="close" size={14} color="#7c3aed" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 italic">No recipients selected</Text>
          )}
        </View>

        {/* Message Input */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Message</Text>

          <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <TextInput
              className="text-gray-900 text-base min-h-[120px]"
              placeholder="Type your message here..."
              multiline
              value={message}
              onChangeText={setMessage}
              maxLength={MAX_SMS_LENGTH * 5} // Allow up to 5 SMS
              style={{ textAlignVertical: 'top' }}
            />

            {/* Character Count & Cost */}
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-600">
                  {current}/{MAX_SMS_LENGTH * smsCount}
                </Text>
                {current > MAX_SMS_LENGTH && (
                  <Text className="text-xs text-orange-600 ml-2">
                    ({smsCount} SMS)
                  </Text>
                )}
              </View>

              <View className="flex-row items-center">
                <Ionicons name="cash" size={14} color="#7c3aed" />
                <Text className="text-sm font-medium text-purple-600 ml-1">
                  {totalCost} RWF
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Send Button */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isLoading || selectedContacts.length === 0 || !message.trim()}
            className="mb-4"
          >
            <LinearGradient
              colors={
                selectedContacts.length > 0 && message.trim() && !isLoading
                  ? ["#7c3aed", "#a855f7"]
                  : ["#d1d5db", "#9ca3af"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-4 items-center"
            >
              <Text className={`font-semibold text-base ${
                selectedContacts.length > 0 && message.trim() && !isLoading
                  ? 'text-white'
                  : 'text-gray-500'
              }`}>
                {isLoading ? "Sending..." : `Send to ${selectedContacts.length} recipient${selectedContacts.length !== 1 ? 's' : ''}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cost Breakdown */}
          {selectedContacts.length > 0 && message.trim() && (
            <View className="bg-gray-50 rounded-lg p-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">Cost Breakdown</Text>
              <View className="flex-row justify-between text-sm">
                <Text className="text-gray-600">Recipients:</Text>
                <Text className="text-gray-900">{selectedContacts.length}</Text>
              </View>
              <View className="flex-row justify-between text-sm mt-1">
                <Text className="text-gray-600">SMS Count:</Text>
                <Text className="text-gray-900">{smsCount}</Text>
              </View>
              <View className="flex-row justify-between text-sm mt-1">
                <Text className="text-gray-600">Rate per SMS:</Text>
                <Text className="text-gray-900">{SMS_COST_PER_MESSAGE} RWF</Text>
              </View>
              <View className="border-t border-gray-300 mt-2 pt-2 flex-row justify-between">
                <Text className="font-medium text-gray-900">Total Cost:</Text>
                <Text className="font-bold text-purple-600">{totalCost} RWF</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Contact Selection Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          }}>
            <TouchableOpacity
              onPress={() => setShowContactModal(false)}
              style={{ padding: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827',
            }}>Select Contacts</Text>
            <TouchableOpacity
              onPress={() => setShowContactModal(false)}
              style={{ padding: 8 }}
            >
              <Text style={{
                color: '#2563eb',
                fontWeight: '500',
                fontSize: 16,
              }}>
                Done ({selectedContacts.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contact List */}
          <FlatList
            data={availableContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedContacts.some(c => c.id === item.id);
              return (
                <TouchableOpacity
                  onPress={() => toggleContactSelection(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    backgroundColor: 'white',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#3b82f6',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '500', color: '#111827' }}>{item.name}</Text>
                      <Text style={{ color: '#6b7280', fontSize: 14 }}>{item.phone}</Text>
                    </View>
                  </View>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isSelected ? '#2563eb' : 'transparent',
                    borderColor: isSelected ? '#2563eb' : '#d1d5db',
                    borderWidth: 2,
                  }}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="people" size={48} color="#d1d5db" />
                <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12, textAlign: 'center' }}>
                  No contacts available. Import contacts first.
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../src/services/api";

interface Message {
  id: string;
  userId: string;
  content: string;
  smsCount: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'pending' | 'sending' | 'completed' | 'failed' | 'partial';
  cost: number;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageRecipient {
  id: string;
  messageId: string;
  contactId?: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export default function MessageHistoryScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDetails, setMessageDetails] = useState<{
    message: Message;
    recipients: MessageRecipient[];
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);

      const response = await authService.getMessageHistory(pageNum, 20);

      if (append) {
        setMessages(prev => [...prev, ...response.messages]);
      } else {
        setMessages(response.messages);
      }

      setHasMore(response.messages.length === 20);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert("Error", "Failed to load message history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages(1, false);
  };

  const loadMessageDetails = async (messageId: string) => {
    try {
      const response = await authService.getMessageDetails(messageId);
      setMessageDetails(response);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error('Error loading message details:', error);
      Alert.alert("Error", "Failed to load message details");
    }
  };

  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'partial': return '#f59e0b';
      case 'failed': return '#dc2626';
      case 'sending': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: Message['status']) => {
    switch (status) {
      case 'completed': return 'Sent';
      case 'partial': return 'Partial';
      case 'failed': return 'Failed';
      case 'sending': return 'Sending';
      default: return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      onPress={() => loadMessageDetails(item.id)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900 font-medium mb-1" numberOfLines={2}>
            {item.content}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: getStatusColor(item.status) + '20' }}>
          <Text className="text-xs font-medium" style={{ color: getStatusColor(item.status) }}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="people" size={14} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {item.sentCount}/{item.totalRecipients} sent
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="cash" size={14} color="#7c3aed" />
          <Text className="text-sm font-medium text-purple-600 ml-1">
            {item.cost} RWF
          </Text>
        </View>
      </View>

      {item.failedCount > 0 && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="warning" size={14} color="#dc2626" />
          <Text className="text-sm text-red-600 ml-1">
            {item.failedCount} failed
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRecipientItem = ({ item }: { item: MessageRecipient }) => (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{item.name}</Text>
        <Text className="text-sm text-gray-600">{item.phone}</Text>
      </View>

      <View className="flex-row items-center">
        <View className={`px-2 py-1 rounded-full mr-2`} style={{
          backgroundColor: getStatusColor(item.status as Message['status']) + '20'
        }}>
          <Text className="text-xs font-medium" style={{
            color: getStatusColor(item.status as Message['status'])
          }}>
            {item.status === 'sent' ? 'Sent' :
             item.status === 'delivered' ? 'Delivered' :
             item.status === 'failed' ? 'Failed' : 'Pending'}
          </Text>
        </View>

        {item.sentAt && (
          <Text className="text-xs text-gray-500">
            {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading && messages.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
        <Text className="text-gray-600">Loading messages...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
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

          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Message History</Text>
            <Text className="text-white/80 text-sm">{messages.length} messages</Text>
          </View>

          <View className="w-10" />
        </View>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="chatbubbles" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-lg font-medium mt-4">No messages yet</Text>
            <Text className="text-gray-400 text-center mt-2">
              Your sent messages will appear here
            </Text>
          </View>
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            loadMessages(page + 1, true);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      {/* Message Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View className="flex-1 bg-white">
          {/* Modal Header */}
          <LinearGradient
            colors={["#7c3aed", "#a855f7"]}
            className="h-[12vh] justify-end pb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View className="flex-row items-center justify-between px-6">
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>

              <View className="flex-1 items-center">
                <Text className="text-xl font-bold text-white">Message Details</Text>
                {messageDetails && (
                  <Text className="text-white/80 text-sm">
                    {formatDate(messageDetails.message.createdAt)}
                  </Text>
                )}
              </View>

              <View className="w-10" />
            </View>
          </LinearGradient>

          {messageDetails && (
            <ScrollView className="flex-1 px-6 pt-6">
              {/* Message Content */}
              <View className="bg-gray-50 rounded-xl p-4 mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-2">Message</Text>
                <Text className="text-gray-700 leading-5">{messageDetails.message.content}</Text>
              </View>

              {/* Stats */}
              <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Delivery Summary</Text>

                <View className="grid grid-cols-2 gap-4">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">{messageDetails.message.sentCount}</Text>
                    <Text className="text-sm text-gray-600">Sent</Text>
                  </View>

                  <View className="items-center">
                    <Text className="text-2xl font-bold text-red-600">{messageDetails.message.failedCount}</Text>
                    <Text className="text-sm text-gray-600">Failed</Text>
                  </View>

                  <View className="items-center">
                    <Text className="text-2xl font-bold text-blue-600">{messageDetails.message.totalRecipients}</Text>
                    <Text className="text-sm text-gray-600">Total</Text>
                  </View>

                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-600">{messageDetails.message.cost}</Text>
                    <Text className="text-sm text-gray-600">Cost (RWF)</Text>
                  </View>
                </View>
              </View>

              {/* Recipients */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Recipients</Text>

                <FlatList
                  data={messageDetails.recipients}
                  keyExtractor={(item) => item.id}
                  renderItem={renderRecipientItem}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View className="h-0" />}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
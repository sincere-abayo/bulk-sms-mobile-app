import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { databaseService, type DraftMessage } from "../src/services/database";

export default function DraftsScreen() {
  const [drafts, setDrafts] = useState<DraftMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadUserAndDrafts();
  }, []);

  const loadUserAndDrafts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const uid = payload.userId;
        setUserId(uid);

        // Load drafts
        const userDrafts = await databaseService.getDraftMessages(uid);
        setDrafts(userDrafts);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = (draft: DraftMessage) => {
    // Navigate to compose screen with draft data
    router.push(`/compose?draftId=${draft.id}`);
  };

  const deleteDraft = async (draftId: string, draftTitle: string) => {
    Alert.alert(
      "Delete Draft",
      `Are you sure you want to delete "${draftTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await databaseService.deleteDraftMessage(userId, draftId);
              setDrafts(prev => prev.filter(d => d.id !== draftId));
              Alert.alert("Success", "Draft deleted successfully");
            } catch (error) {
              console.error('Error deleting draft:', error);
              Alert.alert("Error", "Failed to delete draft");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDraft = ({ item }: { item: DraftMessage }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">{item.title}</Text>
          <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
            {item.content || "No content"}
          </Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="people" size={14} color="#6b7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {item.recipientCount} recipient{item.recipientCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {formatDate(item.updatedAt)}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row mt-3 space-x-2">
        <TouchableOpacity
          onPress={() => loadDraft(item)}
          className="flex-1 bg-purple-600 rounded-lg py-2 items-center"
        >
          <Text className="text-white font-medium text-sm">Load Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => deleteDraft(item.id, item.title)}
          className="bg-red-100 rounded-lg py-2 px-3 items-center"
        >
          <Ionicons name="trash" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Loading drafts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
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

          <Text className="text-xl font-bold text-white">Saved Drafts</Text>

          <View className="w-10" />
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Your Drafts ({drafts.length})
          </Text>

          {drafts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center shadow-sm border border-gray-100">
              <Ionicons name="document-text" size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-center mt-4 mb-2">
                No drafts yet
              </Text>
              <Text className="text-gray-400 text-center text-sm">
                Save your message drafts in the compose screen
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/compose")}
                className="mt-4 bg-purple-600 rounded-lg py-2 px-4"
              >
                <Text className="text-white font-medium">Create Message</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={drafts}
              renderItem={renderDraft}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
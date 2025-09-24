import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../src/services/api";
import { databaseService } from "../src/services/database";
import { useNetwork } from "../src/contexts/NetworkContext";

interface Contact {
  id: string;
  name: string;
  phone: string;
  source: string;
  createdAt: string;
}

interface ImportableContact {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
}

export default function ContactsScreen() {
  const { isConnected, showOfflineWarning } = useNetwork();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importableContacts, setImportableContacts] = useState<
    ImportableContact[]
  >([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  // Sync when coming back online - only if we have unsynced data
  useEffect(() => {
    const syncOnReconnect = async () => {
      if (isConnected && !isSyncing) {
        try {
          const token = await AsyncStorage.getItem("authToken");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const userId = payload.userId;

            // Check if we have unsynced contacts before triggering sync
            const cachedContacts =
              await databaseService.getCachedContacts(userId);
            const hasUnsyncedContacts = cachedContacts.some(
              (c) => !c.lastSynced
            );

            if (hasUnsyncedContacts) {
              console.log("Network reconnected, syncing unsynced contacts");
              const syncedContacts = await syncContactsWithServer(userId);
              if (syncedContacts) {
                setContacts(syncedContacts);
              }
            }
          }
        } catch (error) {
          console.error("Error syncing on reconnect:", error);
        }
      }
    };

    syncOnReconnect();
  }, [isConnected]);

  const syncContactsWithServer = async (userId: string) => {
    if (isSyncing) {
      console.log("Sync already in progress, skipping");
      return null;
    }

    setIsSyncing(true);
    try {
      // Get server contacts
      const response = await authService.getContacts();
      const serverContacts = response.contacts || [];

      // Get local cached contacts
      const cachedContacts = await databaseService.getCachedContacts(userId);

      // Find contacts that exist locally but not on server (added offline)
      // Look for contacts that haven't been synced yet
      const localOnlyContacts = cachedContacts.filter(
        (cached) => !cached.lastSynced // Never synced - this is the key indicator
      );

      console.log(`Found ${localOnlyContacts.length} contacts to sync`);

      // Sync local-only contacts to server
      for (const localContact of localOnlyContacts) {
        try {
          const response = await authService.createContact({
            name: localContact.name,
            phone: localContact.phone,
            source: localContact.source,
          });

          // Update the local contact with the server ID
          await databaseService.updateContactServerId(
            userId,
            localContact.id,
            response.contact.id
          );

          console.log(`Synced contact ${localContact.name} to server`);
        } catch (syncError) {
          console.error(
            `Failed to sync contact ${localContact.name}:`,
            syncError
          );
        }
      }

      // After syncing local contacts, get updated server contacts
      const updatedResponse = await authService.getContacts();
      const updatedServerContacts = updatedResponse.contacts || [];

      // Get remaining unsynced contacts (those that failed to sync)
      const remainingCachedContacts =
        await databaseService.getCachedContacts(userId);
      const remainingUnsyncedContacts = remainingCachedContacts.filter(
        (cached) => !cached.lastSynced // Still not synced (failed to sync above)
      );

      // Merge server contacts with remaining unsynced contacts
      const allContacts = [
        ...updatedServerContacts,
        ...remainingUnsyncedContacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          source: contact.source,
          createdAt: contact.createdAt,
        })),
      ];

      // Update local cache with merged data (preserving unsynced contacts)
      const contactsToCache = allContacts.map((contact: any) => ({
        id: contact.id,
        userId,
        name: contact.name,
        phone: contact.phone,
        source: contact.source,
        serverId: contact.id,
        lastSynced:
          contact.id.startsWith("local-") ||
          contact.id.startsWith("import-offline-")
            ? undefined // Keep as unsynced for local contacts
            : new Date().toISOString(), // Mark server contacts as synced
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt || new Date().toISOString(),
      }));

      await databaseService.saveContacts(userId, contactsToCache);

      console.log("Contacts synced successfully");
      return allContacts;
    } catch (error) {
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadContacts = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;

      // Load cached contacts first for immediate display
      const cachedContacts = await databaseService.getCachedContacts(userId);
      if (cachedContacts.length > 0) {
        setContacts(cachedContacts);
        setLoading(false); // Show cached data immediately
      }

      // Try to sync with server if online
      if (isConnected) {
        try {
          const syncedContacts = await syncContactsWithServer(userId);
          if (syncedContacts) {
            setContacts(syncedContacts); // Update with synced data
          }
        } catch (syncError: any) {
          if (syncError.message === "OFFLINE") {
            showOfflineWarning();
            console.log("Offline: Using cached contacts only");
          } else {
            console.error("Error syncing contacts:", syncError);
            // Keep cached data if sync fails
          }
        }
      } else {
        showOfflineWarning();
        console.log("Offline: Using cached contacts only");
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      if (contacts.length === 0) {
        Alert.alert("Error", "Failed to load contacts");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Create contact on server
      const response = await authService.createContact({
        name: newContact.name.trim(),
        phone: newContact.phone.trim(),
        source: "manual",
      });

      // Cache locally
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId;

        await databaseService.addCachedContact({
          id: response.contact.id,
          userId,
          name: response.contact.name,
          phone: response.contact.phone,
          source: response.contact.source,
          serverId: response.contact.id,
          lastSynced: new Date().toISOString(),
          createdAt: response.contact.createdAt,
          updatedAt: response.contact.updatedAt,
        });
      }

      setNewContact({ name: "", phone: "" });
      setShowAddModal(false);
      loadContacts(); // Refresh the list
      Alert.alert("Success", "Contact added successfully");
    } catch (error: any) {
      if (error.message === "OFFLINE") {
        showOfflineWarning();

        // Save contact locally when offline
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.userId;

          const localContactId = `local-${Date.now()}`;
          await databaseService.addCachedContact({
            id: localContactId,
            userId,
            name: newContact.name.trim(),
            phone: newContact.phone.trim(),
            source: "manual",
            serverId: undefined, // Will be set after sync
            lastSynced: undefined, // Mark as not synced
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        Alert.alert("Offline", "Contact saved locally. Will sync when online.");
        setNewContact({ name: "", phone: "" });
        setShowAddModal(false);
        loadContacts(); // Refresh to show the locally saved contact
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.error || "Failed to add contact"
        );
      }
    }
  };

  const handleDeleteContact = async (
    contactId: string,
    contactName: string
  ) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contactName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete from server
              await authService.deleteContact(contactId);

              // Delete from local cache
              const token = await AsyncStorage.getItem("authToken");
              if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const userId = payload.userId;
                await databaseService.removeCachedContact(userId, contactId);
              }

              loadContacts(); // Refresh the list
              Alert.alert("Success", "Contact deleted successfully");
            } catch (error: any) {
              if (error.message === "OFFLINE") {
                showOfflineWarning();
                // Mark contact as deleted locally (remove from cache)
                const token = await AsyncStorage.getItem("authToken");
                if (token) {
                  const payload = JSON.parse(atob(token.split(".")[1]));
                  const userId = payload.userId;
                  await databaseService.removeCachedContact(userId, contactId);
                }
                Alert.alert(
                  "Offline",
                  "Contact deleted locally. Will sync when online."
                );
                loadContacts();
              } else {
                Alert.alert(
                  "Error",
                  error.response?.data?.error || "Failed to delete contact"
                );
              }
            }
          },
        },
      ]
    );
  };

  const handleImportContacts = async () => {
    try {
      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Contacts permission is required to import contacts from your device.",
          [{ text: "OK" }]
        );
        return;
      }

      // Get contacts
      setImporting(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        Alert.alert("No Contacts", "No contacts found on your device.");
        setImporting(false);
        return;
      }

      // Filter and format contacts
      const validContacts: ImportableContact[] = data
        .filter(
          (contact) =>
            contact.name &&
            contact.phoneNumbers &&
            contact.phoneNumbers.length > 0
        )
        .map((contact, index) => {
          // Get the first phone number and clean it
          const phoneNumber = contact.phoneNumbers![0].number || "";
          // Remove all non-digit characters except +
          const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");

          // Convert to Rwandan format if possible
          let formattedPhone = cleanPhone;
          if (cleanPhone.startsWith("+250")) {
            formattedPhone = cleanPhone.substring(4); // Remove +250
          } else if (cleanPhone.startsWith("250")) {
            formattedPhone = cleanPhone.substring(3); // Remove 250
          } else if (cleanPhone.startsWith("0")) {
            formattedPhone = cleanPhone.substring(1); // Remove leading 0
          }

          // Ensure it's 9 digits for Rwandan numbers
          if (formattedPhone.length === 9 && /^\d+$/.test(formattedPhone)) {
            return {
              id: `import-${index}`,
              name: contact.name,
              phone: formattedPhone,
              selected: false, // Default unselected
            };
          }

          return null;
        })
        .filter((contact) => contact !== null) as ImportableContact[];

      setImporting(false);

      if (validContacts.length === 0) {
        Alert.alert(
          "No Valid Contacts",
          "No contacts with valid Rwandan phone numbers were found."
        );
        return;
      }

      // Show selective import modal
      setImportableContacts(validContacts);
      setShowImportModal(true);
    } catch (error) {
      console.error("Error accessing contacts:", error);
      Alert.alert("Error", "Failed to access contacts. Please try again.");
      setImporting(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setImportableContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? { ...contact, selected: !contact.selected }
          : contact
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = importableContacts.every((contact) => contact.selected);
    setImportableContacts((prev) =>
      prev.map((contact) => ({ ...contact, selected: !allSelected }))
    );
  };

  const handleConfirmImport = async () => {
    const selectedContacts = importableContacts.filter(
      (contact) => contact.selected
    );

    if (selectedContacts.length === 0) {
      Alert.alert(
        "No Selection",
        "Please select at least one contact to import."
      );
      return;
    }

    setShowImportModal(false);
    setImporting(true);

    try {
      const contactsToImport = selectedContacts.map(({ name, phone }) => ({
        name,
        phone,
        source: "phonebook" as const,
      }));

      const response = await authService.bulkCreateContacts(contactsToImport);

      // Cache imported contacts locally
      const token = await AsyncStorage.getItem("authToken");
      if (token && response.contacts) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId;

        const contactsToCache = response.contacts.map((contact: any) => ({
          id: contact.id,
          userId,
          name: contact.name,
          phone: contact.phone,
          source: contact.source,
          serverId: contact.id,
          lastSynced: new Date().toISOString(),
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        }));

        await databaseService.saveContacts(userId, contactsToCache);
      }

      loadContacts(); // Refresh the list
      Alert.alert(
        "Success",
        `Successfully imported ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""}!`
      );
    } catch (error: any) {
      if (error.message === "OFFLINE") {
        showOfflineWarning();

        // Save contacts locally when offline - APPEND, don't replace
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.userId;

          // Add each contact individually to avoid overwriting existing ones
          for (let i = 0; i < selectedContacts.length; i++) {
            const contact = selectedContacts[i];
            await databaseService.addCachedContact({
              id: `import-offline-${Date.now()}-${i}`,
              userId,
              name: contact.name,
              phone: contact.phone,
              source: "phonebook",
              serverId: undefined, // Will be set after sync
              lastSynced: undefined, // Mark as not synced
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        Alert.alert(
          "Offline Import",
          `Contacts saved locally. ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""} will be synced when online.`
        );
        loadContacts();
      } else {
        Alert.alert(
          "Import Failed",
          error.response?.data?.error || "Failed to import contacts"
        );
      }
    } finally {
      setImporting(false);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full justify-center items-center mr-3">
            <Text className="text-white font-bold text-lg">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-gray-600">{item.phone}</Text>
            <View className="flex-row items-center mt-1">
              <Text
                className="text-xs text-gray-500"
                style={{ textTransform: "capitalize" }}
              >
                {item.source}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteContact(item.id, item.name)}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Loading contacts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Contacts</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Stats */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-blue-600">
                {contacts.length}
              </Text>
              <Text className="text-sm text-gray-600">Total Contacts</Text>
            </View>
            <View className="w-px h-12 bg-gray-200 mx-4" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-green-600">
                {contacts.filter((c) => c.source === "manual").length}
              </Text>
              <Text className="text-sm text-gray-600">Manual</Text>
            </View>
            <View className="w-px h-12 bg-gray-200 mx-4" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-purple-600">
                {contacts.filter((c) => c.source === "phonebook").length}
              </Text>
              <Text className="text-sm text-gray-600">Imported</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mb-6 flex-row space-x-4">
          {/* Add New Contact */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="flex-1 bg-blue-700 rounded-xl py-4 px-4 items-center shadow-sm"
            style={{ elevation: 2 }}
          >
            <View className="flex-row items-center justify-center">
              <View className="bg-white/30 rounded-full p-1 mr-2">
                <Ionicons name="add" size={18} color="white" />
              </View>
              <Text className="text-white font-bold text-base">Add</Text>
            </View>
          </TouchableOpacity>

          {/* Import Contacts */}
          <TouchableOpacity
            onPress={handleImportContacts}
            disabled={importing}
            className="flex-1 bg-white border border-green-500 rounded-xl py-4 px-4 items-center shadow-sm"
            style={{ elevation: 1 }}
          >
            <View className="flex-row items-center justify-center">
              <View className="bg-green-500 rounded-full p-1 mr-2">
                <Ionicons
                  name={importing ? "hourglass" : "download"}
                  size={18}
                  color="white"
                />
              </View>
              <Text className="text-green-600 font-bold text-base">
                {importing ? "Importing..." : "Import"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Your Contacts ({contacts.length})
          </Text>

          {contacts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center shadow-sm border border-gray-100">
              <Ionicons name="people" size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-center mt-4 mb-2">
                No contacts yet
              </Text>
              <Text className="text-gray-400 text-center text-sm">
                Add your first contact or import from your device
              </Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Add New Contact
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Full Name
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Enter full name"
                value={newContact.name}
                onChangeText={(text) =>
                  setNewContact({ ...newContact, name: text })
                }
              />
            </View>

            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Text className="text-gray-600 mr-2">🇷🇼 +250</Text>
                <TextInput
                  className="flex-1 text-gray-900"
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  value={newContact.phone}
                  onChangeText={(text) =>
                    setNewContact({ ...newContact, phone: text })
                  }
                  maxLength={9}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddContact}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">
                Add Contact
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Import Contacts Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View className="flex-1 bg-gray-50">
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 16,
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <TouchableOpacity
              onPress={() => setShowImportModal(false)}
              style={{ padding: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              Select Contacts
            </Text>
            <TouchableOpacity onPress={toggleSelectAll} style={{ padding: 8 }}>
              <Text
                style={{
                  color: "#2563eb",
                  fontWeight: "500",
                  fontSize: 16,
                }}
              >
                {importableContacts.every((c) => c.selected)
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "#eff6ff",
              borderBottomWidth: 1,
              borderBottomColor: "#bfdbfe",
            }}
          >
            <Text
              style={{
                color: "#1e40af",
                textAlign: "center",
                fontSize: 16,
                fontWeight: "500",
              }}
            >
              {importableContacts.filter((c) => c.selected).length} of{" "}
              {importableContacts.length} contacts selected
            </Text>
          </View>

          {/* Contact List */}
          <FlatList
            data={importableContacts}
            keyExtractor={(item) => item.id}
            className="flex-1"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleContactSelection(item.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  backgroundColor: "white",
                  borderBottomWidth: 1,
                  borderBottomColor: "#f3f4f6",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#3b82f6",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "500",
                        color: "#111827",
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ color: "#6b7280", fontSize: 14 }}>
                      {item.phone}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: item.selected ? "#2563eb" : "transparent",
                    borderColor: item.selected ? "#2563eb" : "#d1d5db",
                  }}
                >
                  {item.selected && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Import Button */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              backgroundColor: "white",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
            }}
          >
            <TouchableOpacity
              onPress={handleConfirmImport}
              disabled={
                importableContacts.filter((c) => c.selected).length === 0
              }
              style={{
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  importableContacts.filter((c) => c.selected).length > 0
                    ? "#10b981"
                    : "#d1d5db",
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 16,
                  color:
                    importableContacts.filter((c) => c.selected).length > 0
                      ? "white"
                      : "#6b7280",
                }}
              >
                Import {importableContacts.filter((c) => c.selected).length}{" "}
                Contact
                {importableContacts.filter((c) => c.selected).length !== 1
                  ? "s"
                  : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

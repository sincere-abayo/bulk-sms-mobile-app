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
  const [filteredImportableContacts, setFilteredImportableContacts] = useState<
    ImportableContact[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  // Debug effect to track contacts state
  useEffect(() => {
    console.log(`Contacts state updated: ${contacts.length} contacts`);
    if (contacts.length > 0) {
      console.log("First 3 contacts:", contacts.slice(0, 3));
    }
  }, [contacts]);

  // Force refresh from database only (for debugging)
  const forceRefreshFromDatabase = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId;

        const cachedContacts = await databaseService.getCachedContacts(userId);
        const formattedContacts = cachedContacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          source: contact.source,
          createdAt: contact.createdAt,
        }));

        setContacts(formattedContacts);
        console.log(
          `Force refreshed: ${formattedContacts.length} contacts from database`
        );
      }
    } catch (error) {
      console.error("Force refresh error:", error);
    }
  };

  // Filter importable contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImportableContacts(importableContacts);
    } else {
      const filtered = importableContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      );
      setFilteredImportableContacts(filtered);
    }
  }, [searchQuery, importableContacts]);

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
      // Get local cached contacts first
      const cachedContacts = await databaseService.getCachedContacts(userId);

      // Find contacts that exist locally but not on server (added offline)
      const localOnlyContacts = cachedContacts.filter(
        (cached) => !cached.lastSynced && !cached.serverId
      );

      console.log(
        `Found ${localOnlyContacts.length} local contacts to sync to server`
      );

      // Sync local-only contacts to server
      for (const localContact of localOnlyContacts) {
        try {
          const response = await authService.createContact({
            name: localContact.name,
            phone: localContact.phone,
            source: localContact.source,
          });

          // Update the local contact with the server ID and mark as synced
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

      // Get server contacts
      const response = await authService.getContacts();
      const serverContacts = response.contacts || [];

      // Merge server contacts with local database using the new merge method
      const serverContactsToCache = serverContacts.map((contact: any) => ({
        id: contact.id,
        userId,
        name: contact.name,
        phone: contact.phone,
        source: contact.source,
        serverId: contact.id,
        lastSynced: new Date().toISOString(),
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt || new Date().toISOString(),
      }));

      // Use the new merge method to preserve local contacts
      await databaseService.mergeServerContacts(userId, serverContactsToCache);

      // Get all contacts from database (server + local)
      const allContacts = await databaseService.getCachedContacts(userId);

      // Convert to the format expected by the UI
      const formattedContacts = allContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        source: contact.source,
        createdAt: contact.createdAt,
      }));

      console.log(
        `Sync completed. Total contacts: ${formattedContacts.length}`
      );
      return formattedContacts;
    } catch (error) {
      console.error("Sync error:", error);
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

      // Always load cached contacts first for immediate display
      const cachedContacts = await databaseService.getCachedContacts(userId);
      console.log(
        `Loaded ${cachedContacts.length} contacts from local database`
      );

      // Debug database state
      await databaseService.debugDatabaseState(userId);

      // Convert cached contacts to UI format
      const formattedCachedContacts = cachedContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        source: contact.source,
        createdAt: contact.createdAt,
      }));

      setContacts(formattedCachedContacts);
      setLoading(false); // Show cached data immediately

      // Try to sync with server if online (background sync)
      if (isConnected) {
        try {
          const syncedContacts = await syncContactsWithServer(userId);
          if (syncedContacts) {
            console.log(
              `Sync completed, updating UI with ${syncedContacts.length} contacts`
            );
            setContacts(syncedContacts); // Update with synced data
          }
        } catch (syncError: any) {
          if (syncError.message === "OFFLINE") {
            showOfflineWarning();
            console.log("Offline: Using cached contacts only");
          } else {
            console.error("Error syncing contacts:", syncError);
            // Keep cached data if sync fails - don't show error to user
            console.log("Sync failed, keeping cached contacts");
          }
        }
      } else {
        if (formattedCachedContacts.length === 0) {
          showOfflineWarning();
        }
        console.log("Offline: Using cached contacts only");
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      // Try to load from database even if there's an error
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.userId;
          const cachedContacts =
            await databaseService.getCachedContacts(userId);
          const formattedContacts = cachedContacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            source: contact.source,
            createdAt: contact.createdAt,
          }));
          setContacts(formattedContacts);
        }
      } catch (fallbackError) {
        console.error("Fallback load also failed:", fallbackError);
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

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId;

    try {
      if (isConnected) {
        // Try to create contact on server first
        const response = await authService.createContact({
          name: newContact.name.trim(),
          phone: newContact.phone.trim(),
          source: "manual",
        });

        // Save to local database with server ID
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

        Alert.alert("Success", "Contact added successfully");
      } else {
        throw new Error("OFFLINE");
      }
    } catch (error: any) {
      if (error.message === "OFFLINE" || !isConnected) {
        showOfflineWarning();

        // Save contact locally when offline
        const localContactId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

        Alert.alert("Offline", "Contact saved locally. Will sync when online.");
      } else {
        console.error("Error adding contact:", error);
        Alert.alert(
          "Error",
          error.response?.data?.error || "Failed to add contact"
        );
        return; // Don't proceed if there's a real error
      }
    }

    // Clear form and close modal
    setNewContact({ name: "", phone: "" });
    setShowAddModal(false);

    // Refresh the list to show the new contact
    loadContacts();
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
      setFilteredImportableContacts(validContacts);
      setSearchQuery(""); // Reset search when opening modal
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
    // Check if all filtered contacts are selected
    const allFilteredSelected = filteredImportableContacts.every(
      (contact) => contact.selected
    );

    // Toggle selection for all filtered contacts
    setImportableContacts((prev) =>
      prev.map((contact) => {
        // Only toggle if this contact is in the filtered list
        const isInFiltered = filteredImportableContacts.some(
          (f) => f.id === contact.id
        );
        if (isInFiltered) {
          return { ...contact, selected: !allFilteredSelected };
        }
        return contact;
      })
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

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      Alert.alert("Error", "Authentication required");
      setImporting(false);
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId;

    try {
      if (isConnected) {
        // Try to import to server first
        const contactsToImport = selectedContacts.map(({ name, phone }) => ({
          name,
          phone,
          source: "phonebook" as const,
        }));

        const response = await authService.bulkCreateContacts(contactsToImport);

        // Save imported contacts to local database
        if (response.contacts) {
          for (const contact of response.contacts) {
            await databaseService.addCachedContact({
              id: contact.id,
              userId,
              name: contact.name,
              phone: contact.phone,
              source: contact.source,
              serverId: contact.id,
              lastSynced: new Date().toISOString(),
              createdAt: contact.createdAt,
              updatedAt: contact.updatedAt,
            });
          }
        }

        Alert.alert(
          "Success",
          `Successfully imported ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""}!`
        );
      } else {
        throw new Error("OFFLINE");
      }
    } catch (error: any) {
      if (error.message === "OFFLINE" || !isConnected) {
        showOfflineWarning();

        // Save contacts locally when offline - Add each contact individually
        for (let i = 0; i < selectedContacts.length; i++) {
          const contact = selectedContacts[i];
          const localId = `import-offline-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;

          await databaseService.addCachedContact({
            id: localId,
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

        Alert.alert(
          "Offline Import",
          `Contacts saved locally. ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""} will be synced when online.`
        );
      } else {
        console.error("Import error:", error);
        Alert.alert(
          "Import Failed",
          error.response?.data?.error || "Failed to import contacts"
        );
      }
    } finally {
      setImporting(false);
      // Always refresh the list to show new contacts
      loadContacts();
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
        onRequestClose={() => {
          setSearchQuery("");
          setShowImportModal(false);
        }}
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
              onPress={() => {
                setSearchQuery("");
                setShowImportModal(false);
              }}
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
                {filteredImportableContacts.every((c) => c.selected)
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#111827",
                }}
                placeholder="Search contacts..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
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
              {importableContacts.filter((c) => c.selected).length} selected
              {searchQuery.trim() && (
                <Text style={{ color: "#6b7280" }}>
                  {" "}
                  • {filteredImportableContacts.length} of{" "}
                  {importableContacts.length} shown
                </Text>
              )}
            </Text>
          </View>

          {/* Contact List */}
          <FlatList
            data={filteredImportableContacts}
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
            ListEmptyComponent={() => (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 60,
                  paddingHorizontal: 24,
                }}
              >
                <Ionicons name="search" size={48} color="#d1d5db" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "500",
                    color: "#6b7280",
                    textAlign: "center",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  {searchQuery.trim()
                    ? "No contacts found"
                    : "No contacts available"}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  {searchQuery.trim()
                    ? `No contacts match "${searchQuery}"`
                    : "No valid contacts found on your device"}
                </Text>
                {searchQuery.trim() && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={{
                      marginTop: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: "#3b82f6",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "500" }}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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

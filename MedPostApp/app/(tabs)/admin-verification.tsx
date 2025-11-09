import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Platform,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { API_ENDPOINTS } from "../../config/api";

const getPlatform = () => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

interface PendingVerification {
  worker_id?: string;
  facility_id?: string;
  full_name?: string;
  legal_name?: string;
  email: string;
  title?: string;
  industry?: string;
  license_id?: string;
  selfie_url: string | null;
  id_photo_url: string | null;
  profile_image_url: string | null;
  resume_url: string | null;
  verification_submitted_at: string | null;
  verification_status: string;
}

export default function AdminVerificationScreen() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        console.warn("No token available for fetching verifications");
        Alert.alert("Auth Required", "Please log in to view verifications");
        setVerifications([]);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(API_ENDPOINTS.ADMIN_PENDING_VERIFICATIONS, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      setVerifications(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Failed to fetch verifications:", error?.response?.data || error.message);
      console.error("Error status:", error?.response?.status);
      console.error("Error headers:", error?.config?.headers);
      Alert.alert("Error", "Failed to load pending verifications");
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const facilities = verifications.filter(v => v.facility_id);
  const workers = verifications.filter(v => v.worker_id);

  const handleApprove = async (id: string, fullName: string, isWorker: boolean = true) => {
    Alert.alert(
      "Approve Verification",
      `Are you sure you want to approve ${fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            try {
              setProcessing(id);
              console.log("=== APPROVE REQUEST ===");
              console.log("ID:", id);
              console.log("Full Name:", fullName);
              console.log("Is Worker:", isWorker);
              console.log("Endpoint:", API_ENDPOINTS.ADMIN_APPROVE_VERIFICATION);
              const payload = {
                [isWorker ? "worker_id" : "facility_id"]: id,
                approved: true,
              };
              console.log("Payload keys:", Object.keys(payload));
              console.log("Payload:", payload);
              console.log("Payload JSON:", JSON.stringify(payload));
              console.log("Has approved?", "approved" in payload);
              console.log("approved value:", payload.approved);
              
              const token = await AsyncStorage.getItem("token");
              const response = await axios.post(API_ENDPOINTS.ADMIN_APPROVE_VERIFICATION, payload, {
                headers: token ? {
                  "Authorization": `Bearer ${token}`
                } : {}
              });
              console.log("Axios payload sent:", payload);
              console.log("Response status:", response.status);
              console.log("Response data:", response.data);
              console.log("=== END APPROVE ===");
              
              Alert.alert("Success", `${fullName} has been verified!`);
              // Update status and then remove card from page after approval
              setVerifications(verifications.map(v => 
                (v.worker_id ? v.worker_id === id : v.facility_id === id)
                  ? { ...v, verification_status: "APPROVED" }
                  : v
              ).filter(v => 
                (v.worker_id ? v.worker_id !== id : v.facility_id !== id)
              ));
            } catch (error: any) {
              console.log("=== APPROVE ERROR ===");
              console.log("Error message:", error.message);
              console.log("Error response:", error.response?.data);
              console.log("Error status:", error.response?.status);
              console.log("=== END ERROR ===");
              Alert.alert("Error", error.response?.data?.detail || "Failed to approve verification");
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id: string, fullName: string, isWorker: boolean = true) => {
    Alert.alert(
      "Reject Verification",
      `Are you sure you want to reject ${fullName}? They will need to resubmit.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessing(id);
              const token = await AsyncStorage.getItem("token");
              await axios.post(API_ENDPOINTS.ADMIN_APPROVE_VERIFICATION, {
                [isWorker ? "worker_id" : "facility_id"]: id,
                approved: false,
              }, {
                headers: token ? {
                  "Authorization": `Bearer ${token}`
                } : {}
              });
              Alert.alert("Rejected", `${fullName}'s verification was rejected`);
              fetchPendingVerifications();
            } catch (error: any) {
              Alert.alert("Error", "Failed to reject verification");
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleUnderReview = async (id: string, fullName: string, isWorker: boolean = true) => {
    Alert.alert(
      "Mark as Under Review",
      `Are you sure you want to mark ${fullName} as under review?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Under Review",
          style: "default",
          onPress: async () => {
            try {
              setProcessing(id);
              const token = await AsyncStorage.getItem("token");
              await axios.post(API_ENDPOINTS.ADMIN_APPROVE_VERIFICATION, {
                [isWorker ? "worker_id" : "facility_id"]: id,
                approved: "under_review",
              }, {
                headers: token ? {
                  "Authorization": `Bearer ${token}`
                } : {}
              });
              Alert.alert("Success", `${fullName} is now under review`);
              fetchPendingVerifications();
            } catch (error: any) {
              Alert.alert("Error", "Failed to mark as under review");
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const openDocument = (url: string | null) => {
    if (!url) {
      Alert.alert("No Document", "This document is not available");
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open document");
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>‹</Text>
          </TouchableOpacity>
          <Image
            source={require("../../assets/images/MedPost-Icon.png")}
            style={styles.headerLogo}
          />
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#00ced1" />
          <Text style={styles.loadingText}>Loading verifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
        <View style={styles.headerSpacer} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {verifications.length === 0 ? (
          <View style={[styles.centerContainer, { flex: 1 }]}>
            <Text style={styles.emptyText}>No pending verifications</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchPendingVerifications}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.container}>
            <View style={styles.pageHeader}>
              <Text style={styles.pageHeaderTitle}>Pending Verifications</Text>
              <Text style={styles.pageHeaderSubtitle}>
                {facilities.length} facilities • {workers.length} workers
              </Text>
            </View>

            {facilities.length > 0 && (
              <View>
                <Text style={styles.sectionHeader}>Facilities ({facilities.length})</Text>
                {facilities.map((verification) => (
                  <View key={verification.facility_id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.workerName}>{verification.legal_name}</Text>
                    <Text style={styles.workerTitle}>{verification.industry}</Text>
                  </View>

                  <Text style={styles.workerEmail}>{verification.email}</Text>

                  {verification.verification_submitted_at && (
                    <Text style={styles.submittedDate}>
                      Submitted: {new Date(verification.verification_submitted_at).toLocaleDateString()}
                    </Text>
                  )}

                  <View style={styles.documentsSection}>
                    <Text style={styles.sectionTitle}>Documents:</Text>

                    {verification.license_id && (
                      <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>License ID #:</Text>
                        <Text style={styles.licenseIdText}>{verification.license_id}</Text>
                      </View>
                    )}

                    <View style={styles.documentRow}>
                      <Text style={styles.documentLabel}>Business License/ID:</Text>
                      {verification.id_photo_url ? (
                        <TouchableOpacity onPress={() => openDocument(verification.id_photo_url)}>
                          <Image
                            source={{ uri: verification.id_photo_url }}
                            style={styles.thumbnail}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.noDocument}>Not provided</Text>
                      )}
                    </View>

                    {verification.profile_image_url && (
                      <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>Facility Logo:</Text>
                        <TouchableOpacity onPress={() => openDocument(verification.profile_image_url)}>
                          <Image
                            source={{ uri: verification.profile_image_url }}
                            style={styles.thumbnail}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View style={styles.actions}>
                    {verification.verification_status === "approved" ? (
                      <Text style={styles.approvedText}>Approved</Text>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.button, styles.rejectButton]}
                          onPress={() => handleReject(verification.facility_id!, verification.legal_name!, false)}
                          disabled={processing === verification.facility_id}
                        >
                          <Text style={styles.buttonText}>
                            {processing === verification.facility_id ? "..." : "Reject"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.approveButton]}
                          onPress={() => handleApprove(verification.facility_id!, verification.legal_name!, false)}
                          disabled={processing === verification.facility_id}
                        >
                          <Text style={styles.buttonText}>
                            {processing === verification.facility_id ? "..." : "Approve"}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {workers.length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>Workers ({workers.length})</Text>
              {workers.map((verification) => (
                <View key={verification.worker_id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.workerName}>{verification.full_name}</Text>
                    <Text style={styles.workerTitle}>{verification.title}</Text>
                  </View>

                  <Text style={styles.workerEmail}>{verification.email}</Text>

                  {verification.verification_submitted_at && (
                    <Text style={styles.submittedDate}>
                      Submitted: {new Date(verification.verification_submitted_at).toLocaleDateString()}
                    </Text>
                  )}

                  <View style={styles.documentsSection}>
                    <Text style={styles.sectionTitle}>Documents:</Text>

                    <View style={styles.documentRow}>
                      <Text style={styles.documentLabel}>Profile Photo:</Text>
                      {verification.profile_image_url ? (
                        <TouchableOpacity onPress={() => openDocument(verification.profile_image_url)}>
                          <Image
                            source={{ uri: verification.profile_image_url }}
                            style={styles.thumbnail}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.noDocument}>Not provided</Text>
                      )}
                    </View>

                    <View style={styles.documentRow}>
                      <Text style={styles.documentLabel}>Resume:</Text>
                      <TouchableOpacity onPress={() => openDocument(verification.resume_url)}>
                        <Text style={styles.documentLink}>
                          {verification.resume_url ? "View Resume" : "Not provided"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.documentRow}>
                      <Text style={styles.documentLabel}>Selfie:</Text>
                      {verification.selfie_url ? (
                        <TouchableOpacity onPress={() => openDocument(verification.selfie_url)}>
                          <Image
                            source={{ uri: verification.selfie_url }}
                            style={styles.thumbnail}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.noDocument}>Not provided</Text>
                      )}
                    </View>

                    <View style={styles.documentRow}>
                      <Text style={styles.documentLabel}>ID Photo:</Text>
                      {verification.id_photo_url ? (
                        <TouchableOpacity onPress={() => openDocument(verification.id_photo_url)}>
                          <Image
                            source={{ uri: verification.id_photo_url }}
                            style={styles.thumbnail}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.noDocument}>Not provided</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={() => handleReject(verification.worker_id!, verification.full_name!)}
                      disabled={processing === verification.worker_id}
                    >
                      <Text style={styles.buttonText}>
                        {processing === verification.worker_id ? "..." : "Reject"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.approveButton]}
                      onPress={() => handleApprove(verification.worker_id!, verification.full_name!)}
                      disabled={processing === verification.worker_id}
                    >
                      <Text style={styles.buttonText}>
                        {processing === verification.worker_id ? "..." : "Approve"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#00ced1",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#00ced1",
    borderBottomWidth: 1,
    borderBottomColor: "#00ced1",
  },
  backButton: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "300",
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 60,
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  pageHeader: {
    backgroundColor: "#00ced1",
    padding: 20,
  },
  pageHeaderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  pageHeaderSubtitle: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
    opacity: 0.9,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    color: "#00ced1",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#00ced1",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
    marginBottom: 10,
  },
  workerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  workerTitle: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 5,
  },
  workerEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  submittedDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 15,
  },
  documentsSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  documentLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  licenseIdText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  documentLink: {
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  noDocument: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#34C759",
  },
  rejectButton: {
    backgroundColor: "#FF3B30",
  },
  underReviewButton: {
    backgroundColor: '#deae11ff',
    borderWidth: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  approvedText: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

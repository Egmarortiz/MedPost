import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "../../components/BottomTab";
import { API_BASE_URL } from "../../config/api";

const formatDateDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    const parts = String(dateString).split("-");
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIndex = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return `${monthNames[monthIndex]} ${year}`;
    }
    return dateString;
  } catch {
    return String(dateString);
  }
};

export default function WorkerDetailPage() {
  const { workerId } = useLocalSearchParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [endorsementNote, setEndorsementNote] = useState("");
  const [submittingEndorsement, setSubmittingEndorsement] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userTypeStr = await AsyncStorage.getItem("userType");
        setUserType(userTypeStr);

        if (!token || !workerId) {
          Alert.alert("Error", "Missing required information");
          setLoading(false);
          return;
        }

        const [workerRes, endorsementsRes, experiencesRes] = await Promise.all([
          axios.get(
            `${API_BASE_URL}/v1/workers/${workerId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axios.get(
            `${API_BASE_URL}/v1/endorsements/workers/${workerId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).catch(() => ({ data: [] })), 
          axios.get(
            `${API_BASE_URL}/v1/workers/${workerId}/experiences`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).catch(() => ({ data: [] })), // If experiences endpoint fails, default empty array
        ]);

        const workerData = workerRes.data;
        workerData.endorsements = endorsementsRes.data || [];
        workerData.experiences = experiencesRes.data || [];
        setWorker(workerData);
      } catch (error: any) {
        console.error("Error fetching worker:", error);
        Alert.alert("Error", "Could not load worker profile");
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  const handleSubmitEndorsement = async () => {
    if (!endorsementNote.trim()) {
      Alert.alert("Error", "Please enter an endorsement note");
      return;
    }

    if (endorsementNote.length > 500) {
      Alert.alert("Error", "Endorsement note cannot exceed 500 characters");
      return;
    }

    setSubmittingEndorsement(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Not authenticated");
        setSubmittingEndorsement(false);
        return;
      }

      console.log("Submitting endorsement to:", `${API_BASE_URL}/v1/endorsements/`);
      console.log("Payload:", { worker_id: workerId, note: endorsementNote.trim() });

      const response = await axios.post(
        `${API_BASE_URL}/v1/endorsements/`,
        {
          worker_id: workerId,
          note: endorsementNote.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Endorsement response:", response.data);
      Alert.alert("Success", "Endorsement submitted successfully!");
      setEndorsementNote("");
      
      // Refresh endorsements to show new endorsement
      const endorsementsRes = await axios.get(
        `${API_BASE_URL}/v1/endorsements/workers/${workerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorker((prevWorker: any) => ({
        ...prevWorker,
        endorsements: endorsementsRes.data || [],
      }));
    } catch (error: any) {
      console.error("Error submitting endorsement:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert("Error", error.response?.data?.detail || error.message || "Failed to submit endorsement");
    } finally {
      setSubmittingEndorsement(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Worker not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
        <View style={styles.headerSpacer} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container}>
          {/* Header Card */}
          <View style={styles.headerCard}>
            {worker.profile_image_url ? (
              <Image
                source={{ uri: worker.profile_image_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>
                  {worker.full_name?.charAt(0) || "?"}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{worker.full_name || "Unknown"}</Text>
            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>{worker.title || "Healthcare Professional"}</Text>
            </View>
          </View>

          {/* About Section */}
          {worker.bio && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              <Text style={styles.bioText}>{worker.bio}</Text>
            </View>
          )}

          {/* Professional Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Professional Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Title:</Text>
              <Text style={styles.value}>{worker.title || "Not specified"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Education:</Text>
              <Text style={styles.value}>{worker.education_level || "Not specified"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Verification Status:</Text>
              {(worker.verification_status === 'VERIFIED' || worker.verification_status === 'COMPLETED') ? (
                <View style={[styles.statusBadge, styles.verifiedBadge]}>
                  <Text style={[styles.statusText, { color: '#155724' }]}>Verified</Text>
                </View>
              ) : worker.verification_status === 'PENDING' ? (
                <View style={[styles.statusBadge, styles.pendingBadge]}>
                  <Text style={[styles.statusText, { color: '#856404' }]}>Under Review</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.unverifiedBadge]}>
                  <Text style={[styles.statusText, { color: '#721c24' }]}>Pending</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationDetails}>
                <Text style={styles.locationText}>
                  {worker.city || "City not specified"}
                  {worker.city && worker.state_province ? ", " : ""}
                  {worker.state_province || ""}
                </Text>
                {worker.postal_code && (
                  <Text style={styles.postalText}>Postal Code: {worker.postal_code}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Resume Section */}
          {worker.resume_url && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resume</Text>
              <TouchableOpacity 
                style={styles.resumeButton}
                onPress={() => Linking.openURL(worker.resume_url)}
              >
                <Text style={styles.resumeButtonText}>View Resume</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Experience Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Experience</Text>
            {worker.experiences && worker.experiences.length > 0 ? (
              worker.experiences.map((exp: any) => (
                <View key={exp.id} style={styles.experienceItem}>
                  <Text style={styles.experiencePosition}>{exp.position_title}</Text>
                  <Text style={styles.experienceCompany}>{exp.company_name}</Text>
                  <Text style={styles.experienceDate}>
                    {formatDateDisplay(exp.start_date)} - {exp.end_date ? formatDateDisplay(exp.end_date) : 'Present'}
                  </Text>
                  {exp.description && (
                    <Text style={styles.experienceDescription}>{exp.description}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noExperience}>No experience added yet.</Text>
            )}
          </View>

          {/* Contact Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{worker.email || "Not specified"}</Text>
            </View>
            {worker.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{worker.phone}</Text>
              </View>
            )}
          </View>

          {/* Endorsements Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Endorsements</Text>

            {userType === "facility" && (
              <View style={styles.endorsementFormContainer}>
                <Text style={styles.endorsementFormSubtitle}>
                  Share your experience working with {worker.full_name}
                </Text>
                <TextInput
                  style={styles.endorsementInput}
                  placeholder="Write your endorsement (max 500 characters)..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={endorsementNote}
                  onChangeText={setEndorsementNote}
                  editable={!submittingEndorsement}
                />
                <Text style={styles.characterCount}>
                  {endorsementNote.length}/500
                </Text>
                <TouchableOpacity
                  style={[
                    styles.submitEndorsementButton,
                    (!endorsementNote.trim() || submittingEndorsement) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmitEndorsement}
                  disabled={!endorsementNote.trim() || submittingEndorsement}
                >
                  <Text style={styles.submitEndorsementButtonText}>
                    {submittingEndorsement ? "Submitting..." : "Submit"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Endorsements List */}
            {worker.endorsements && worker.endorsements.length > 0 ? (
              worker.endorsements.map((endorsement: any) => (
                <View key={endorsement.id} style={styles.endorsementItem}>
                  <Text style={styles.endorsementFacility}>
                    {endorsement.facility_name || "Healthcare Facility"}
                  </Text>
                  {endorsement.note && (
                    <Text style={styles.endorsementNote}>{endorsement.note}</Text>
                  )}
                  <Text style={styles.endorsementDate}>
                    {endorsement.created_at ? (
                      (() => {
                        try {
                          const date = new Date(endorsement.created_at);
                          return isNaN(date.getTime()) ? endorsement.created_at : date.toLocaleDateString();
                        } catch (e) {
                          return endorsement.created_at;
                        }
                      })()
                    ) : "Date not available"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noEndorsements}>No endorsements yet</Text>
            )}
          </View>

          {/* Member Since Section */}
          {worker.created_at && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Member Since</Text>
              <Text style={styles.dateText}>
                {new Date(worker.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomTab userType={userType as "worker" | "facility"} active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  verifiedBadge: {
    backgroundColor: "#d4edda",
  },
  pendingBadge: {
    backgroundColor: "#fff3cd",
  },
  unverifiedBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#2c3e50",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  postalText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  resumeButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  resumeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  experienceItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 4,
    fontWeight: "500",
  },
  experienceDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  experienceDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  noExperience: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  bioText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    fontStyle: "italic",
  },
  endorsementItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  endorsementFacility: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  endorsementNote: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 4,
  },
  endorsementDate: {
    fontSize: 12,
    color: "#999",
  },
  noEndorsements: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  endorsementFormSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },
  endorsementInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2c3e50",
    backgroundColor: "#fff",
    marginBottom: 8,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
    textAlign: "right",
  },
  endorsementFormContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 16,
    marginBottom: 16,
  },
  submitEndorsementButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#00ced1",
    opacity: 0.5,
  },
  submitEndorsementButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  safeContainer: {
    flex: 1,
    backgroundColor: "#00ced1",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#00ced1",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  imageLoader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    color: "#00ced1",
    fontWeight: "600",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#00ced1"
  },
  placeholderImage: {
    backgroundColor: "#00ced1",
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff"
  },
  titleBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00ced1",
    alignContent: "center",
  },
  titleText: {
    color: "#00ced1",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#00ced1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

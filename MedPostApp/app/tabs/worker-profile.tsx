import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Cross-platform storage helper
const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.localStorage.getItem(key));
  } else {
    return AsyncStorage.getItem(key);
  }
};
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import BottomTab from "../../components/BottomTab";

const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, monthRaw] = dateString.split("-");
    const month = monthRaw.padStart(2, "0").slice(0, 2);
    const monthIndex = Math.max(0, Math.min(11, parseInt(month, 10) - 1));
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return `Invalid ${year}`;
    return `${monthNames[monthIndex]} ${year}`;
  } catch {
    return dateString;
  }
};

// Reusable view for rendering worker profile content
export function WorkerProfileView({ worker, endorsements = [], router }: { worker: any; endorsements?: any[]; router?: any }) {
  if (!worker) return null;

  return (
    <>
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

      {worker.bio && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.bioText}>{worker.bio}</Text>
        </View>
      )}

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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Experience</Text>
        {worker.experiences && worker.experiences.length > 0 ? (
          worker.experiences.map((exp: any) => (
            <View key={exp.id} style={styles.experienceItem}>
              <Text style={styles.experiencePosition}>{exp.position_title}</Text>
              <Text style={styles.experienceCompany}>{exp.company_name}</Text>
              <Text style={styles.experienceDate}>
                {formatDateDisplay(exp.start_date)}
                {' - '}
                {exp.end_date 
                  ? formatDateDisplay(exp.end_date)
                  : 'Present'}
              </Text>
              {exp.description && (
                <Text style={styles.experienceDescription}>{exp.description}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noExperience}>No work experience added yet</Text>
        )}
        <TouchableOpacity 
          style={styles.addExperienceButton}
          onPress={() => router.push('/(tabs)/worker-experience')}
        >
          <Text style={styles.addExperienceButtonText}>+ Add Experience</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{worker.email}</Text>
        </View>
        {worker.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{worker.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Endorsements</Text>
        {endorsements.length > 0 ? (
          endorsements.map((endorsement: any) => (
            <View key={endorsement.id} style={styles.endorsementItem}>
              <Text style={styles.endorsementFacility}>
                {endorsement.facility_name || "Healthcare Facility"}
              </Text>
              {endorsement.note && (
                <Text style={styles.endorsementNote}>{endorsement.note}</Text>
              )}
              <Text style={styles.endorsementDate}>
                {new Date(endorsement.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEndorsements}>No endorsements yet</Text>
        )}
      </View>

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
    </>
  );
}

export default function WorkerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
  const token = await getStorageItem("token");
      
      let url: string;
      if (id) {
        url = `${API_ENDPOINTS.WORKER_PROFILE.replace('/me', '')}/${id}`;
      } else {
        url = API_ENDPOINTS.WORKER_PROFILE;
      }
      
      console.log("Fetching from:", url);
      
      const response = await axios.get(url, {
        headers: token ? {
          "Authorization": `Bearer ${token}`
        } : {}
      });
      
      console.log("Worker profile loaded:", response.data);
      console.log("Experiences:", response.data.experiences);
      setWorker(response.data);

      const endorsementsUrl = `${API_ENDPOINTS.ENDORSEMENTS_FOR_WORKER}/${response.data.id}`;
      console.log("Fetching endorsements from:", endorsementsUrl);
      
      const endorsementsResponse = await axios.get(endorsementsUrl, {
        headers: token ? {
          "Authorization": `Bearer ${token}`
        } : {}
      });
      
      console.log("Endorsements loaded:", endorsementsResponse.data);
  setEndorsements(Array.isArray(endorsementsResponse.data) ? endorsementsResponse.data : []);
    } catch (error: any) {
      console.error("Error loading worker profile:", error?.response?.data || error);
      const errorMsg = error?.response?.data?.detail || "Could not load profile. Please try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Worker not found.</Text>
        <Text style={styles.subText}>Please register or try again.</Text>
      </View>
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
        <ScrollView style={styles.container}>
          <WorkerProfileView worker={worker} endorsements={endorsements} router={router} />

          <TouchableOpacity 
            style={styles.updateProfileButton}
            onPress={() => router.push('/(tabs)/worker-update')}
          >
            <Text style={styles.updateProfileButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <BottomTab userType="worker" active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#00ced1",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#00ced1",
    borderBottomWidth: 1,
    borderBottomColor: "#00ced1",
  },
  backButton: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    textAlign: "center",
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  headerSpacer: {
    width: 60,
  },
  container: { 
    flex: 1,
    flexGrow: 1,
    backgroundColor: "#fff" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8f9fa"
  },
  
  headerCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  name: { 
    fontSize: 24, 
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center"
  },
  titleBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00ced1"
  },
  titleText: {
    color: "#00ced1",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
  addExperienceButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  addExperienceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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

  dateText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },

  updateProfileButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 20,
  },
  updateProfileButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  errorText: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#dc3545" 
  },
  subText: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 10,
    textAlign: "center"
  },
});

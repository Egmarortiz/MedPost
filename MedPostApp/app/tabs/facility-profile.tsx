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
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import BottomTab from "../../components/BottomTab";

const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.localStorage.getItem(key));
  } else {
    return AsyncStorage.getItem(key);
  }
};

// Reusable view for rendering facility profile content 
export function FacilityProfileView({ facility, jobs = [] }: { facility: any; jobs?: any[] }) {
  if (!facility) return null;

  return (
    <>
      <View style={styles.headerCard}>
        <View>
          {facility.profile_image_url ? (
            <Image
              source={{ uri: facility.profile_image_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>{facility.legal_name?.charAt(0) || "?"}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{facility.legal_name || "Unknown"}</Text>
        <View style={styles.industryBadge}>
          <Text style={styles.industryText}>{facility.industry || "Healthcare"}</Text>
        </View>
      </View>

      {facility.bio && typeof facility.bio === 'string' && facility.bio.trim().length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.bioText}>{facility.bio}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Facility Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Industry:</Text>
          <Text style={styles.value}>{facility.industry ? String(facility.industry) : "Not specified"}</Text>
        </View>

        {facility.founded_year ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Founded:</Text>
            <Text style={styles.value}>{String(facility.founded_year)}</Text>
          </View>
        ) : null}

        {facility.company_size_min && facility.company_size_max ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Size:</Text>
            <Text style={styles.value}>{`${String(facility.company_size_min)} - ${String(facility.company_size_max)} employees`}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Verification Status:</Text>
          {facility.is_verified ? (
            <View style={[styles.statusBadge, styles.verifiedBadge]}>
              <Text style={[styles.statusText, { color: '#155724' }]}>Verified</Text>
            </View>
          ) : facility.id_photo_url ? (
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
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>{facility.hq_address_line1 || "Address not specified"}</Text>
            {facility.hq_address_line2 && (<Text style={styles.locationText}>{facility.hq_address_line2}</Text>)}
            <Text style={styles.locationText}>{facility.hq_city && facility.hq_state_province ? `${facility.hq_city}, ${facility.hq_state_province}` : facility.hq_city || facility.hq_state_province || "Location not specified"}</Text>
            {facility.hq_postal_code && (<Text style={styles.postalText}>Postal Code: {facility.hq_postal_code}</Text>)}
            {facility.hq_country && (<Text style={styles.postalText}>Country: {facility.hq_country}</Text>)}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{facility.phone_e164 || "Not available"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Job Postings</Text>
        {jobs && jobs.length > 0 ? (
          jobs.map((job: any) => (
            <View key={job.id} style={styles.jobItem}>
              <Text style={styles.jobPosition}>{job.position_title}</Text>
              <Text style={styles.jobCompany}>{job.employment_type?.replace("_", " ")} • {job.compensation_type}</Text>
              {job.city && job.state_province && (<Text style={styles.jobLocation}>{job.city}, {job.state_province}</Text>)}
              <View style={[styles.statusBadge, job.is_active ? styles.activeJobBadge : styles.closedJobBadge]}>
                <Text style={[styles.statusText, { color: job.is_active ? '#155724' : '#721c24' }]}>{job.is_active ? "Active" : "Closed"}</Text>
              </View>
              {job.description && (<Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>)}
            </View>
          ))
        ) : (
          <Text style={styles.noJobs}>No job postings yet</Text>
        )}
      </View>

      <View style={styles.spacer} />
    </>
  );
}

export default function FacilityProfile() {
  const router = useRouter();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const storageToken = await getStorageItem("token");

      const response = await axios.get(API_ENDPOINTS.FACILITY_PROFILE, {
        headers: storageToken ? { Authorization: `Bearer ${storageToken}` } : {},
      });

      setFacility(response.data);

      const jobsResponse = await axios.get(API_ENDPOINTS.JOBS_LIST, {
        headers: storageToken ? { Authorization: `Bearer ${storageToken}` } : {},
      });

      const facilityJobs = Array.isArray(jobsResponse.data)
        ? jobsResponse.data.filter((job: any) => job.facility_id === response.data.id)
        : [];

      setJobs(facilityJobs || []);

      if (!response.data.is_verified && !response.data.id_photo_url) {
        router.replace("/(tabs)/facility-verification");
        return;
      }
    } catch (error: any) {
      console.error("Error loading facility profile:", error?.response?.data || error);
      const errorMsg = error?.response?.data?.detail || "Could not load profile. Please try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  if (!facility) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Facility not found.</Text>
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
        <Image source={require("../../assets/images/MedPost-Icon.png")} style={styles.headerLogo} />
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container}>
        <FacilityProfileView facility={facility} jobs={jobs} />

        <TouchableOpacity style={styles.updateProfileButton} onPress={() => router.push("/(tabs)/facility-update")}>
          <Text style={styles.updateProfileButtonText}>Update Profile</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomTab userType="facility" active="profile" />
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
  headerSpacer: {
    width: 60,
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc3545",
  },
  subText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: "#fff",
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
    borderColor: "#00ced1",
  },
  placeholderImage: {
    backgroundColor: "#00ced1",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  industryBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00ced1",
  },
  industryText: {
    color: "#00ced1",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  bioText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    fontStyle: "italic",
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  activeJobBadge: {
    backgroundColor: "#d4edda",
  },
  closedJobBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#2c3e50",
  },
  jobItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  jobPosition: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 4,
    fontWeight: "500",
  },
  jobLocation: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  noJobs: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  addJobButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  addJobButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  spacer: {
    height: 40,
  },
});

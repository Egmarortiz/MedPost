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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "../../components/BottomTab";
import { API_BASE_URL } from "../../config/api";

export default function FacilityDetailPage() {
  const { facilityId } = useLocalSearchParams();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userTypeStr = await AsyncStorage.getItem("userType");
        setUserType(userTypeStr);

        if (!token || !facilityId) {
          Alert.alert("Error", "Missing required information");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/v1/facilities/${facilityId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFacility(response.data);

        // Fetch jobs for this facility
        const jobsResponse = await axios.get(`${API_BASE_URL}/v1/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const facilityJobs = Array.isArray(jobsResponse.data)
          ? jobsResponse.data.filter((job: any) => job.facility_id === response.data.id)
          : [];
        setJobs(facilityJobs || []);
      } catch (error: any) {
        console.error("Error fetching facility:", error);
        Alert.alert("Error", "Could not load facility profile");
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [facilityId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  if (!facility) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Facility not found</Text>
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
      <View style={[styles.header, { justifyContent: 'center' }]}> 
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 15 }}>
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
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{job.position_title}</Text>
                  {job.is_active && (
                    <View style={[styles.statusBadge, styles.activeBadge]}>
                      <Text style={[styles.statusText, { color: '#155724' }]}>Active</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.jobDetail}>
                  {job.employment_type ? job.employment_type.replace("_", " ") : "N/A"} • {job.compensation_type || "N/A"}
                </Text>
                {(() => {
                  let min, max;
                  if (job.compensation_type === 'HOURLY') {
                    min = job.hourly_min;
                    max = job.hourly_max;
                  } else if (job.compensation_type === 'MONTHLY') {
                    min = job.monthly_min;
                    max = job.monthly_max;
                  } else if (job.compensation_type === 'YEARLY') {
                    min = job.yearly_min;
                    max = job.yearly_max;
                  }
                  if (min || max) {
                    return (
                      <Text style={styles.compensationDisplay}>
                        ${min}
                        {max && min !== max ? ` - $${max}` : ""}
                      </Text>
                    );
                  }
                  return null;
                })()}
                {job.city && job.state_province && (
                  <Text style={styles.jobLocation}>📍 {job.city}, {job.state_province}</Text>
                )}
                {job.description && (
                  <Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noJobs}>No job postings yet</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Member Since</Text>
          {facility.created_at ? (
            <Text style={styles.dateText}>
              {new Date(facility.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          ) : (
            <Text style={styles.dateText}>Not available</Text>
          )}
        </View>
      </ScrollView>
      <BottomTab userType={userType as "worker" | "facility"} active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  jobHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  postJobButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  postJobButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  jobCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 10,
  },
  jobDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  compensationDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 12,
  },
  activeBadge: {
    backgroundColor: "#d4edda",
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
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
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
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
    color: "#aaa",
    fontWeight: "bold",
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
  industry: {
    fontSize: 16,
    color: "#00ced1",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
  },
  value: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
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
  dateText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
});

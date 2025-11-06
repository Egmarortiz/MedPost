import React, { useEffect, useState, useCallback } from "react";
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
  Modal,
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
export function FacilityProfileView({ facility, jobs = [], applications = [], setApplications, updateApplicationStatus }: { facility: any; jobs?: any[]; applications?: any[]; setApplications?: any; updateApplicationStatus?: any }) {
  const router = useRouter();
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
        <View style={styles.jobHeaderContainer}>
          <Text style={styles.cardTitle}>Job Postings</Text>
          <TouchableOpacity 
            style={styles.postJobButton}
            onPress={() => router.push("/(tabs)/job-post")}
          >
            <Text style={styles.postJobButtonText}>+ Post Job</Text>
          </TouchableOpacity>
        </View>
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

      {/* Job Applications Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Applications</Text>
        {applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <View
              key={app.id}
              style={styles.applicationCard}
            >
              <Text style={styles.applicationTitle}>
                {app.position_title || app.job_post?.position_title || app.position?.title || 'Job Position'}
              </Text>
              <Text style={styles.applicationDetail}>
                Applicant: {app.worker?.full_name || app.worker_name || 'Unknown'}
              </Text>
              {app.worker?.title && (
                <Text style={styles.applicationDetail}>
                  Title: {app.worker.title}
                </Text>
              )}
              {(app.email || app.worker?.email) && (
                <Text style={styles.applicationDetail}>
                  Email: {app.email || app.worker?.email}
                </Text>
              )}
              {(app.phone_e164 || app.worker?.phone_e164 || app.worker?.phone || app.worker?.phone_number) && (
                <Text style={styles.applicationDetail}>
                  Phone: {app.phone_e164 || app.worker?.phone_e164 || app.worker?.phone || app.worker?.phone_number}
                </Text>
              )}
              {app.cover_letter && (
                <Text style={styles.applicationDetail}>
                  Cover Letter: {app.cover_letter}
                </Text>
              )}
              
              {/* Status Modal Button */}
              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>Status:</Text>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => {
                    setApplications((prev: any) =>
                      prev.map((a: any) =>
                        a.id === app.id ? { ...a, modalOpen: true } : a
                      )
                    );
                  }}
                >
                  <Text style={styles.statusButtonText}>{app.status}</Text>
                  <Text style={styles.statusButtonArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Status Modal */}
              <Modal
                visible={app.modalOpen || false}
                transparent={true}
                animationType="fade"
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  onPress={() => {
                    setApplications((prev: any) =>
                      prev.map((a: any) =>
                        a.id === app.id ? { ...a, modalOpen: false } : a
                      )
                    );
                  }}
                >
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Status</Text>
                    {["SUBMITTED", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.modalOption,
                          app.status === status && styles.modalOptionSelected,
                        ]}
                        onPress={() => {
                          updateApplicationStatus(app.id, status);
                          setApplications((prev: any) =>
                            prev.map((a: any) =>
                              a.id === app.id ? { ...a, modalOpen: false } : a
                            )
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.modalOptionText,
                            app.status === status && styles.modalOptionTextSelected,
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {app.created_at && (
                <Text style={styles.applicationDetail}>Applied: {new Date(app.created_at).toLocaleDateString()}</Text>
              )}
              {app.answer_text && (
                <Text style={styles.applicationDetail}>Answer: {app.answer_text}</Text>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (app.worker_id) {
                    router.push({ pathname: "/(tabs)/worker-detail", params: { workerId: app.worker_id } });
                  } else {
                    Alert.alert("Error", "Worker information not available");
                  }
                }}
              >
                <Text style={styles.viewDetailText}>Tap to view full profile →</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noJobs}>No applications received yet</Text>
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

      <View style={styles.spacer} />
    </>
  );
}

export default function FacilityProfile() {
  const router = useRouter();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

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

      // Fetch job applications for this facility
      const appsResponse = await axios.get(API_ENDPOINTS.JOB_APPLICATIONS_FACILITY, {
        headers: storageToken ? { Authorization: `Bearer ${storageToken}` } : {},
      });
      
      // Fetch worker details for each application
      let appsWithWorkers = Array.isArray(appsResponse.data) ? appsResponse.data : [];
      if (appsWithWorkers.length > 0) {
        appsWithWorkers = await Promise.all(
          appsWithWorkers.map(async (app: any) => {
            let appData = { ...app };
            
            if (app.worker_id) {
              try {
                const workerRes = await axios.get(`${API_ENDPOINTS.WORKERS_LIST}${app.worker_id}`, {
                  headers: storageToken ? { Authorization: `Bearer ${storageToken}` } : {},
                });
                appData.worker = workerRes.data;
              } catch (err) {
                console.warn(`Failed to fetch worker ${app.worker_id}:`, err);
              }
            }
            
            // Fetch job posting details
            if (app.job_post_id) {
              try {
                const jobRes = await axios.get(`${API_ENDPOINTS.JOBS_LIST}${app.job_post_id}`, {
                  headers: storageToken ? { Authorization: `Bearer ${storageToken}` } : {},
                });
                appData.job_post = jobRes.data;
                appData.position_title = jobRes.data.position_title;
              } catch (err) {
                console.warn(`Failed to fetch job posting ${app.job_post_id}:`, err);
              }
            }
            
            return appData;
          })
        );
      }
      setApplications(appsWithWorkers);

      // Redirect to verification if facility hasnt submitted documents
      if (!response.data.id_photo_url) {
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

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    try {
      const storageToken = await getStorageItem("token");
      await axios.patch(
        `${API_ENDPOINTS.JOB_APPLICATION_UPDATE_STATUS}/${appId}/status`,
        { status: newStatus },
        {
          headers: storageToken ? { Authorization: `Bearer ${storageToken}` } : {},
        }
      );
      
      // Update local state
      setApplications((prev: any[]) =>
        prev.map((app: any) =>
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );
      Alert.alert("Success", "Application status updated");
    } catch (error: any) {
      console.error("Failed to update application status:", error);
      console.error("Error details:", error.response?.data);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              if (Platform.OS === "web") {
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("userType");
              } else {
                await AsyncStorage.removeItem("token");
                await AsyncStorage.removeItem("userType");
              }
              // Navigate to login
              router.replace("/(tabs)/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout");
            }
          },
          style: "destructive",
        },
      ]
    );
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
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.backButton}>⏻</Text>
        </TouchableOpacity>
        <Image source={require("../../assets/images/MedPost-Icon.png")} style={styles.headerLogo} />
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container}>
        <FacilityProfileView 
          facility={facility} 
          jobs={jobs} 
          applications={applications}
          setApplications={setApplications}
          updateApplicationStatus={updateApplicationStatus}
        />

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
    fontSize: 18,
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
  spacer: {
    height: 40,
  },
  applicationCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 8,
  },
  applicationDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  statusSection: {
    marginTop: 12,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  statusButtonArrow: {
    fontSize: 12,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionSelected: {
    backgroundColor: "#e0f7fa",
  },
  modalOptionText: {
    fontSize: 14,
    color: "#666",
  },
  modalOptionTextSelected: {
    color: "#00ced1",
    fontWeight: "600",
  },
  viewDetailText: {
    fontSize: 13,
    color: "#00ced1",
    fontWeight: "600",
    marginTop: 8,
  },
  dateText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
});

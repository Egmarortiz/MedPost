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
import { MaterialIcons } from "@expo/vector-icons";

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

const getApplicationStatusStyle = (status: string): any => {
  switch (status) {
    case "SUBMITTED":
      return { backgroundColor: "#e3f2fd" };
    case "REVIEWED":
      return { backgroundColor: "#fff3e0" };
    case "SHORTLISTED":
      return { backgroundColor: "#f3e5f5" };
    case "REJECTED":
      return { backgroundColor: "#ffebee" };
    case "HIRED":
      return { backgroundColor: "#e8f5e9" };
    default:
      return { backgroundColor: "#f5f5f5" };
  }
};

const getApplicationStatusTextColor = (status: string): any => {
  switch (status) {
    case "SUBMITTED":
      return { color: "#1976d2" };
    case "REVIEWED":
      return { color: "#f57c00" };
    case "SHORTLISTED":
      return { color: "#7b1fa2" };
    case "REJECTED":
      return { color: "#c62828" };
    case "HIRED":
      return { color: "#388e3c" };
    default:
      return { color: "#666" };
  }
};

// Reusable view for rendering worker profile content
export function WorkerProfileView({ worker, endorsements = [], router }: { worker: any; endorsements?: any[]; router?: any }) {
  if (!worker) return null;

  console.log('DEBUG: worker.verification_status =', worker.verification_status);

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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={20} color="#00ced1" />
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
    </>
  );
}

export default function WorkerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
  const token = await getStorageItem("token");
      
      let url: string;
      if (typeof id === 'string' && id.trim().length > 0 && id !== 'undefined' && id !== 'null') {
        url = `${API_ENDPOINTS.WORKER_PROFILE.replace('/me', '')}/${id}`;
      } else {
        url = API_ENDPOINTS.WORKER_PROFILE;
      }
      console.log("[WorkerProfile] id:", id, "url:", url);
      const response = await axios.get(url, {
        headers: token ? {
          "Authorization": `Bearer ${token}`
        } : {}
      });
      
      console.log("Worker profile loaded:", response.data);
      console.log("Experiences from API:", response.data.experiences);
      console.log("Experiences type:", typeof response.data.experiences);
      console.log("Experiences length:", Array.isArray(response.data.experiences) ? response.data.experiences.length : "not array");
      setWorker(response.data);
      
      // Use experiences from the worker profile response
      setExpLoading(true);
      try {
        setExperiences(Array.isArray(response.data.experiences) ? response.data.experiences : []);
        console.log("Experiences set from profile:", response.data.experiences);
      } catch (expErr) {
        console.error("Error setting experiences:", expErr);
        setExperiences([]);
      } finally {
        setExpLoading(false);
      }

      // Use credentials from the worker profile response
      try {
        setCredentials(Array.isArray(response.data.credentials) ? response.data.credentials : []);
        console.log("Credentials set from profile:", response.data.credentials);
      } catch (credErr) {
        console.error("Error setting credentials:", credErr);
        setCredentials([]);
      }

      const endorsementsUrl = `${API_ENDPOINTS.ENDORSEMENTS_FOR_WORKER}/${response.data.id}`;
      console.log("Fetching endorsements from:", endorsementsUrl);
      
      const endorsementsResponse = await axios.get(endorsementsUrl, {
        headers: token ? {
          "Authorization": `Bearer ${token}`
        } : {}
      });
        
      console.log("Endorsements loaded:", endorsementsResponse.data);
  setEndorsements(Array.isArray(endorsementsResponse.data) ? endorsementsResponse.data : []);

      // Fetch job applications 
      if (!id || id === 'undefined' || id === 'null') {
        try {
          const applicationsResponse = await axios.get(`${API_ENDPOINTS.JOB_APPLICATIONS_WORKER}`, {
            headers: token ? {
              "Authorization": `Bearer ${token}`
            } : {}
          });
          
          let appsData = Array.isArray(applicationsResponse.data) ? applicationsResponse.data : [];
          
          // Fetch full job details for each application
          if (appsData.length > 0) {
            appsData = await Promise.all(
              appsData.map(async (app: any) => {
                if (app.job_post_id) {
                  try {
                    const jobRes = await axios.get(`${API_ENDPOINTS.JOB_GET}${app.job_post_id}`, {
                      headers: token ? {
                        "Authorization": `Bearer ${token}`
                      } : {}
                    });
                    let job = jobRes.data;
                    // Also fetch facility details
                    try {
                      if (job?.facility_id) {
                        const facRes = await axios.get(`${API_ENDPOINTS.FACILITIES_LIST}/${job.facility_id}`, {
                          headers: token ? { "Authorization": `Bearer ${token}` } : {}
                        });
                        job = { ...job, legal_name: facRes.data?.legal_name, facility: facRes.data };
                      }
                    } catch (facErr) {
                      console.warn(`Failed to fetch facility for job ${app.job_post_id}:`, facErr);
                    }
                    return { ...app, job_post: job };
                  } catch (err) {
                    console.warn(`Failed to fetch job ${app.job_post_id}:`, err);
                    return app;
                  }
                }
                return app;
              })
            );
          }
          
          setApplications(appsData);
          console.log("Applications loaded with job details:", appsData);
        } catch (appError: any) {
          console.warn("Error loading applications:", appError?.message);
          setApplications([]);
        }
      }
    } catch (error: any) {
      console.error("Error loading worker profile:", error?.response?.data || error);
      const errorMsg = error?.response?.data?.detail || "Could not load profile. Please try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
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
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Text style={styles.backButton}>⏻</Text>
        </TouchableOpacity>
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
        <View style={styles.headerButton} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container}>
          {/* Profile Card and Info */}
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

                    <View style={styles.card}>
            <View style={styles.experienceHeaderContainer}>
              <Text style={styles.cardTitle}>Experience</Text>
              <TouchableOpacity 
                style={styles.addExperienceButton}
                onPress={() => router.push('/(tabs)/worker-experience')}
              >
                <Text style={styles.addExperienceButtonText}>+ Add Experience</Text>
              </TouchableOpacity>
            </View>
            {expLoading ? (
              <Text style={styles.noExperience}>Loading...</Text>
            ) : experiences && experiences.length > 0 ? (
              experiences.map((exp: any) => (
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
            {worker.email && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{worker.email}</Text>
              </View>
            )}
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

          {/* Job Applications Section */}
          {applications && applications.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Job Applications</Text>
              {applications.map((app: any) => {
                const job = app.job_post || {};
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
                return (
                  <View key={app.id} style={styles.applicationItem}>
                    <View style={styles.applicationHeader}>
                      <Text style={styles.applicationJobTitle}>
                        {job.position_title || "Job Position"}
                      </Text>
                      <View style={[styles.statusBadge, getApplicationStatusStyle(app.status)]}>
                        <Text style={[styles.statusText, getApplicationStatusTextColor(app.status)]}>
                          {app.status}
                        </Text>
                      </View>
                    </View>
                    {/* Facility Name */}
                    {job.legal_name && (
                      <Text style={styles.applicationFacility}>
                        {job.legal_name}
                      </Text>
                    )}
                    <Text style={styles.jobDetail}>
                      {job.employment_type ? job.employment_type.replace("_", " ") : "N/A"} • {job.compensation_type || "N/A"}
                    </Text>
                    {(min || max) && (
                      <Text style={styles.compensationDisplay}>
                        ${min}
                        {max && min !== max ? ` - $${max}` : ""}
                      </Text>
                    )}
                    {job.city && job.state_province && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <MaterialIcons name="location-on" size={18} color="#00ced1" style={{ marginTop: -2 }} />
                        <Text style={styles.jobLocation}>{job.city}, {job.state_province}</Text>
                      </View>
                    )}
                    {job.description && (
                      <Text style={styles.jobDescription} numberOfLines={2}>
                        {job.description}
                      </Text>
                    )}
                    <Text style={styles.applicationDate}>
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

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


          {/* Update Profile Button */}
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
    fontSize: 20,
    color: "#fff",
    fontWeight: "300",
    paddingHorizontal: 8,
  },
  headerButton: {
    width: 60,
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
  experienceHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
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

  credentialItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  credentialOrganization: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 4,
    fontWeight: "500",
  },
  credentialDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  credentialId: {
    fontSize: 12,
    color: "#666",
  },
  noCredentials: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  addCredentialsButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  addCredentialsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  documentLink: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    alignItems: "center",
  },
  documentLinkText: {
    color: "#1976d2",
    fontSize: 14,
    fontWeight: "600",
  },

  applicationItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  applicationJobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  applicationFacility: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 6,
  },
  jobDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  jobLocation: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 8,
    lineHeight: 20,
  },
  jobDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
    lineHeight: 20,
  },
  compensationDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 8,
    lineHeight: 22,
  },
  applicationDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
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

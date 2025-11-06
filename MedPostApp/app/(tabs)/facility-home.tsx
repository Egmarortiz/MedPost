import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "../../components/BottomTab";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { FacilityProfileView } from "./facility-profile";
import { WorkerProfileView } from "./worker-profile";

// Worker Card Component
function WorkerCard({
  worker,

  onPress,
}: {
  worker: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.workerCard} onPress={onPress}>
      <Image
        source={{
          uri: worker.profile_image_url || "https://via.placeholder.com/50",
        }}
        style={styles.workerAvatar}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{worker.full_name}</Text>
        <Text style={styles.cardSub}>{worker.title || "Healthcare Professional"}</Text>
        {(worker.city || worker.state_province) && (
          <Text style={styles.cardLocation}>{worker.city}{worker.state_province ? `, ${worker.state_province}` : ""}</Text>
        )}
        {worker.bio && (
          <Text style={styles.cardBio} numberOfLines={2}>{worker.bio}</Text>
        )}
        {worker.phone && (
          <Text style={styles.cardContact}>{worker.phone}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Facility Card Component
function FacilityCard({
  facility,
  onPress,
}: {
  facility: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.facilityCard} onPress={onPress}>
      <Image
        source={{
          uri: facility.profile_image_url || "https://via.placeholder.com/50",
        }}
        style={styles.facilityLogo}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{facility.legal_name}</Text>
        <Text style={styles.cardSub}>{facility.industry || "Healthcare"}</Text>
        {(facility.hq_city || facility.hq_state_province) && (
          <Text style={styles.cardLocation}>{facility.hq_city}{facility.hq_state_province ? `, ${facility.hq_state_province}` : ""}</Text>
        )}
        {facility.bio && (
          <Text style={styles.cardBio} numberOfLines={2}>{facility.bio}</Text>
        )}
        {facility.phone_e164 && (
          <Text style={styles.cardContact}>{facility.phone_e164}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FacilityHomePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"worker" | "facility" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      let facilitiesData: any[] = [];
      let workersData: any[] = [];
      let jobsData: any[] = [];
      
      try {
        const token = await AsyncStorage.getItem("token");
        const userTypeStr = await AsyncStorage.getItem("userType");
        
        setUserType(userTypeStr as "worker" | "facility");

        if (!token) {
          Alert.alert("Error", "You must be logged in.");
          return;
        }

        // Fetch current user profile to get their ID
        let currentId = null;
        try {
          if (userTypeStr === "worker") {
            const workerRes = await axios.get(API_ENDPOINTS.WORKER_PROFILE, {
              headers: { Authorization: `Bearer ${token}` },
            });
            currentId = workerRes.data.id;
            console.log("Current worker ID:", currentId);
          } else if (userTypeStr === "facility") {
            const facilityRes = await axios.get(API_ENDPOINTS.FACILITY_PROFILE, {
              headers: { Authorization: `Bearer ${token}` },
            });
            currentId = facilityRes.data.id;
            console.log("Current facility ID:", currentId);
          }
        } catch (error: any) {
          console.error("Error fetching current user:", error.message);
        }

        setCurrentUserId(currentId);

        // Fetch jobs
        try {
          console.log("Fetching jobs from:", API_ENDPOINTS.JOBS_LIST);
          const jobsRes = await axios.get(API_ENDPOINTS.JOBS_LIST, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Jobs response:", jobsRes.data);
          jobsData = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data.items || []);
          console.log("Jobs fetched:", jobsData.length);
        } catch (error: any) {
          console.warn("Could not fetch jobs:", error.response?.status, error.message);
          jobsData = [];
        }

        // Fetch facilities
        try {
          console.log("Fetching facilities from:", API_ENDPOINTS.FACILITIES_LIST);
          const facilitiesRes = await axios.get(API_ENDPOINTS.FACILITIES_LIST, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Facilities response:", facilitiesRes.data);
          facilitiesData = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : (facilitiesRes.data.items || []);
          console.log("Facilities fetched:", facilitiesData.length);
        } catch (error: any) {
          console.warn("Could not fetch facilities:", error.response?.status, error.message);
          facilitiesData = [];
        }

        // Fetch workers
        try {
          console.log("Fetching workers from:", API_ENDPOINTS.WORKERS_LIST);
          const workersRes = await axios.get(API_ENDPOINTS.WORKERS_LIST, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Workers response:", workersRes.data);
          workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data.items || []);
          console.log("Workers fetched:", workersData.length);
        } catch (error: any) {
          console.error("Error fetching workers - Status:", error.response?.status, "Message:", error.message);
          console.error("Full error response:", error.response?.data);
          console.error("Full error object:", error);
          workersData = [];
        }

        // Filter out current users items
        const filteredJobs = jobsData.filter(
          (job: any) => job.facility_id !== currentId && job.worker_id !== currentId
        );
        
        const filteredFacilities = facilitiesData.filter(
          (facility: any) => facility.id !== currentId
        );
        
        const filteredWorkers = workersData.filter(
          (worker: any) => worker.id !== currentId
        );

        console.log("Current user ID:", currentId);
        console.log("Total jobs fetched:", jobsData.length, "-> Filtered:", filteredJobs.length);
        console.log("Total facilities fetched:", facilitiesData.length, "-> Filtered:", filteredFacilities.length);
        console.log("Total workers fetched:", workersData.length, "-> Filtered:", filteredWorkers.length);

        setJobs(filteredJobs);
        setFacilities(filteredFacilities);
        setWorkers(filteredWorkers);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Unable to load data: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log("Facility home page focused - refreshing data");
      const token = AsyncStorage.getItem("token");
      token.then((t) => {
        if (t) {
          setLoading(true);
          let facilitiesData: any[] = [];
          let workersData: any[] = [];
          let jobsData: any[] = [];
          let currentId: any = null;
          
          // First fetch current user ID
          const userTypeStr = AsyncStorage.getItem("userType");
          userTypeStr.then((userType) => {
            let fetchCurrentUserPromise: any;
            if (userType === "worker") {
              fetchCurrentUserPromise = axios.get(API_ENDPOINTS.WORKER_PROFILE, {
                headers: { Authorization: `Bearer ${t}` },
              }).then(res => {
                currentId = res.data.id;
              }).catch(() => {});
            } else if (userType === "facility") {
              fetchCurrentUserPromise = axios.get(API_ENDPOINTS.FACILITY_PROFILE, {
                headers: { Authorization: `Bearer ${t}` },
              }).then(res => {
                currentId = res.data.id;
              }).catch(() => {});
            }
            
            Promise.all([
              fetchCurrentUserPromise,
              axios.get(API_ENDPOINTS.JOBS_LIST, {
                headers: { Authorization: `Bearer ${t}` },
              }).then(res => {
                jobsData = Array.isArray(res.data) ? res.data : (res.data.items || []);
              }).catch(() => {}),
              
              axios.get(API_ENDPOINTS.FACILITIES_LIST, {
                headers: { Authorization: `Bearer ${t}` },
              }).then(res => {
                facilitiesData = Array.isArray(res.data) ? res.data : (res.data.items || []);
              }).catch(() => {}),
              
              axios.get(API_ENDPOINTS.WORKERS_LIST, {
                headers: { Authorization: `Bearer ${t}` },
              }).then(res => {
                workersData = Array.isArray(res.data) ? res.data : (res.data.items || []);
              }).catch(() => {}),
            ]).then(() => {
              const filteredJobs = jobsData.filter(
                (job: any) => job.facility_id !== currentId && job.worker_id !== currentId
              );
              const filteredFacilities = facilitiesData.filter(
                (facility: any) => facility.id !== currentId
              );
              const filteredWorkers = workersData.filter(
                (worker: any) => worker.id !== currentId
              );
              
              setJobs(filteredJobs);
              setFacilities(filteredFacilities);
              setWorkers(filteredWorkers);
              setLoading(false);
            });
          });
        }
      });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
        <View style={styles.headerSpacer} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container}>
          <Text style={styles.pageHeader}>Welcome to MedPost</Text>

          <Text style={styles.sectionTitle}>Available Jobs ({jobs.length})</Text>
          {jobs.length === 0 ? (
            <Text style={styles.emptyText}>No jobs available at the moment.</Text>
          ) : (
            jobs.map((job) => {
              const facility = facilities.find(f => f.id === job.facility_id);
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.position_title}</Text>
                    {job.is_active && (
                      <View style={[styles.statusBadge, styles.activeBadge]}>
                        <Text style={[styles.statusText, { color: '#155724' }]}>Active</Text>
                      </View>
                    )}
                  </View>
                  
                  {facility && (
                    <Text style={styles.facilityName}>{facility.legal_name}</Text>
                  )}
                  
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
                    <Text style={styles.jobDescription} numberOfLines={2}>
                      {job.description}
                    </Text>
                  )}
                </View>
              );
            })
          )}

          <Text style={styles.sectionTitle}>Available Facilities ({facilities.length})</Text>
          {facilities.length === 0 ? (
            <Text style={styles.emptyText}>No facilities available at the moment.</Text>
          ) : (
            facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                onPress={() => router.push({ pathname: '/facility-detail', params: { facilityId: facility.id } })}
              />
            ))
          )}

          <Text style={styles.sectionTitle}>Available Workers ({workers.length})</Text>
          {workers.length === 0 ? (
            <Text style={styles.emptyText}>No workers available at the moment.</Text>
          ) : (
            workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onPress={() => router.push({ pathname: '/worker-detail', params: { workerId: worker.id } })}
              />
            ))
          )}
        </ScrollView>

        {/* Modals removed: now using full-page navigation for details */}

        <BottomTab userType={userType || "facility"} active="home" />
      </View>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    flexGrow: 1,
  },
  pageHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00ced1",
    marginBottom: 10,
    marginTop: 15,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workerCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  facilityCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  facilityLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  cardSub: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  cardLocation: {
    fontSize: 14,
    color: "#555",
    marginTop: 3,
    marginBottom: 4,
  },
  cardSubSmall: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  cardBio: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  cardContact: {
    fontSize: 11,
    color: "#00ced1",
    marginTop: 4,
    fontWeight: "500",
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingTop: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1001,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  profileScroll: {
    padding: 20,
    paddingTop: 30,
  },
  modalProfileImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#00ced1",
    fontWeight: "600",
    marginBottom: 12,
  },
  modalBio: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginVertical: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalInfo: {
    fontSize: 14,
    color: "#555",
    marginVertical: 8,
  },
  jobCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#d4edda",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  jobDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  facilityName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  jobLocation: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  compensationDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 8,
  },
});

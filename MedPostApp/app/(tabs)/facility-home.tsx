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
import { useRouter } from "expo-router";
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
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      let facilitiesData: any[] = [];
      let workersData: any[] = [];
      
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
        if (userTypeStr === "worker") {
          const workerRes = await axios.get(API_ENDPOINTS.WORKER_PROFILE, {
            headers: { Authorization: `Bearer ${token}` },
          });
          currentId = workerRes.data.id;
        } else if (userTypeStr === "facility") {
          const facilityRes = await axios.get(API_ENDPOINTS.FACILITY_PROFILE, {
            headers: { Authorization: `Bearer ${token}` },
          });
          currentId = facilityRes.data.id;
        }

        setCurrentUserId(currentId);

        // Fetch jobs
        const jobsRes = await axios.get(API_ENDPOINTS.JOBS_LIST, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch facilities with error handling
        try {
          console.log("Fetching facilities from:", API_ENDPOINTS.FACILITIES_LIST);
          const facilitiesRes = await axios.get(API_ENDPOINTS.FACILITIES_LIST, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Facilities response:", facilitiesRes.data);
          facilitiesData = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : (facilitiesRes.data.items || []);
        } catch (error: any) {
          console.warn("Could not fetch facilities:", error.response?.status, error.message);
        }

        // Fetch workers with error handling
        try {
          console.log("Fetching workers from:", API_ENDPOINTS.WORKERS_LIST);
          const workersRes = await axios.get(API_ENDPOINTS.WORKERS_LIST, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Workers response:", workersRes.data);
          workersData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data.items || []);
          console.log("Parsed workers data:", workersData);
        } catch (error: any) {
          console.error("Error fetching workers - Status:", error.response?.status, "Message:", error.message);
          console.error("Full error:", error.response?.data || error);
          workersData = [];
        }

        // Filter out current users items
        const filteredJobs = jobsRes.data.filter(
          (job: any) => job.facility_id !== currentId && job.worker_id !== currentId
        );
        
        const filteredFacilities = facilitiesData.filter(
          (facility: any) => facility.id !== currentId
        );
        
        const filteredWorkers = workersData.filter(
          (worker: any) => worker.id !== currentId
        );

        console.log("Current user ID:", currentId);
        console.log("Total workers fetched:", workersData.length);
        console.log("Filtered workers:", filteredWorkers.length);
        console.log("Workers data:", workersData);
        console.log("Worker IDs:", workersData.map((w: any) => w.id));

        setJobs(filteredJobs);
        setFacilities(filteredFacilities);
        setWorkers(filteredWorkers);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Could not load available opportunities.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.card}
                onPress={() => router.push("/(tabs)/facility-home")}
              >
                <Image
                  source={{ uri: job.facility?.logo_url || "https://via.placeholder.com/50" }}
                  style={styles.avatar}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{job.title}</Text>
                  <Text style={styles.cardSub}>{job.facility?.name || "Facility"}</Text>
                  <Text style={styles.cardSubSmall}>
                    {job.city}, {job.state_province}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.sectionTitle}>Available Facilities ({facilities.length})</Text>
          {facilities.length === 0 ? (
            <Text style={styles.emptyText}>No facilities available at the moment.</Text>
          ) : (
            facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                onPress={() => setSelectedFacility(facility)}
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
                onPress={() => setSelectedWorker(worker)}
              />
            ))
          )}
        </ScrollView>

        {selectedFacility && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedFacility(null)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedFacility(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <ScrollView style={styles.profileScroll}>
                <FacilityProfileView
                  facility={selectedFacility}
                  jobs={jobs.filter((j) => j.facility_id === selectedFacility.id)}
                />
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Worker Profile Modal */}
        {selectedWorker && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedWorker(null)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedWorker(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <ScrollView style={styles.profileScroll}>
                <WorkerProfileView worker={selectedWorker} endorsements={[]} />
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

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
    color: "#333",
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
  },
  facilityLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#e0e0e0",
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
});

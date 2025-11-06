import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "../../components/BottomTab";
import { MaterialIcons } from "@expo/vector-icons";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";

const SEMANTIC_ENDPOINT = `${API_BASE_URL}/semantic-search`;
const FACILITIES_SEARCH = `${API_BASE_URL}/v1/facilities/search`;
const WORKERS_SEARCH = `${API_BASE_URL}/v1/workers/search`;
const JOBS_SEARCH = `${API_BASE_URL}/v1/jobs/search`;

type UserType = "worker" | "facility";
type Category = "Jobs" | "Facilities" | "Workers";

interface Props {
  userType: UserType;
}

export default function SearchTab({ userType }: Props) {
  const router = useRouter();
  const [actualUserType, setActualUserType] = useState<UserType>(userType || "worker");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getStoredUserType = async () => {
      const stored = await AsyncStorage.getItem("userType");
      if (stored) {
        setActualUserType(stored as UserType);
      }
      
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          if (stored === "worker") {
            const res = await fetch(`${API_BASE_URL}/v1/workers/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              setCurrentUserId(data.id);
            }
          } else if (stored === "facility") {
            const res = await fetch(`${API_BASE_URL}/v1/facilities/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              setCurrentUserId(data.id);
            }
          }
        } catch (err) {
          console.error("Error fetching current user:", err);
        }
      }
    };
    getStoredUserType();
  }, []);

  // Fetch applied jobs when page loads
  useFocusEffect(
    React.useCallback(() => {
      const fetchAppliedJobs = async () => {
        const token = await AsyncStorage.getItem("token");
        const userType = await AsyncStorage.getItem("userType");
        console.log("Fetching applied jobs - userType:", userType);
        if (token && userType === "worker") {
          try {
            const url = API_ENDPOINTS.JOB_APPLICATIONS_WORKER;
            console.log("Fetching from:", url);
            const res = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Applied jobs response status:", res.status);
            if (res.ok) {
              const applications = await res.json();
              console.log("Applications response:", applications);
              const appliedIds = new Set(
                Array.isArray(applications) 
                  ? applications.map((app: any) => app.job_post_id)
                  : []
              );
              setAppliedJobIds(appliedIds);
              console.log("Applied jobs set:", Array.from(appliedIds));
            } else {
              console.log("Failed to fetch applied jobs:", res.status);
            }
          } catch (err) {
            console.error("Error fetching applied jobs:", err);
          }
        } else {
          console.log("Not a worker or no token, skipping applied jobs fetch");
        }
      };
      fetchAppliedJobs();
    }, [])
  );

  const allowedCategories: Category[] =
    actualUserType === "worker" ? ["Jobs", "Facilities"] : ["Facilities", "Workers"];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>(allowedCategories[0]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [endorsedOnly, setEndorsedOnly] = useState(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const effectiveQuery = query.trim();

    // Search for all workers with endorsements
    if (endorsedOnly && category === "Workers") {
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        console.log("Fetching endorsed workers without query");
        runSearch("", category);  // Empty query to get all endorsed workers
      }, 300) as unknown as number;
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    if (!effectiveQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      runSearch(effectiveQuery, category);
    }, 600) as unknown as number;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, endorsedOnly]);

  const useCurrentLocation = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied. Please enable it in your device settings."
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const geocodedAddress = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocodedAddress.length > 0) {
        const city = geocodedAddress[0].city;
        if (city) {
          setLocationCity(city);
          setQuery(city);
          runSearch(city, category);
        } else {
          Alert.alert(
            "City Not Found",
            "Could not determine the city from your location."
          );
          setLoading(false);
        }
      } else {
        Alert.alert(
          "Location Error",
          "Could not find a human-readable address for your location."
        );
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch location. Please try again.");
      setLoading(false);
    }
  };

  const runSearch = async (q: string, cat: Category) => {
    try {
      let res, data;
      setError(null);
      const encodedQuery = encodeURIComponent(q);
      const token = await AsyncStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (cat === "Jobs") {
        const url = `${JOBS_SEARCH}?q=${encodedQuery}`;
        console.log(`Searching jobs: ${url}`);
        res = await fetch(url, { headers });
        console.log(`Jobs search response status: ${res.status}`);
        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.error("Jobs search error response:", errorText);
          throw new Error(`Jobs search failed (${res.status}): ${errorText}`);
        }
        data = await res.json();
        console.log(`Jobs search data:`, data);
        // Handle both direct array and paginated response
        if (data.items) {
          data = data.items;
        } else if (!Array.isArray(data)) {
          data = [];
        }
      } else if (cat === "Facilities") {
        const url = `${FACILITIES_SEARCH}?q=${encodedQuery}`;
        console.log(`Searching facilities: ${url}`);
        res = await fetch(url, { headers });
        console.log(`Facilities search response status: ${res.status}`);
        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.error("Facility search error response:", errorText);
          throw new Error(`Facility search failed (${res.status}): ${errorText}`);
        }
        data = await res.json();
        console.log(`Facilities search data:`, data);
        // Handle both direct array and paginated response
        if (data.items) {
          data = data.items;
        } else if (!Array.isArray(data)) {
          data = [];
        }
        // Filter out current user facility
        if (Array.isArray(data)) {
          data = data.filter((item: any) => item.id !== currentUserId);
        }
      } else if (cat === "Workers") {
        let url = `${WORKERS_SEARCH}?endorsed_only=${endorsedOnly ? 'true' : 'false'}`;
        if (q) {
          url += `&q=${encodeURIComponent(q)}`;
        }
        console.log(`Searching workers: ${url}`);
        res = await fetch(url, { headers });
        console.log(`Workers search response status: ${res.status}`);
        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.error("Worker search error response:", errorText);
          throw new Error(`Worker search failed (${res.status}): ${errorText}`);
        }
        data = await res.json();
        console.log(`Workers search data:`, data);
        // Handle both direct array and paginated response
        if (data.items) {
          data = data.items;
        } else if (!Array.isArray(data)) {
          data = [];
        }
        // Filter out current user worker
        if (Array.isArray(data)) {
          data = data.filter((item: any) => item.id !== currentUserId);
        }
      }

      setResults(data);
    } catch (err: any) {
      console.error("Search error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setLocationCity(null);
    Keyboard.dismiss();
  };

  const renderResult = ({ item }: { item: any }) => {
    // Filter out current user if theyre the same type
    if (item.id === currentUserId) {
      if (category === "Facilities" && actualUserType === "facility") {
        return null;
      }
      if (category === "Workers" && actualUserType === "worker") {
        return null;
      }
    }

    // Render different card types based on category
    if (category === "Facilities") {
      return (
        <TouchableOpacity
          style={styles.facilityCard}
          onPress={() => {
            router.push({
              pathname: "/(tabs)/facility-detail",
              params: { facilityId: item.id }
            } as any);
          }}
        >
          <Image
            source={{
              uri: item.profile_image_url || "https://via.placeholder.com/50",
            }}
            style={styles.facilityLogo}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.legal_name}</Text>
            {item.industry && (
              <Text style={styles.cardSub}>
                Industry: {item.industry.replace(/_/g, " ")}
              </Text>
            )}
            {item.city && (
              <Text style={styles.cardSub}>
                {item.city}{item.state_province ? `, ${item.state_province}` : ""}
              </Text>
            )}
            {item.bio && (
              <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
            )}
            {item.phone_e164 && (
              <Text style={styles.cardContact}>{item.phone_e164}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    } else if (category === "Workers") {
      return (
        <TouchableOpacity
          style={styles.workerCard}
          onPress={() => {
            router.push({
              pathname: "/(tabs)/worker-detail",
              params: { workerId: item.id }
            } as any);
          }}
        >
          <Image
            source={{
              uri: item.profile_image_url || "https://via.placeholder.com/50",
            }}
            style={styles.workerAvatar}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <Text style={styles.cardSub}>{item.title || "Healthcare Professional"}</Text>
            {(item.city || item.state_province) && (
              <Text style={styles.cardLocation}>{item.city}{item.state_province ? `, ${item.state_province}` : ""}</Text>
            )}
            {item.bio && (
              <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
            )}
            {item.phone && (
              <Text style={styles.cardContact}>{item.phone}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    } else {
      // Jobs card
      return (
        <View key={item.id} style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            {item.is_active && (
              <View style={[styles.statusBadge, styles.activeBadge]}>
                <Text style={[styles.statusText, { color: '#155724' }]}>Active</Text>
              </View>
            )}
          </View>
          {item.facility_name && (
            <Text style={styles.facilityName}>{item.facility_name}</Text>
          )}
          {item.industry && (
            <Text style={styles.industryText}>{item.industry.replace(/_/g, " ")}</Text>
          )}
          <Text style={styles.jobDetail}>
            {item.employment_type ? item.employment_type.replace("_", " ") : "N/A"} • {item.compensation_type || "N/A"}
          </Text>
          {(() => {
            let min, max;
            if (item.compensation_type === 'HOURLY') {
              min = item.salary_min;
              max = item.salary_max;
            } else if (item.compensation_type === 'MONTHLY') {
              min = item.salary_min;
              max = item.salary_max;
            } else if (item.compensation_type === 'YEARLY') {
              min = item.salary_min;
              max = item.salary_max;
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
          {item.city && item.state_province && (
            <Text style={styles.jobLocation}>📍 {item.city}, {item.state_province}</Text>
          )}
          {item.description && (
            <Text style={styles.jobDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <TouchableOpacity 
            style={[
              styles.applyButton,
              (!item.is_active || appliedJobIds.has(item.id)) && styles.applyButtonDisabled
            ]}
            onPress={() => {
              if (item.is_active && !appliedJobIds.has(item.id)) {
                router.push({
                  pathname: "/application-worker",
                  params: { jobId: item.id, facilityId: item.facility_id }
                });
              }
            }}
            disabled={!item.is_active || appliedJobIds.has(item.id)}
          >
            <Text style={styles.applyButtonText}>
              {appliedJobIds.has(item.id) ? "Applied" : item.is_active ? "Apply Now" : "Position Closed"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00ced1" }}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <Text style={styles.headerText}></Text>

          <View style={styles.searchBarRow}>
          <MaterialIcons 
            name="search" 
            size={20} 
            color="#00ced1" 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${category.toLowerCase()} or a city...`}
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              category !== "Workers" && styles.locationButtonFull,
            ]}
            onPress={useCurrentLocation}
          >
            <Text style={styles.locationText}>Use Current Location</Text>
          </TouchableOpacity>

          {category === "Workers" && (
            <TouchableOpacity
              style={[
                styles.endorsementButton,
                endorsedOnly && styles.endorsementButtonActive,
              ]}
              onPress={() => setEndorsedOnly(!endorsedOnly)}
            >
              <MaterialIcons
                name={endorsedOnly ? "check-box" : "check-box-outline-blank"}
                size={18}
                color={endorsedOnly ? "#fff" : "#00ced1"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.endorsementText,
                  endorsedOnly && styles.endorsementTextActive,
                ]}
              >
                Endorsed
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsRow}>
          {allowedCategories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.tabButton,
                category === c && styles.tabButtonActive,
              ]}
              onPress={() => {
                setCategory(c);
                setQuery(locationCity || "");
                setResults([]);
              }}
            >
              <Text
                style={[styles.tabText, category === c && styles.tabTextActive]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#00ced1"
            style={{ marginTop: 20 }}
          />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : results.length === 0 && query.length > 0 ? (
          <Text style={styles.emptyText}>
            No results found for &quot;{query}&quot;.
          </Text>
        ) : results.length === 0 && !query ? (
          <Text style={styles.emptyText}>
            Start typing or use your location to search.
          </Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(it) => String(it.id || Math.random())}
            renderItem={renderResult}
            contentContainerStyle={{ paddingVertical: 20 }}
          />
        )}
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <BottomTab userType={actualUserType} active="search" />
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
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
  headerSpacer: {
    width: 60,
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
    marginBottom: 15,
    marginHorizontal: "5%",
    width: "90%",
    alignSelf: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 0,
    backgroundColor: "#fff",
    color: "#000",
  },
  clearBtn: { marginLeft: 8 },
  clearText: { color: "#00ced1", fontWeight: "600" },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    marginBottom: 15,
    marginHorizontal: "5%",
    width: "90%",
    alignSelf: "center",
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: { backgroundColor: "#00ced1" },
  tabText: { color: "#333", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginTop: 15,
    marginBottom: 15,
    marginHorizontal: "5%",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  cardContent: { 
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#2c3e50" 
  },
  cardSub: { 
    fontSize: 14, 
    color: "#555", 
    marginTop: 2 
  },
  cardBio: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 4 
  },
  cardContact: { 
    fontSize: 11, 
    color: "#00ced1", 
    marginTop: 4,
    fontWeight: "500",
  },
  cardLocation: {
    fontSize: 14,
    color: "#555",
    marginTop: 3,
    marginBottom: 4,
  },
  facilityCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: "5%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityLogo: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 12,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  workerCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: "5%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workerAvatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 12,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  jobCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: "5%",
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
  compensationDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 8,
  },
  jobDescription: { 
    fontSize: 14, 
    color: "#555", 
    marginBottom: 12,
    lineHeight: 20,
  },
  jobLocation: { 
    fontSize: 14, 
    color: "#00ced1", 
    marginBottom: 8 
  },
  jobSalary: { fontSize: 12, color: "#00ced1", fontWeight: "500", marginTop: 3 },
  facilityName: { 
    fontSize: 14, 
    color: "#666", 
    fontWeight: "500", 
    marginBottom: 8 
  },
  industryText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
    fontStyle: "italic",
  },
  applyButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  emptyText: { textAlign: "center", color: "#888", marginTop: 30 },
  errorText: { textAlign: "center", color: "red", marginTop: 20 },
  locationButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00ced1",
    backgroundColor: "#fff",
    marginRight: 8,
    flexDirection: "row",
  },
  locationButtonFull: {
    marginRight: 0,
  },
  locationText: {
    color: "#00ced1",
    fontWeight: "500",
    fontSize: 13,
  },
  buttonRow: {
    marginHorizontal: "5%",
    marginVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  endorsementFilterRow: {
    marginHorizontal: "5%",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  endorsementButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00ced1",
    backgroundColor: "#fff",
  },
  endorsementButtonActive: {
    backgroundColor: "#00ced1",
    borderColor: "#00ced1",
  },
  endorsementText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#00ced1",
  },
  endorsementTextActive: {
    color: "#fff",
  },
});

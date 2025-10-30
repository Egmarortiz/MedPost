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
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import BottomTab from "../../components/BottomTab";

const API_BASE = "http://127.0.0.1:8000";
const SEMANTIC_ENDPOINT = `http://127.0.0.1:8000/semantic-search`;
const FACILITIES_SEARCH = `http://127.0.0.1:8000/api/facilities/search`;
const WORKERS_SEARCH = `http://127.0.0.1:8000/api/workers/search`;

type UserType = "worker" | "facility";
type Category = "Jobs" | "Facilities" | "Workers";

interface Props {
  userType: UserType;
}

export default function SearchTab({ userType }: Props) {
  const router = useRouter();

  const allowedCategories: Category[] =
    userType === "worker" ? ["Jobs", "Facilities"] : ["Facilities", "Workers"];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>(allowedCategories[0]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const effectiveQuery = query.trim();

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
  }, [query, category]);

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

      if (cat === "Jobs") {
        res = await fetch(`${SEMANTIC_ENDPOINT}?query=${encodedQuery}`);
        if (!res.ok) throw new Error("Semantic search failed");
        data = await res.json();
        data = data.map((h: any) => ({
          id: h._id,
          title: h._source?.position_title,
          facility: h._source?.facility_name,
          city: h._source?.city,
          state: h._source?.state_province,
          score: h._score,
        }));
      } else if (cat === "Facilities") {
        res = await fetch(`${FACILITIES_SEARCH}?q=${encodedQuery}`);
        if (!res.ok) throw new Error("Facility search failed");
        data = await res.json();
      } else if (cat === "Workers") {
        res = await fetch(`${WORKERS_SEARCH}?q=${encodedQuery}`);
        if (!res.ok) throw new Error("Worker search failed");
        data = await res.json();
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
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

  const renderResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (category === "Jobs")
          router.push("/(tabs)/job?id=" + String(item.id));
        else if (category === "Facilities")
          router.push("/(tabs)/facility-profile?id=" + String(item.id));
        else if (userType === "facility")
          router.push("/(tabs)/worker-profile?id=" + String(item.id));
        else router.push("/(tabs)/facility-profile?id=" + String(item.id));
      }}
    >
      <Image
        source={{
          uri:
            item.logo_url ||
            item.facility_logo ||
            "https://via.placeholder.com/60",
        }}
        style={styles.avatar}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {item.title || item.name || "Untitled"}
        </Text>
        <Text style={styles.cardSub}>
          {item.city || ""} {item.state ? ", " + item.state : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00ced1" }}>
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
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Text style={styles.headerText}></Text>

        <View style={styles.searchBarRow}>
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

        <TouchableOpacity
          style={styles.locationButton}
          onPress={useCurrentLocation}
        >
          <Text style={styles.locationText}>Use My Current Location</Text>
        </TouchableOpacity>

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
          <BottomTab userType={userType} active="search" />
        </View>
      </View>
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
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#000",
  },
  clearBtn: { marginLeft: 8 },
  clearText: { color: "#00ced1", fontWeight: "600" },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
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
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  cardSub: { fontSize: 13, color: "#555", marginTop: 3 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 30 },
  errorText: { textAlign: "center", color: "red", marginTop: 20 },
  locationButton: {
    marginTop: 15,
    marginBottom: 15,
    marginHorizontal: "5%",
    width: "90%",
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    alignSelf: "center",
  },
  locationText: {
    color: "#00ced1",
    fontWeight: "600",
  },
});

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
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

export default function FacilityHomePage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, facilitiesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000"),
          axios.get("http://127.0.0.1:8000"),
        ]);
        setWorkers(workersRes.data);
        setFacilities(facilitiesRes.data);
      } catch (error) {
        Alert.alert("Error", "Could not load data.");
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Welcome to Your Dashboard</Text>

      <Text style={styles.sectionTitle}>Available Workers</Text>
      {workers.length === 0 ? (
        <Text style={styles.emptyText}>No workers available.</Text>
      ) : (
        workers.map((worker) => (
          <TouchableOpacity
            key={worker.id}
            style={styles.card}
            onPress={() => router.push(`/worker/${worker.id}`)}
          >
            <Image
              source={{
                uri: worker.profile_image_url || "http://127.0.0.1:8000",
              }}
              style={styles.avatar}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{worker.full_name}</Text>
              <Text style={styles.cardSub}>{worker.title}</Text>
              <Text style={styles.cardSubSmall}>
                {worker.city}, {worker.state_province}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Other Facilities</Text>
      {facilities.length === 0 ? (
        <Text style={styles.emptyText}>No other facilities listed.</Text>
      ) : (
        facilities.map((facility) => (
          <TouchableOpacity
            key={facility.id}
            style={styles.card}
            onPress={() => router.push(`/facility/${facility.id}`)}
          >
            <Image
              source={{
                uri: facility.logo_url || "http://127.0.0.1:8000",
              }}
              style={styles.avatar}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{facility.name}</Text>
              <Text style={styles.cardSub}>{facility.industry}</Text>
              <Text style={styles.cardSubSmall}>
                {facility.city}, {facility.state_province}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  cardSub: {
    fontSize: 14,
    color: "#555",
  },
  cardSubSmall: {
    fontSize: 12,
    color: "#888",
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
});

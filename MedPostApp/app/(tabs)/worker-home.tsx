import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function WorkerHomePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, facilitiesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000"),
          axios.get("http://127.0.0.1:8000"),
        ]);
        setJobs(jobsRes.data);
        setFacilities(facilitiesRes.data);
      } catch (error) {
        Alert.alert("Error", "Unable to load jobs or facilities.");
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

      <Text style={styles.sectionTitle}>Available Jobs</Text>
      {jobs.length === 0 ? (
        <Text style={styles.emptyText}>No jobs available at the moment.</Text>
      ) : (
        jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            style={styles.card}
            onPress={() => router.push(`/job/${job.id}`)}
          >
            <Image
              source={{
                uri: job.facility?.logo_url || "http://127.0.0.1:8000",
              }}
              style={styles.avatar}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <Text style={styles.cardSub}>{job.facility?.name}</Text>
              <Text style={styles.cardSubSmall}>
                {job.city}, {job.state_province}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Facilities Listing</Text>
      {facilities.length === 0 ? (
        <Text style={styles.emptyText}>No facilities found.</Text>
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
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
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

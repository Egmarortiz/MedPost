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

export default function WorkerDetailPage() {
  const { workerId } = useLocalSearchParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userTypeStr = await AsyncStorage.getItem("userType");
        setUserType(userTypeStr);

        if (!token || !workerId) {
          Alert.alert("Error", "Missing required information");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/v1/workers/${workerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setWorker(response.data);
      } catch (error: any) {
        console.error("Error fetching worker:", error);
        Alert.alert("Error", "Could not load worker profile");
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Worker not found</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container}>
        {worker.profile_image_url && (
          <Image
            source={{ uri: worker.profile_image_url }}
            style={styles.profileImage}
          />
        )}

        <View style={styles.card}>
          <Text style={styles.name}>{worker.full_name}</Text>
          {worker.title && (
            <Text style={styles.title}>{worker.title}</Text>
          )}
        </View>

        {worker.bio && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.bioText}>{worker.bio}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional Information</Text>
          {worker.title && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Title:</Text>
              <Text style={styles.value}>{worker.title}</Text>
            </View>
          )}
          {worker.education_level && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Education:</Text>
              <Text style={styles.value}>{worker.education_level}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          {worker.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{worker.phone}</Text>
            </View>
          )}
          {worker.city && worker.state_province && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{worker.city}, {worker.state_province}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTab userType={userType as "worker" | "facility"} active="home" />
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
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
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
  title: {
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    width: 100,
  },
  value: {
    fontSize: 14,
    color: "#555",
    flex: 1,
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
});

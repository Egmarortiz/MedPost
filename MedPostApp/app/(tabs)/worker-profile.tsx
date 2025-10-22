import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function WorkerProfile() {
  const { id } = useLocalSearchParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    WorkerAPI.getProfile(id as string)
      .then((res) => setWorker(res.data))
      .catch((err) => console.error("Error loading worker:", err))
      .finally(() => setLoading(false));
  }, [id]);

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
        <Text>Worker not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: worker.profile_image_url }}
        style={styles.profileImage}
      />
      <Text style={styles.name}>{worker.full_name}</Text>
      <Text style={styles.title}>{worker.title}</Text>
      <Text style={styles.section}>
        📍 {worker.city}, {worker.state_province}
      </Text>
      <Text style={styles.section}>🎓 {worker.education_level}</Text>
      <Text style={styles.bio}>{worker.bio || "No bio provided."}</Text>
      <View style={styles.infoBox}>
        <Text>Email: {worker.email}</Text>
        <Text>Phone: {worker.phone_e164 || "N/A"}</Text>
        <Text>Postal Code: {worker.postal_code}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, alignItems: "center", backgroundColor: "#fff" },
  profileImage: { width: 140, height: 140, borderRadius: 70, marginBottom: 15 },
  name: { fontSize: 22, fontWeight: "bold" },
  title: { fontSize: 16, color: "#666", marginBottom: 10 },
  section: { color: "#333", fontSize: 15, marginBottom: 5 },
  bio: { marginTop: 15, fontStyle: "italic", textAlign: "center" },
  infoBox: {
    marginTop: 20,
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
});

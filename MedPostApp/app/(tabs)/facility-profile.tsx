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

export default function FacilityProfile() {
  const { id } = useLocalSearchParams();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    FacilityAPI.getProfile(id as string)
      .then((res) => setFacility(res.data))
      .catch((err) => console.error("Error loading facility:", err))
      .finally(() => setLoading(false));
  }, [id]);

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
        <Text>Facility not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: facility.profile_image_url }}
        style={styles.profileImage}
      />
      <Text style={styles.name}>{facility.legal_name}</Text>
      <Text style={styles.title}>{facility.industry}</Text>
      <Text style={styles.section}>{facility.company_size} employees</Text>
      <Text style={styles.section}>Founded: {facility.founded_year}</Text>
      <Text style={styles.bio}>{facility.bio || "No bio provided."}</Text>

      <View style={styles.infoBox}>
        <Text>Email: {facility.email}</Text>
        <Text>Phone: {facility.phone_e164 || "N/A"}</Text>
        <Text>
          {facility.city}, {facility.state_province}
        </Text>
        <Text>Postal Code: {facility.postal_code}</Text>
        <Text>Country: {facility.country}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  container: { 
    padding: 20, 
    alignItems: "center", 
    backgroundColor: "#fff" 
  },
  profileImage: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    marginBottom: 15 
  },
  name: { 
    fontSize: 22, 
    fontWeight: "bold" 
  },
  title: { 
    fontSize: 16, 
    color: "#666", 
    marginBottom: 10 
  },
  section: { 
    color: "#333", 
    fontSize: 15, 
    marginBottom: 5 
  },
  bio: { 
    marginTop: 15, 
    fontStyle: "italic", 
    textAlign: "center" 
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
});

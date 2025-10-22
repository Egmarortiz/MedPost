/** @jsxImportSource @emotion/react */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";

export default function RoleSelect() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Are you hiring or</Text>
      <Text style={styles.title}>looking for a job?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("facility-register")}
      >
        <FontAwesome6
          name="hospital"
          size={30}
          color="black"
          style={styles.icon}
        />
        <Text style={styles.buttonText}>I'm a Hiring Facility</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <FontAwesome6
          name="hand-holding-medical"
          size={30}
          color="black"
          style={styles.icon}
        />
        <Text style={styles.buttonText}>I'm a Job Seeker</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00ced1",
  },
  title: {
    alignItems: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginVertical: 10,
    width: "60%",
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "600",
  },
  icon: {
    marginRight: 10,
  },
});

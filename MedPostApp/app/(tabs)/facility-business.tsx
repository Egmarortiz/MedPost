/** @jsx ImportSource @emotion/react */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function WorkerSpecialty() {
    const router = useRouter();

     return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your</Text>
        <Text style={styles.title}>business industry?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("facility-register")}
      >
        <Text style={styles.buttonText}>   Hospital</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("facility-register")}
      >
        <Text style={styles.buttonText}>Senior Care</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Home Health</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Rehab Facility</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Behavioral Health</Text>
      </TouchableOpacity>

        <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Specialty Clinic</Text>
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
    width: "50%",
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  icon: {
    marginRight: 10,
  }
});


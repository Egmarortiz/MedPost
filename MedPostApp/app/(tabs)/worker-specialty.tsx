/** @jsx ImportSource @emotion/react */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function WorkerSpecialty() {
    const router = useRouter();

     return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick your specialty:</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Registered Nurse</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Licensed Nurse</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Certified Nursing Assistant</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Personal Care Aide</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("worker-register")}
      >
        <Text style={styles.buttonText}>Housekeeping Aide</Text>
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
    marginBottom: 40,
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
    textAlign: "center",
  },
  icon: {
    marginRight: 10,
  }
});


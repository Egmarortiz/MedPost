import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { useRouter } from "expo-router";

const facilityValidationSchema = yup.object().shape({
  name: yup.string().required("Facility name is required"),
  address: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  state_province: yup.string().required("State/Province is required"),
  postal_code: yup.string().required("Postal code is required"),
  phone: yup.string().required("Phone number is required"),
});

export default function FacilityEdit() {
  const [facility, setFacility] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000")
      .then((res) => setFacility(res.data))
      .catch(() => Alert.alert("Error", "Failed to load facility data"));
  }, []);

  const handleUpdate = async (values: any) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/v1/facility/${facility.id}`,
        values
      );
      Alert.alert("Success", "Facility information updated");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Update failed");
    }
  };

  if (!facility) return <Text>Loading...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

      <Formik
        initialValues={{
          name: facility.name || "",
          address: facility.address || "",
          city: facility.city || "",
          state_province: facility.state_province || "",
          postal_code: facility.postal_code || "",
          phone: facility.phone || "",
          founding_year: facility.founding_year || "",
        }}
        validationSchema={facilityValidationSchema}
        onSubmit={handleUpdate}
        enableReinitialize
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                value={values.name}
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
                value={values.address}
              />
              {touched.address && errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("city")}
                onBlur={handleBlur("city")}
                value={values.city}
              />
              {touched.city && errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State / Province</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("state_province")}
                onBlur={handleBlur("state_province")}
                value={values.state_province}
              />
              {touched.state_province && errors.state_province && (
                <Text style={styles.errorText}>{errors.state_province}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("postal_code")}
                onBlur={handleBlur("postal_code")}
                value={values.postal_code}
              />
              {touched.postal_code && errors.postal_code && (
                <Text style={styles.errorText}>{errors.postal_code}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("phone")}
                onBlur={handleBlur("phone")}
                value={values.phone}
              />
              {touched.phone && errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Founding Year</Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#f2f2f2" }]}
                value={values.founding_year.toString()}
                editable={false}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#000",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 3,
  },
  submitButton: {
    backgroundColor: "#00ced1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Formik } from "formik";
import * as yup from "yup";
import { useRouter } from "expo-router";
import axios from "axios";

const credentialSchema = yup.object().shape({
  credential_type_id: yup
    .number()
    .typeError("Credential type ID must be a number")
    .required("Credential type ID is required"),
  number: yup
    .number()
    .typeError("Credential number must be a number")
    .required("Credential number is required"),
  jurisdiction: yup.string().required("Jurisdiction is required"),
  evidence_url: yup
    .string()
    .url("Must be a valid URL")
    .required("Evidence URL is required"),
});

export default function WorkerCredential() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  const handleCredentialsSubmit = async (values: any) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/workers/credentials",
        values
      );
      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Credentials submitted!");
        router.push("/");
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to submit credentials."
      );
    }
  };

  const handleSubmitForm = (values: any) => {
    const data = {
      ...values,
      verified,
      verified_at: verified ? new Date().toISOString() : null,
    };

    Alert.alert("Credential Submitted", JSON.stringify(data, null, 2));
    router.back();
  };

  const handleDocumentPick = async (setFieldValue: any) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setFieldValue("evidence_url", uri);
      Alert.alert("Document Selected", uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
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
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerLabel}>Add Credential</Text>

      <Formik
        initialValues={{
          credential_type_id: "",
          number: "",
          jurisdiction: "",
          evidence_url: "",
        }}
        validationSchema={credentialSchema}
        onSubmit={handleCredentialsSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Credential Type ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1 (RN License, LPN License)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                onChangeText={handleChange("credential_type_id")}
                onBlur={handleBlur("credential_type_id")}
                value={values.credential_type_id}
              />
              {touched.credential_type_id && errors.credential_type_id && (
                <Text style={styles.errorText}>
                  {errors.credential_type_id}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Identification Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter license or certification number"
                placeholderTextColor="#999"
                keyboardType="numeric"
                onChangeText={handleChange("number")}
                onBlur={handleBlur("number")}
                value={values.number}
              />
              {touched.number && errors.number && (
                <Text style={styles.errorText}>{errors.number}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Jurisdiction</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. California, Texas, etc."
                placeholderTextColor="#999"
                onChangeText={handleChange("jurisdiction")}
                onBlur={handleBlur("jurisdiction")}
                value={values.jurisdiction}
              />
              {touched.jurisdiction && errors.jurisdiction && (
                <Text style={styles.errorText}>{errors.jurisdiction}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Evidence (File or URL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter evidence URL or upload file"
                placeholderTextColor="#999"
                onChangeText={handleChange("evidence_url")}
                onBlur={handleBlur("evidence_url")}
                value={values.evidence_url}
              />
              {touched.evidence_url && errors.evidence_url && (
                <Text style={styles.errorText}>{errors.evidence_url}</Text>
              )}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleDocumentPick(setFieldValue)}
              >
                <Text style={styles.uploadText}>Upload File</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Verified</Text>
              <Switch value={verified} onValueChange={setVerified} />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>Save Credential</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#00ced1",
  },
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    textAlign: "center",
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
  headerLabel: {
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
  uploadButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  uploadText: {
    color: "#fff",
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
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

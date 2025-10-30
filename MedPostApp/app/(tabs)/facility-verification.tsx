import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";

export default function FacilityVerificationScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [licenseId, setLicenseId] = useState<string>("");
  const [errors, setErrors] = useState<{ idPhoto?: string; licenseId?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera permission",
        "We need camera access to capture your selfie and ID."
      );
      return false;
    }
    return true;
  };

  const pickImage = async (
    setter: (uri: string) => void,
    field: "selfie" | "idPhoto"
  ) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    const granted = await requestCameraPermissions();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (uri) setter(uri);
      else
        setErrors((prev) => ({
          ...prev,
          [field]: "Could not read image. Try again.",
        }));
    }
  };

  const uploadImage = async (imageUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);

      const response = await axios.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const relativeUrl = response.data.url || response.data.file_url;
      const absoluteUrl = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : `${API_BASE_URL}${relativeUrl}`;
      
      console.log("Upload response:", response.data);
      console.log("Absolute URL:", absoluteUrl);
      return absoluteUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!idPhoto) newErrors.idPhoto = "Please upload your business ID or certification.";
    if (!licenseId.trim()) newErrors.licenseId = "Please enter the Business License ID number.";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);

      console.log("Uploading verification document...");
      const idPhotoUrl = await uploadImage(idPhoto!);

      console.log("Submitting facility verification...");
      const response = await axios.post(
        API_ENDPOINTS.FACILITY_VERIFY,
        {
          facility_id: user?.facility_id,
          id_photo_url: idPhotoUrl,
          license_id: licenseId.trim(),
          submitted_at: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Verification submitted:", response.data);

      Alert.alert(
        "Success",
        "Your verification has been submitted to MedPost. You will be notified once it's reviewed.",
        [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/facility-profile"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Verification error:", error?.response?.data || error.message);
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Could not submit verification. Please try again."
      );
    } finally {
      setSubmitting(false);
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
          <Text style={styles.headerLabel}>Facility Verification</Text>
          <Text style={styles.instructionText}>
            Please upload your business license, registration certificate, or other official documentation to verify your facility.
          </Text>
          <Text style={styles.warningText}>
            This is required to complete your facility profile and start posting jobs.
          </Text>

          {/* ID Photo Section */}
          <View style={styles.imageContainer}>
            <Text style={styles.sectionLabel}>Business Documentation</Text>
            {idPhoto ? (
              <Image source={{ uri: idPhoto }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imagePlaceholder}>No document selected</Text>
            )}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(setIdPhoto, "idPhoto")}
            >
              <Text style={styles.uploadText}>Upload Document</Text>
            </TouchableOpacity>
            {errors.idPhoto ? (
              <Text style={styles.errorText}>{errors.idPhoto}</Text>
            ) : null}
          </View>

          {/* License ID Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Business License ID Number</Text>
            <Text style={styles.sectionDescription}>
              Please enter the license ID number visible on your business license or certification document.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., BL-2024-12345"
              value={licenseId}
              onChangeText={(text) => {
                setLicenseId(text);
                if (errors.licenseId) {
                  setErrors((prev) => ({ ...prev, licenseId: undefined }));
                }
              }}
              placeholderTextColor="#999"
            />
            {errors.licenseId ? (
              <Text style={styles.errorText}>{errors.licenseId}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!idPhoto || submitting) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={!idPhoto || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Verification</Text>
            )}
          </TouchableOpacity>
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
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
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
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  warningText: {
    fontSize: 13,
    color: "#f39c12",
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
  },
  sectionDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: 120,
    height: 165,
    borderRadius: 1,
    marginBottom: 10,
  },
  imagePlaceholder: {
    color: "#888",
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "bold",
  },
  formSection: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 3,
  },
  submitButton: {
    backgroundColor: "#c1c1c1",
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
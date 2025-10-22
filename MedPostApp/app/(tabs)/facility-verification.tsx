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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function IdentityVerificationScreen() {
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ selfie?: string; idPhoto?: string }>(
    {}
  );
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!selfie) newErrors.selfie = "Please upload a clear selfie.";
    if (!idPhoto) newErrors.idPhoto = "Please upload your ID photo.";
    setErrors(newErrors);

    if (newErrors.selfie || newErrors.idPhoto) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("certification", {
        uri: certification!,
        name: "certification.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(
        "http://127.0.0.1:8000/{facility_id}/certifications",
        {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!res.ok) throw new Error("Failed to submit verification");

      Alert.alert(
        "Submitted",
        "Your identity verification has been sent to MedPost."
      );
    } catch (err) {
      Alert.alert("Error", "Could not submit verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled = !selfie || !idPhoto || submitting;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Identity Verification</Text>

      <View style={styles.imageContainer}>
        {selfie ? (
          <Image source={{ uri: selfie }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePlaceholder}>
            Upload a photo of your business certificate
          </Text>
        )}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(setSelfie, "selfie")}
        >
          <Text style={styles.uploadText}>Upload Certification</Text>
        </TouchableOpacity>
        {errors.selfie ? (
          <Text style={styles.errorText}>{errors.selfie}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitDisabled && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitDisabled}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
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

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, StyleSheet, SafeAreaView} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";

export default function IdentityVerificationScreen() {
  const router = useRouter();
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ selfie?: string; idPhoto?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission", "We need camera access to capture your selfie and ID.");
      return false;
    }
    return true;
  };

  const pickImage = async (setter: (uri: string) => void, field: "selfie" | "idPhoto") => {
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
      else setErrors((prev) => ({ ...prev, [field]: "Could not read image. Try again." }));
    }
  };

  const uploadImage = async (imageUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      console.log('Uploading verification image...');
      
      const response = await axios.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Image upload response:', response.data);
      
      const relativeUrl = response.data.url;
      const absoluteUrl = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : `${API_BASE_URL}${relativeUrl}`;
      
      return absoluteUrl;
    } catch (error: any) {
      console.error('Image upload error:', error?.response?.data || error.message);
      throw new Error('Failed to upload image');
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

      const userJson = await AsyncStorage.getItem("user");
      console.log("Retrieved user from storage:", userJson);
      
      if (!userJson) {
        console.error("No user found in AsyncStorage!");
        Alert.alert("Error", "User data not found. Please register first.");
        router.push("/(tabs)/worker-register");
        return;
      }

      const user = JSON.parse(userJson);
      const workerId = user.worker_id;
      console.log("Extracted worker_id:", workerId);
      
      if (!workerId) {
        console.error("No worker_id found in user object!");
        Alert.alert("Error", "Worker ID not found. Please register first.");
        router.push("/(tabs)/worker-register");
        return;
      }

      // Upload images first
      console.log("Uploading selfie...");
      const selfieUrl = await uploadImage(selfie!);
      console.log("Selfie uploaded:", selfieUrl);

      console.log("Uploading ID photo...");
      const idPhotoUrl = await uploadImage(idPhoto!);
      console.log("ID photo uploaded:", idPhotoUrl);

      // Prepare verification data with uploaded URLs
      const verificationData = {
        worker_id: workerId,
        selfie_url: selfieUrl,
        id_photo_url: idPhotoUrl,
        submitted_at: new Date().toISOString(),
      };

      console.log("Sending verification data:", verificationData);

      // Get authentication token
      const token = await AsyncStorage.getItem("token");
      console.log("Retrieved token:", token ? "present" : "missing");
      
      if (!token) {
        Alert.alert("Error", "Authentication required. Please log in again.");
        router.push("/(tabs)/login");
        return;
      }

      const response = await axios.post(
        API_ENDPOINTS.WORKER_VERIFY,
        verificationData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      console.log("Verification response:", response.data);
      console.log("Response status:", response.status);
      console.log("Response status type:", typeof response.status);

      if (response.status === 200 || response.status === 201) {
        console.log("SUCCESS CONDITION MET - About to navigate to profile...");
        console.log("Router object:", typeof router);
        console.log("Router.replace method:", typeof router.replace);
        
        try {
          router.replace("/(tabs)/worker-profile");
          console.log("Navigation called successfully");
        } catch (navError) {
          console.error("Navigation failed with error:", navError);
          Alert.alert("Navigation Error", "Failed to navigate to profile page");
        }
      } else {
        console.log("UNEXPECTED RESPONSE STATUS:", response.status);
        Alert.alert("Error", `Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Verification error:", error?.response?.data || error.message || error);
      console.error("Error status:", error?.response?.status);
      console.error("Error details:", error);
      
      let errorMessage = "Could not submit verification. Please try again.";
      
      if (error.message && error.message.includes("Failed to upload")) {
        errorMessage = "Failed to upload images. Please check your connection and try again.";
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error?.response?.status === 403) {
        errorMessage = "You don't have permission to submit verification.";
      }
      
      Alert.alert("Submission Failed", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled = !selfie || !idPhoto || submitting;

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
        <Text style={styles.headerLabel}>Please verify your identity:</Text>

      <View style={styles.imageContainer}>
        {selfie ? (
          <Image source={{ uri: selfie }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePlaceholder}>Upload a clear selfie</Text>
        )}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(setSelfie, "selfie")}
        >
          <Text style={styles.uploadText}>Take Selfie</Text>
        </TouchableOpacity>
        {errors.selfie ? <Text style={styles.errorText}>{errors.selfie}</Text> : null}
      </View>

      <View style={styles.imageContainer}>
        {idPhoto ? (
          <Image source={{ uri: idPhoto }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePlaceholder}>Upload your ID photo</Text>
        )}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(setIdPhoto, "idPhoto")}
        >
          <Text style={styles.uploadText}>Take ID Photo</Text>
        </TouchableOpacity>
        {errors.idPhoto ? <Text style={styles.errorText}>{errors.idPhoto}</Text> : null}
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
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: 120,
    height: 180,
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

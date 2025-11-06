import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Formik } from "formik";
import * as yup from "yup";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../../config/api";
import BottomTab from "../../components/BottomTab";

const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.localStorage.getItem(key));
  } else {
    return AsyncStorage.getItem(key);
  }
};

const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    window.localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

const facilityValidationSchema = yup.object().shape({
  phone_e164: yup.string(),
});

export default function FacilityEdit() {
  const [facility, setFacility] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadFacility();
  }, []);

  const loadFacility = async () => {
    try {
      const storedToken = await getStorageItem("token");
      setToken(storedToken);

      const response = await axios.get(API_ENDPOINTS.FACILITY_PROFILE, {
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
      console.log("Facility response:", JSON.stringify(response.data, null, 2));
      setFacility(response.data);
      setProfileImage(response.data.profile_image_url);
    } catch (error) {
      console.error("Error loading facility:", error);
      Alert.alert("Error", "Failed to load facility data");
    }
  };

  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const currentToken = await getStorageItem("token");
        await uploadImage(imageUri, currentToken);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not select image");
    }
  };

  const uploadImage = async (imageUri: string, currentToken: string | null) => {
    try {
      setUploading(true);

      if (!currentToken) {
        Alert.alert("Error", "Not authenticated. Please login again.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "facility-profile.jpg",
      } as any);

      const uploadResponse = await axios.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const relativeUrl = uploadResponse.data.url || uploadResponse.data.file_url;
      const API_BASE_URL = API_ENDPOINTS.UPLOAD_IMAGE.split("/v1")[0];
      const absoluteUrl = relativeUrl.startsWith("http")
        ? relativeUrl
        : `${API_BASE_URL}${relativeUrl}`;

      setProfileImage(absoluteUrl);
      Alert.alert("Success", "Profile image selected. Click Save to update!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      setUploading(true);
      
      const currentToken = token || await getStorageItem("token");
      if (!currentToken) {
        Alert.alert("Error", "Not authenticated. Please login again.");
        setUploading(false);
        return;
      }
      
      const updateData = {
        legal_name: values.legal_name,
        hq_address_line1: values.address_line1,
        hq_city: values.city,
        hq_state_province: values.state_province,
        hq_postal_code: values.postal_code,
        phone_e164: values.phone_e164,
        profile_image_url: profileImage,
      };

      console.log('PATCH payload:', JSON.stringify(updateData, null, 2));

      console.log("=== FACILITY UPDATE REQUEST ===");
      console.log("Endpoint:", API_ENDPOINTS.FACILITY_PROFILE);
      console.log("Update data:", JSON.stringify(updateData, null, 2));
      console.log("Token:", currentToken ? "EXISTS" : "MISSING");
      console.log("===========================");

      const response = await axios.patch(API_ENDPOINTS.FACILITY_PROFILE, updateData, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      console.log("=== SUCCESS RESPONSE ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));

      Alert.alert("Success", "Profile updated successfully!");
      setFacility(response.data);
      router.replace("/(tabs)/facility-profile");
    } catch (error: any) {
      console.error("Error updating facility:", error?.response?.data || error.message);
      console.log("Error status:", error?.response?.status);
      console.log("Error details:", JSON.stringify(error?.response?.data, null, 2));
      Alert.alert("Error", error?.response?.data?.detail || "Update failed");

      if (error?.response) {
        console.log('PATCH error status:', error.response.status);
        console.log('PATCH error data:', JSON.stringify(error.response.data, null, 2));
        Alert.alert(
          'Update Failed',
          `Status: ${error.response.status}\n${JSON.stringify(error.response.data)}`
        );
      } else {
        console.log('PATCH error:', error.message);
        Alert.alert('Update Failed', error.message);
      }

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        Alert.alert("Authentication Error", "Your session has expired or you are not authorized. Please log in again.");
        return;
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete your profile? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert("Error", "You must be logged in.");
                return;
              }

              await axios.delete(API_ENDPOINTS.FACILITY_DELETE, {
                headers: { Authorization: `Bearer ${token}` },
              });

              Alert.alert("Success", "Your profile has been deleted.", [
                {
                  text: "OK",
                  onPress: async () => {
                    await setStorageItem("token", "");
                    await setStorageItem("userType", "");
                    router.push("index" as any);
                  },
                },
              ]);
            } catch (error: any) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Could not delete profile. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (!facility) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00ced1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
    
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickProfileImage} disabled={uploading}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>
                    {facility.legal_name?.charAt(0) || "?"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {uploading && <ActivityIndicator size="small" color="#00ced1" style={{ marginTop: 10 }} />}
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickProfileImage}
              disabled={uploading}
            >
              <Text style={styles.changePhotoButtonText}>
                {uploading ? "Uploading..." : "Change Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          <Formik
            initialValues={{
              legal_name: facility.legal_name || "",
              email: facility.email || "",
              address_line1: facility.hq_address_line1 || "",
              city: facility.hq_city || "",
              state_province: facility.hq_state_province || "",
              postal_code: facility.hq_postal_code || "",
              phone_e164: facility.phone_e164 || "",
            }}
            validationSchema={facilityValidationSchema}
            onSubmit={handleUpdate}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Company Name</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange("legal_name")}
                    onBlur={handleBlur("legal_name")}
                    value={values.legal_name}
                  />
                  {touched.legal_name && errors.legal_name && (
                    <Text style={styles.errorText}>{String(errors.legal_name)}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, { color: "#999" }]}
                    keyboardType="email-address"
                    value={values.email}
                    editable={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange("address_line1")}
                    onBlur={handleBlur("address_line1")}
                    value={values.address_line1}
                  />
                  {touched.address_line1 && errors.address_line1 && (
                    <Text style={styles.errorText}>{String(errors.address_line1)}</Text>
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
                    <Text style={styles.errorText}>{String(errors.city)}</Text>
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
                    <Text style={styles.errorText}>{String(errors.state_province)}</Text>
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
                    <Text style={styles.errorText}>{String(errors.postal_code)}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange("phone_e164")}
                    onBlur={handleBlur("phone_e164")}
                    value={values.phone_e164}
                  />
                  {touched.phone_e164 && errors.phone_e164 && (
                    <Text style={styles.errorText}>{String(errors.phone_e164)}</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={() => handleSubmit()} disabled={uploading}>
                  <Text style={styles.submitText}>{uploading ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
                  <Text style={styles.deleteButtonText}>Delete Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </ScrollView>
      <BottomTab userType="facility" active="profile" />
    </SafeAreaView>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#00ced1",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
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
    marginBottom: 20,
    textAlign: "center",
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#e0f7fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#00ced1",
  },
  placeholderImage: {
    backgroundColor: "#b2ebf2",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00ced1",
  },
  changePhotoButton: {
    backgroundColor: "#00ced1",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  changePhotoButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#2c3e50",
    fontSize: 14,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#000",
    fontSize: 14,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#00ced1",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#2d7b81ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 1,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

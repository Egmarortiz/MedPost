import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as yup from "yup";
import { Formik } from "formik";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../hooks/useAuth";

const facilityValidationSchema = yup.object().shape({
  legal_name: yup.string().required("Company name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  industry: yup.string().required("Industry is required"),
  bio: yup.string().nullable(),
  phone_e164: yup.string().nullable(),
  company_size_min: yup.string().nullable().transform(val => val === "" ? null : val),
  company_size_max: yup.string().nullable().transform(val => val === "" ? null : val),
  founded_year: yup.string().nullable().transform(val => val === "" ? null : val),
  hq_address_line1: yup.string().nullable(),
  hq_address_line2: yup.string().nullable(),
  hq_city: yup.string().nullable(),
  hq_state_province: yup.string().nullable(),
  hq_postal_code: yup.string().nullable(),
  hq_country: yup.string().nullable(),
});

export default function FacilityRegister() {
  const router = useRouter();
  const { saveToken, saveUser } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [openIndustry, setOpenIndustry] = useState(false);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadFile = async (fileUri: string, endpoint: string) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);

      console.log("Uploading to:", endpoint);
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("File upload response:", response.data);
      const relativeUrl = response.data.url || response.data.file_url;
      const absoluteUrl = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : `${API_BASE_URL}${relativeUrl}`;
      console.log("Absolute URL:", absoluteUrl);
      return absoluteUrl;
    } catch (error: any) {
      console.error("File upload error:", error?.response?.data || error.message);
      throw new Error("file upload failed");
    }
  };

  const handleSubmitForm = async (values: any) => {
    console.log("=== FACILITY REGISTRATION SUBMIT CALLED ===");
    console.log("Form values:", values);
    console.log("API ENDPOINT:", API_ENDPOINTS.FACILITY_REGISTER);

    try {
      console.log("Testing endpoint reachability...");
      try {
        await axios.get(API_ENDPOINTS.FACILITY_REGISTER.replace("/v1/auth/facility/register", "/"));
        console.log("Endpoint is reachable!");
      } catch (e) {
        console.warn("Endpoint test failed, but continuing...");
      }

      let profileImageUrl = null;

      if (image) {
        console.log("Uploading profile image...");
        profileImageUrl = await uploadFile(image, API_ENDPOINTS.UPLOAD_IMAGE);
        console.log("Profile image uploaded:", profileImageUrl);
      }

      const requestData = {
        email: values.email,
        password: values.password,
        legal_name: values.legal_name,
        industry: values.industry,
        bio: values.bio || null,
        profile_image_url: profileImageUrl,
        phone_e164: values.phone_e164 || null,
        company_size_min: values.company_size_min ? parseInt(values.company_size_min) : null,
        company_size_max: values.company_size_max ? parseInt(values.company_size_max) : null,
        founded_year: values.founded_year ? parseInt(values.founded_year) : null,
        hq_address_line1: values.hq_address_line1 || null,
        hq_address_line2: values.hq_address_line2 || null,
        hq_city: values.hq_city || null,
        hq_state_province: values.hq_state_province || null,
        hq_postal_code: values.hq_postal_code || null,
        hq_country: values.hq_country || null,
      };

      console.log("Request payload:", JSON.stringify(requestData, null, 2));
      console.log("Making POST request to:", API_ENDPOINTS.FACILITY_REGISTER);

      const response = await axios.post(
        API_ENDPOINTS.FACILITY_REGISTER,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      console.log("Registration response received:", response.data);

      if (response.status === 201 || response.status === 200) {
        const { access_token, refresh_token, facility_id } = response.data;

        console.log("Extracted data:", { access_token, refresh_token, facility_id });

        await saveToken(access_token);
        await saveUser({
          user_id: facility_id,
          role: "FACILITY",
          facility_id: facility_id,
          worker_id: null,
          email: values.email,
        });

        // Store the userType
        await AsyncStorage.setItem("userType", "facility");

        Alert.alert("Success", "Facility registered successfully!", [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/facility-verification"),
          },
        ]);
      }
    } catch (error: any) {
      console.error("FULL ERROR OBJECT:", error);
      console.error("Error config:", error?.config);
      console.error("Error code:", error?.code);
      console.error("Error status:", error?.response?.status);
      console.error("Error data:", error?.response?.data);
      console.error("Error message:", error?.message);

      if (error.message && error.message.includes("file upload")) {
        Alert.alert("Upload Error", "Failed to upload files. Please try again.");
      } else {
        let errorMsg = "Registration failed. Please try again.";
        
        if (Array.isArray(error?.response?.data?.detail)) {
          errorMsg = error.response.data.detail
            .map((err: any) => `${err.loc?.join(".")} - ${err.msg}`)
            .join("\n");
        } else if (error?.response?.data?.detail) {
          errorMsg = error.response.data.detail;
        } else if (error?.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error?.message) {
          errorMsg = error.message;
        }
        
        Alert.alert("Registration Failed", errorMsg);
      }
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
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.pageHeader}>Tell us about your business:</Text>

      <Formik
        initialValues={{
          legal_name: "",
          email: "",
          password: "",
          industry: "",
          bio: "",
          profile_image_url: "",
          phone_e164: "",
          company_size_min: "",
          company_size_max: "",
          founded_year: "",
          hq_address_line1: "",
          hq_address_line2: "",
          hq_city: "",
          hq_state_province: "",
          hq_postal_code: "",
          hq_country: "",
        }}
        validationSchema={facilityValidationSchema}
        onSubmit={handleSubmitForm}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          values,
          errors,
          touched,
        }) => (
          <>
            <View style={styles.imageContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePlaceholder}>No Image Selected</Text>
              )}
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadText}>Upload Profile Image</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Company Name"
                placeholderTextColor="#aaa"
                onChangeText={handleChange("legal_name")}
                onBlur={handleBlur("legal_name")}
                
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
              />
            </View>

            <View style={[styles.inputContainer, { zIndex: 3000 }]}>
              <Text style={styles.label}>Industry</Text>
              <DropDownPicker
                open={openIndustry}
                value={values.industry}
                items={[
                  { label: "Hospital", value: "HOSPITAL" },
                  { label: "Home Health", value: "HOME HEALTH" },
                  { label: "Senior Care", value: "SENIOR CARE" },
                  { label: "Rehab Center", value: "REHAB CENTER" },
                  { label: "Other", value: "OTHER" },
                ]}
                setOpen={setOpenIndustry}
                setValue={(callback) =>
                  setFieldValue("industry", callback(values.industry))
                }
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select Industry"
                listMode={Platform.OS === "web" ? "MODAL" : "SCROLLVIEW"}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]}
                placeholder="Write a short bio..."
                placeholderTextColor="#aaa"
                multiline
                onChangeText={handleChange("bio")}
                onBlur={handleBlur("bio")}
                value={values.bio}
              />
            </View>

            {[
              { name: "phone_e164", label: "Phone (Optional)" },
              { name: "company_size_min", label: "Company Size (Min)" },
              { name: "company_size_max", label: "Company Size (Max)" },
              { name: "founded_year", label: "Founded Year" },
              { name: "hq_address_line1", label: "Address Line 1" },
              { name: "hq_address_line2", label: "Address Line 2 (Optional)" },
              { name: "hq_city", label: "City" },
              { name: "hq_state_province", label: "State/Province" },
              { name: "hq_postal_code", label: "Postal Code" },
              { name: "hq_country", label: "Country" },
            ].map(({ name, label }) => (
              <View key={name} style={styles.inputContainer}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={label}
                  placeholderTextColor="#aaa"
                  onChangeText={handleChange(name)}
                  onBlur={handleBlur(name)}
                  value={values[name]}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                console.log("Submit button pressed");
                console.log("Current values:", values);
                console.log("Form errors:", errors);
                console.log("Form touched:", touched);
                
                // Check for validation errors
                if (Object.keys(errors).length > 0) {
                  const errorMessages = Object.entries(errors)
                    .map(([field, error]) => `${field}: ${error}`)
                    .join("\n");
                  Alert.alert("Validation Errors", errorMessages);
                  return;
                }
                
                handleSubmit();
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
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
    flexGrow: 1,
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
  pageHeader: {
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
    height: 120,
    borderRadius: 60,
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    height: 45,
    paddingHorizontal: 10,
  },
  dropdown: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dropdownContainer: {
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButton: {
    backgroundColor: "#00ced1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import BottomTab from "../../components/BottomTab";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { Formik } from "formik";
import * as yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

const API_BASE_URL = "https://blithefully-nonamendable-krystin.ngrok-free.dev";

const PUERTO_RICO_MUNICIPALITIES = [
  "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo", "Arroyo",
  "Barceloneta", "Barranquitas", "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas", "Carolina",
  "Cataño", "Cayey", "Ceiba", "Ciales", "Cidra", "Coamo", "Comerío", "Corozal", "Culebra",
  "Dorado", "Fajardo", "Florida", "Guánica", "Guayama", "Guayanilla", "Guaynabo", "Gurabo",
  "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos", "Lajas",
  "Lares", "Las Marías", "Las Piedras", "Loíza", "Luquillo", "Manatí", "Maricao", "Maunabo",
  "Mayagüez", "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis", "Patillas", "Peñuelas",
  "Ponce", "Puerto Real", "Quebradillas", "Rincón", "Río Grande", "Sábana Grande", "Salinas",
  "San Germán", "San Juan", "San Sebastián", "Santa Isabel", "Santo Domingo", "Toa Alta", "Toa Baja",
  "Trujillo Alto", "Utuado", "Vega Alta", "Vega Baja", "Vieques", "Villalba", "Yabucoa", "Yauco",
];

const workerUpdateValidationSchema = yup.object().shape({
  full_name: yup.string().required("Full name is required"),
  phone_e164: yup.string().nullable(),
  title: yup.string().required("Title is required"),
  education_level: yup.string().required("Education level is required"),
  city: yup.string().required("City is required"),
  state_province: yup.string().required("State/Province is required"),
  postal_code: yup
    .number()
    .typeError("Postal code must be a number")
    .required("Postal code is required"),
  bio: yup.string().nullable(),
});

export default function WorkerProfileUpdate() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [openTitle, setOpenTitle] = useState(false);
  const [openEducation, setOpenEducation] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [existingWorker, setExistingWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<string | null>(null);
  const [resumeSelected, setResumeSelected] = useState(false);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("Token exists:", !!token);
        if (!token) {
          Alert.alert("Error", "You must be logged in to edit your profile.");
          router.push("/(tabs)/worker-profile");
          return;
        }

        console.log("Fetching worker profile from:", API_ENDPOINTS.WORKER_PROFILE);
        const response = await axios.get(API_ENDPOINTS.WORKER_PROFILE, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Worker profile fetched successfully:", response.data);
        const data = response.data;
        setExistingWorker(data);
        setImage(data.profile_image_url);
      } catch (error: any) {
        console.error("Error fetching worker:", error?.response?.status, error?.message);
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          Alert.alert("Error", "Your session has expired. Please log in again.");
          router.push("/(tabs)/worker-profile");
        } else {
          console.error("API Error:", error?.response?.data);
          setExistingWorker({
            full_name: "",
            email: "",
            phone_e164: "",
            title: "",
            education_level: "",
            city: "",
            state_province: "",
            postal_code: "",
            bio: "",
          });
          Alert.alert("Error", "Could not load your profile. Using empty form.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "You need to allow access to your photos.");
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

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled) {
        setResume(result.assets[0].uri);
        setResumeSelected(true);
        Alert.alert("Success", "Resume selected successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not select resume document.");
      console.error(error);
    }
  };

  const uploadFile = async (
    fileUri: string,
    endpoint: string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = fileUri.split("/").pop() || "file";
      const match = /\.(\w+)$/.exec(filename);
      const type = match
        ? `${endpoint.includes("image") ? "image" : "application"}/${match[1]}`
        : "application/octet-stream";

      formData.append("file", {
        uri: fileUri,
        name: filename,
        type: type,
      } as any);

      console.log(`Uploading file to ${endpoint}...`);

      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", response.data);

      const relativeUrl = response.data.url;
      const absoluteUrl = relativeUrl.startsWith("http")
        ? relativeUrl
        : `${API_BASE_URL}${relativeUrl}`;

      console.log("Absolute URL:", absoluteUrl);
      return absoluteUrl;
    } catch (error: any) {
      console.error(
        "File upload error:",
        error?.response?.data || error.message
      );
      throw new Error("file upload failed");
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
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert("Error", "You must be logged in.");
                return;
              }

              await axios.delete(API_ENDPOINTS.WORKER_DELETE, {
                headers: { Authorization: `Bearer ${token}` },
              });

              Alert.alert("Success", "Your profile has been deleted.", [
                {
                  text: "OK",
                  onPress: async () => {
                    await AsyncStorage.removeItem("token");
                    await AsyncStorage.removeItem("userType");
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

  const handleUpdateSubmit = async (values: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You must be logged in to update your profile.");
        return;
      }

      let profileImageUrl = null;
      let resumeUrl = null;

      if (image && image.startsWith("file://")) {
        try {
          console.log("Uploading profile image...");
          profileImageUrl = await uploadFile(image, API_ENDPOINTS.UPLOAD_IMAGE);
          console.log("Profile image uploaded:", profileImageUrl);
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert("Error", "Could not upload profile image. Continuing without image...");
        }
      }

      if (resume && resume.startsWith("file://")) {
        try {
          console.log("Uploading resume...");
          resumeUrl = await uploadFile(resume, API_ENDPOINTS.UPLOAD_DOCUMENT);
          console.log("Resume uploaded:", resumeUrl);
        } catch (error) {
          console.error("Error uploading resume:", error);
          Alert.alert("Error", "Could not upload resume. Continuing without resume...");
        }
      }

      const updatedData: any = {
        full_name: values.full_name,
        title: values.title,
        bio: values.bio,
        city: values.city,
        state_province: values.state_province,
        postal_code: String(values.postal_code),
        phone: values.phone_e164 || values.phone,
        education_level: values.education_level,
      };

      if (profileImageUrl) {
        updatedData.profile_image_url = profileImageUrl;
      }

      if (resumeUrl) {
        updatedData.resume_url = resumeUrl;
      }

      console.log("Sending update data:", updatedData);

      const response = await axios.patch(API_ENDPOINTS.WORKER_UPDATE, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (profileImageUrl) {
        setImage(profileImageUrl);
      }

      if (resumeUrl) {
        setResume(resumeUrl);
      }

      Alert.alert("Success", "Profile updated successfully!");
      router.push("/(tabs)/worker-profile");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      console.error("Response data:", error?.response?.data);
      console.error("Response status:", error?.response?.status);
      const errorMessage = error?.response?.data?.detail || "Could not update your profile. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00ced1" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!existingWorker) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No profile data found.</Text>
      </View>
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
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled={true}>
          <Formik
            initialValues={existingWorker}
            validationSchema={workerUpdateValidationSchema}
            onSubmit={handleUpdateSubmit}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
              <>
                <View style={styles.imageContainer}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.imagePlaceholder}>No Image Selected</Text>
                  )}
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Text style={styles.uploadText}>Change Profile Image</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Resume</Text>
                  <Text style={styles.resumeStatus}>
                    {resumeSelected ? "Resume selected" : "No Resume Selected"}
                  </Text>
                  <TouchableOpacity style={styles.resumeUploadButton} onPress={pickResume}>
                    <Text style={styles.resumeUploadText}>Upload Resume</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={values.full_name}
                    onChangeText={handleChange("full_name")}
                    onBlur={handleBlur("full_name")}
                  />
                  {errors.full_name && touched.full_name && typeof errors.full_name === 'string' && <Text style={styles.errorText}>{errors.full_name}</Text>}
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
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={values.phone_e164}
                    onChangeText={handleChange("phone_e164")}
                    onBlur={handleBlur("phone_e164")}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Title</Text>
                  <DropDownPicker
                    open={openTitle}
                    value={values.title}
                    items={[
                      { label: "Registered Nurse", value: "REGISTERED NURSE" },
                      { label: "Licensed Practical Nurse", value: "LICENSED PRACTICAL NURSE" },
                      { label: "Certified Nursing Assistant", value: "CERTIFIED NURSING ASSISTANT" },
                      { label: "Caregiver", value: "CAREGIVER" },
                      { label: "Support Staff", value: "SUPPORT STAFF" },
                    ]}
                    setOpen={setOpenTitle}
                    setValue={(callback) => setFieldValue("title", callback(values.title))}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Select Title"
                    listMode="MODAL"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Education Level</Text>
                  <DropDownPicker
                    open={openEducation}
                    value={values.education_level}
                    items={[
                      { label: "High School", value: "HIGH SCHOOL" },
                      { label: "Associate's Degree", value: "ASSOCIATE'S DEGREE" },
                      { label: "Bachelor's Degree", value: "BACHELOR'S DEGREE" },
                      { label: "Master's Degree", value: "MASTER'S DEGREE" },
                      { label: "Doctorate's Degree", value: "DOCTORATE'S DEGREE" },
                    ]}
                    setOpen={setOpenEducation}
                    setValue={(callback) => setFieldValue("education_level", callback(values.education_level))}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Select Education Level"
                    listMode="MODAL"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Municipality</Text>
                  <DropDownPicker
                    open={openCity}
                    value={values.city}
                    items={PUERTO_RICO_MUNICIPALITIES.map((municipality) => ({
                      label: municipality,
                      value: municipality,
                    }))}
                    setOpen={setOpenCity}
                    setValue={(callback) =>
                      setFieldValue("city", callback(values.city))
                    }
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Select Municipality"
                    listMode="MODAL"
                    searchable={true}
                    searchPlaceholder="Search municipalities..."
                  />
                  {errors.city && touched.city && typeof errors.city === 'string' && <Text style={styles.errorText}>{errors.city}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>State/Province</Text>
                  <TextInput
                    style={styles.input}
                    value={values.state_province}
                    onChangeText={handleChange("state_province")}
                    onBlur={handleBlur("state_province")}
                  />
                    {errors.state_province && touched.state_province && typeof errors.state_province === 'string' && (
                      <Text style={styles.errorText}>{errors.state_province}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={values.postal_code}
                    onChangeText={handleChange("postal_code")}
                    onBlur={handleBlur("postal_code")}
                  />
                    {errors.postal_code && touched.postal_code && typeof errors.postal_code === 'string' && (
                      <Text style={styles.errorText}>{errors.postal_code}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    value={values.bio}
                    onChangeText={handleChange("bio")}
                    onBlur={handleBlur("bio")}
                  />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
                  <Text style={styles.deleteButtonText}>Delete Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.verificationLink}
                  onPress={() => router.push("/(tabs)/admin-verification")}
                >
                  <Text style={styles.verificationLinkText}> Admin Page →</Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </ScrollView>
        <BottomTab userType="worker" active="profile" />
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  resumeUploadButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resumeUploadText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color:  "#2c3e50",
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#000",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    color: "#000",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#fff",
    zIndex: 1000,
  },
  dropdownContainer: {
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    zIndex: 10000,
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
  deleteButton: {
    backgroundColor: "#2d7b81ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resumeStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  verificationLink: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#00ced1",
    backgroundColor: "transparent",
  },
  verificationLinkText: {
    color: "#00ced1",
    fontWeight: "600",
    fontSize: 16,
  },
});

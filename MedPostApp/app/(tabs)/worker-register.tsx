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
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import * as yup from "yup";
import { Formik } from "formik";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";

const PUERTO_RICO_MUNICIPALITIES = [
  "Adjuntas",
  "Aguada",
  "Aguadilla",
  "Aguas Buenas",
  "Aibonito",
  "Añasco",
  "Arecibo",
  "Arroyo",
  "Barceloneta",
  "Barranquitas",
  "Bayamón",
  "Cabo Rojo",
  "Caguas",
  "Camuy",
  "Canóvanas",
  "Carolina",
  "Cataño",
  "Cayey",
  "Ceiba",
  "Ciales",
  "Cidra",
  "Coamo",
  "Comerío",
  "Corozal",
  "Culebra",
  "Dorado",
  "Fajardo",
  "Florida",
  "Guánica",
  "Guayama",
  "Guayanilla",
  "Guaynabo",
  "Gurabo",
  "Hatillo",
  "Hormigueros",
  "Humacao",
  "Isabela",
  "Jayuya",
  "Juana Díaz",
  "Juncos",
  "Lajas",
  "Lares",
  "Las Marías",
  "Las Piedras",
  "Loíza",
  "Luquillo",
  "Manatí",
  "Maricao",
  "Maunabo",
  "Mayagüez",
  "Moca",
  "Morovis",
  "Naguabo",
  "Naranjito",
  "Orocovis",
  "Patillas",
  "Peñuelas",
  "Ponce",
  "Quebradillas",
  "Rincón",
  "Río Grande",
  "Sabana Grande",
  "Salinas",
  "San Germán",
  "San Juan",
  "San Lorenzo",
  "San Sebastián",
  "Santa Isabel",
  "Toa Alta",
  "Toa Baja",
  "Trujillo Alto",
  "Utuado",
  "Vega Alta",
  "Vega Baja",
  "Vieques",
  "Villalba",
  "Yabucoa",
  "Yauco",
];

const workerValidationSchema = yup.object().shape({
  full_name: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().nullable(),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  title: yup.string().required("Career title is required"),
  bio: yup.string().nullable(),
  profile_image_url: yup.string().nullable(),
  resume_url: yup.string().nullable(),
});

export default function WorkerRegister() {
  const [image, setImage] = useState<string | null>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [openTitle, setOpenTitle] = useState(false);
  const [openEducation, setOpenEducation] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const router = useRouter();
  const { saveToken, saveUser } = useAuth();

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
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result && result.assets && result.assets.length > 0) {
        setResume(result.assets[0].uri);
        Alert.alert(
          "Resume Selected",
          result.assets[0].name || result.assets[0].uri
        );
      } else {
        Alert.alert("Error", "Could not select resume document.");
      }
    } catch (err) {
      Alert.alert("Error", "Document picker failed.");
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

  const handleSubmitForm = async (values: any) => {
    console.log("=== FORM SUBMIT CALLED ===");
    console.log("Submitting worker registration:", values);

    try {
      let profileImageUrl = null;
      let resumeUrl = null;

      if (image) {
        console.log("Uploading profile image...");
        profileImageUrl = await uploadFile(image, API_ENDPOINTS.UPLOAD_IMAGE);
        console.log("Profile image uploaded:", profileImageUrl);
      }

      if (resume) {
        console.log("Uploading resume...");
        resumeUrl = await uploadFile(resume, API_ENDPOINTS.UPLOAD_DOCUMENT);
        console.log("Resume uploaded:", resumeUrl);
      }

      const requestData = {
        email: values.email,
        password: values.password,
        phone: values.phone || null,
        full_name: values.full_name,
        title: values.title,
        bio: values.bio || null,
        profile_image_url: profileImageUrl,
        resume_url: resumeUrl,
        city: values.city || null,
        state_province: "Puerto Rico",
        postal_code: values.postal_code || null,
        education_level: values.education_level || "HIGH SCHOOL",
      };

      console.log("Request payload:", requestData);

      const response = await axios.post(
        API_ENDPOINTS.WORKER_REGISTER,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Registration response:", response.data);

      if (response.status === 201 || response.status === 200) {
        const { access_token, refresh_token, worker_id, user_id } =
          response.data;

        console.log("Extracted data:", {
          access_token,
          refresh_token,
          worker_id,
          user_id,
        });

        await saveToken(access_token);
        console.log("Token saved successfully");

        const userData = {
          user_id: user_id,
          role: "WORKER",
          worker_id: worker_id,
          facility_id: null,
          email: values.email,
        };

        console.log("Saving user data:", userData);
        await saveUser(userData);
        console.log("User data saved successfully");

        // Store the userType
        await AsyncStorage.setItem("userType", "worker");

        // Verify it was saved
        const savedUser = await AsyncStorage.getItem("user");
        console.log("Verified saved user:", savedUser);

        Alert.alert(
          "Success",
          "Registration complete! Please verify your identity.",
          [
            {
              text: "OK",
              onPress: () => router.push("/(tabs)/worker-verification"),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error(
        "Registration error:",
        error?.response?.data || error.message || error
      );

      if (error.message && error.message.includes("file upload")) {
        Alert.alert(
          "Upload Error",
          "Failed to upload files. Please try again."
        );
      } else if (error.message && error.message.includes("Network Error")) {
        Alert.alert(
          "Network Error",
          "Cannot reach backend. Please check your connection."
        );
      } else if (error?.response?.data?.detail) {
        const detail = Array.isArray(error.response.data.detail)
          ? JSON.stringify(error.response.data.detail)
          : error.response.data.detail;
        Alert.alert("Registration Failed", detail);
      } else {
        Alert.alert(
          "Error",
          JSON.stringify(error?.response?.data) ||
            "Failed to register. Please try again."
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
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
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.pageHeader}>Tell us about yourself:</Text>
            <Formik
              initialValues={{
                full_name: "",
                email: "",
                phone: "",
                password: "",
                title: "",
                bio: "",
                profile_image_url: "",
                resume_url: "",
                city: "",
                postal_code: "",
                education_level: "",
              }}
              validationSchema={workerValidationSchema}
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
                      <Image
                        source={{ uri: image }}
                        style={styles.imagePreview}
                      />
                    ) : (
                      <Text style={styles.imagePlaceholder}>
                        No Profile Image
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickImage}
                    >
                      <Text style={styles.uploadText}>
                        Upload Profile Image
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.documentContainer}>
                    <Text style={styles.documentPlaceholder}>
                      {resume ? "Resume uploaded" : "No Resume Selected"}
                    </Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickResume}
                    >
                      <Text style={styles.uploadText}>Upload Resume (PDF)</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#aaa"
                      onChangeText={handleChange("full_name")}
                      onBlur={handleBlur("full_name")}
                      value={values.full_name}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#aaa"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      value={values.email}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#aaa"
                      secureTextEntry
                      autoCapitalize="none"
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      value={values.password}
                    />
                    {touched.password && errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Career Title</Text>
                    <DropDownPicker
                      open={openTitle}
                      value={values.title}
                      items={[
                        {
                          label: "Registered Nurse (RN)",
                          value: "REGISTERED NURSE",
                        },
                        {
                          label: "Licensed Practical Nurse (LPN)",
                          value: "LICENSED PRACTICAL NURSE",
                        },
                        {
                          label: "Certified Nursing Assistant (CNA)",
                          value: "CERTIFIED NURSING ASSISTANT",
                        },
                        { label: "Caregiver", value: "CAREGIVER" },
                        { label: "Support Staff", value: "SUPPORT STAFF" },
                      ]}
                      setOpen={setOpenTitle}
                      setValue={(callback) =>
                        setFieldValue("title", callback(values.title))
                      }
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholder="Select Title"
                      listMode="MODAL"
                    />
                  </View>

                  <View style={[styles.inputContainer, { zIndex: 2000 }]}>
                    <Text style={styles.label}>Education Level</Text>
                    <DropDownPicker
                      open={openEducation}
                      value={values.education_level}
                      items={[
                        { label: "High School", value: "HIGH SCHOOL" },
                        {
                          label: "Associate's Degree",
                          value: "ASSOCIATE'S DEGREE",
                        },
                        {
                          label: "Bachelor's Degree",
                          value: "BACHELOR'S DEGREE",
                        },
                        { label: "Master's Degree", value: "MASTER'S DEGREE" },
                        { label: "Doctorate", value: "DOCTORATE" },
                      ]}
                      setOpen={setOpenEducation}
                      setValue={(callback) =>
                        setFieldValue(
                          "education_level",
                          callback(values.education_level)
                        )
                      }
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholder="Select Education Level"
                      listMode="MODAL"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { height: 100, textAlignVertical: "top" },
                      ]}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor="#aaa"
                      multiline
                      onChangeText={handleChange("bio")}
                      onBlur={handleBlur("bio")}
                      value={values.bio}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#aaa"
                      keyboardType="phone-pad"
                      onChangeText={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      value={values.phone}
                    />
                  </View>

                  {/* City Dropdown */}
                  <View style={[styles.inputContainer, { zIndex: 3000 }]}>
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
                  </View>

                  {(
                    [{ name: "postal_code", label: "Postal Code" }] as const
                  ).map(({ name, label }) => (
                    <View key={name} style={styles.inputContainer}>
                      <Text style={styles.label}>{label}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={label}
                        placeholderTextColor="#aaa"
                        onChangeText={handleChange(name)}
                        onBlur={handleBlur(name)}
                        value={values[name as keyof typeof values] as string}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => {
                      console.log("=== SUBMIT BUTTON CLICKED ===");
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#00ced1",
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
  documentContainer: { marginBottom: 20 },
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  pageHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2c3e50",
  },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  imagePreview: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  imagePlaceholder: { color: "#888", marginBottom: 10 },
  documentPlaceholder: { color: "#888", marginBottom: 10, fontStyle: "italic" },
  resumeStatus: { color: "#888", marginBottom: 10, fontStyle: "italic" },
  uploadButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadText: { color: "#fff", fontWeight: "bold" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#2c3e50" },
  inputContainer: { marginBottom: 15 },
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
  },
  submitButton: {
    backgroundColor: "#00ced1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});

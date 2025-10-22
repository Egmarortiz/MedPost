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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { Formik } from "formik";
import * as yup from "yup";
import axios from "axios";

const workerUpdateValidationSchema = yup.object().shape({
  full_name: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
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
  const [workerData, setWorkerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openTitle, setOpenTitle] = useState(false);
  const [openEducation, setOpenEducation] = useState(false);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000");
        setWorkerData(response.data);
        setImage(response.data.profile_image_url);
      } catch (error) {
        Alert.alert("Error", "Unable to load worker profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, []);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdateSubmit = async (values: any) => {
    try {
      const updatedData = { ...values, profile_image_url: image };
      await axios.put("http://127.0.0.1:8000", updatedData);
      Alert.alert("Success", "Profile updated successfully!");
      router.push("/profile");
    } catch (error) {
      Alert.alert(
        "Update Failed",
        "Something went wrong while updating your profile."
      );
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  if (!workerData) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>No profile data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Update Your Profile</Text>

      <Formik
        initialValues={{
          full_name: workerData.full_name || "",
          email: workerData.email || "",
          phone_e164: workerData.phone_e164 || "",
          title: workerData.title || "",
          education_level: workerData.education_level || "",
          city: workerData.city || "",
          state_province: workerData.state_province || "",
          postal_code: workerData.postal_code || "",
          bio: workerData.bio || "",
        }}
        validationSchema={workerUpdateValidationSchema}
        onSubmit={handleUpdateSubmit}
        enableReinitialize
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
                <Text style={styles.uploadText}>Change Profile Image</Text>
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
              {errors.full_name && touched.full_name && (
                <Text style={styles.errorText}>{errors.full_name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                value={values.email}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
              />
              {errors.email && touched.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
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
                  { label: "Registered Nurse", value: "Registered Nurse" },
                  {
                    label: "Licensed Practical Nurse",
                    value: "Licensed Practical Nurse",
                  },
                  {
                    label: "Certified Nursing Assistant",
                    value: "Certified Nursing Assistant",
                  },
                  { label: "Caregiver", value: "Caregiver" },
                  { label: "Support", value: "Support" },
                ]}
                setOpen={setOpenTitle}
                setValue={(callback) =>
                  setFieldValue("title", callback(values.title))
                }
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select Title"
                zIndex={3000}
                zIndexInverse={1000}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Education Level</Text>
              <DropDownPicker
                open={openEducation}
                value={values.education_level}
                items={[
                  { label: "High School", value: "High School" },
                  { label: "Associate's Degree", value: "Associate's Degree" },
                  { label: "Bachelor's Degree", value: "Bachelor's Degree" },
                  { label: "Master's Degree", value: "Master's Degree" },
                  { label: "Doctorate's Degree", value: "Doctorate's Degree" },
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
                zIndex={2000}
                zIndexInverse={2000}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={values.city}
                onChangeText={handleChange("city")}
                onBlur={handleBlur("city")}
              />
              {errors.city && touched.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State/Province</Text>
              <TextInput
                style={styles.input}
                value={values.state_province}
                onChangeText={handleChange("state_province")}
                onBlur={handleBlur("state_province")}
              />
              {errors.state_province && touched.state_province && (
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
              {errors.postal_code && touched.postal_code && (
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
  },
  dropdownContainer: {
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
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

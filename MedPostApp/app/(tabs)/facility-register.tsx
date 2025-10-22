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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as yup from "yup";
import { Formik } from "formik";
import DropDownPicker from "react-native-dropdown-picker";

const facilityValidationSchema = yup.object().shape({
  legal_name: yup.string().required("Legal name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  industry: yup.string().required("Industry is required"),
  bio: yup.string().nullable(),
  profile_image_url: yup.string().url("Invalid URL").nullable(),
  phone_e164: yup.string().nullable(),
  company_size: yup
    .number()
    .typeError("Company size must be a number")
    .required("Company size is required"),
  founded_year: yup
    .number()
    .typeError("Founded year must be a number")
    .required("Founded year is required"),
  address_line1: yup.string().required("Address Line 1 is required"),
  address_line2: yup.string().nullable(),
  city: yup.string().required("City is required"),
  state_province: yup.string().required("State/Province is required"),
  postal_code: yup
    .number()
    .typeError("Postal code must be a number")
    .required("Postal code is required"),
  country: yup.string().required("Country is required"),
});

export default function FacilityRegister() {
  const router = useRouter();
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmitForm = (values: any) => {
    const formData = { ...values, profile_image_url: image };
    Alert.alert("Facility Registration", JSON.stringify(formData, null, 2));
    router.push("/");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Tell us about your business:</Text>

      <Formik
        initialValues={{
          legal_name: "",
          email: "",
          password: "",
          industry: "",
          bio: "",
          profile_image_url: "",
          phone_e164: "",
          company_size: "",
          founded_year: "",
          address_line1: "",
          address_line2: "",
          city: "",
          state_province: "",
          postal_code: "",
          country: "",
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
                value={values.legal_name}
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
                  { label: "Hospital", value: "Hospital" },
                  { label: "Senior Care", value: "Senior Care" },
                  { label: "Home Health", value: "Home Health" },
                  { label: "Rehab Facility", value: "Rehab Facility" },
                  { label: "Mental Health", value: "Mental Health" },
                  { label: "Specialty Clinic", value: "Specialty Clinic" },
                  { label: "Other", value: "Other" },
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
              { name: "company_size", label: "Company Size" },
              { name: "founded_year", label: "Founded Year" },
              { name: "address_line1", label: "Address Line 1" },
              { name: "address_line2", label: "Address Line 2 (Optional)" },
              { name: "city", label: "City" },
              { name: "state_province", label: "State/Province" },
              { name: "postal_code", label: "Postal Code" },
              { name: "country", label: "Country" },
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
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>Submit</Text>
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

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
} from "react-native";
import { Formik } from "formik";
import * as yup from "yup";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";

const jobPostSchema = yup.object().shape({
  position_title: yup.string().required("Position title is required"),
  employment_type: yup.string().required("Employment type is required"),
  compensation_type: yup.string().required("Compensation type is required"),
  description: yup.string().required("Description is required"),
  city: yup.string().required("City is required"),
  state_province: yup.string().required("State/Province is required"),
  postal_code: yup.string().required("Postal code is required"),
});

export default function JobPost() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(true);

  const [employmentOpen, setEmploymentOpen] = useState(false);
  const [compensationOpen, setCompensationOpen] = useState(false);

  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [compensationType, setCompensationType] = useState<string | null>(null);

  const employmentItems = [
    { label: "Full Time", value: "FULL TIME" },
    { label: "Part Time", value: "PART TIME" },
  ];

  const compensationItems = [
    { label: "Hourly", value: "HOURLY" },
    { label: "Monthly", value: "MONTHLY" },
    { label: "Yearly", value: "YEARLY" },
  ];

  const handleSubmitForm = (values: any) => {
    const jobData = { ...values, is_active: isActive };
    Alert.alert("Job Post Created", JSON.stringify(jobData, null, 2));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create Job Post</Text>

      <Formik
        initialValues={{
          position_title: "",
          employment_type: "",
          compensation_type: "",
          description: "",
          city: "",
          state_province: "",
          postal_code: "",
          hourly_min: "",
          hourly_max: "",
          monthly_min: "",
          monthly_max: "",
          yearly_min: "",
          yearly_max: "",
        }}
        validationSchema={jobPostSchema}
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Position Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Registered Nurse"
                placeholderTextColor="#999"
                onChangeText={handleChange("position_title")}
                onBlur={handleBlur("position_title")}
                value={values.position_title}
              />
              {touched.position_title && errors.position_title && (
                <Text style={styles.errorText}>{errors.position_title}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Employment Type</Text>
              <DropDownPicker
                open={employmentOpen}
                value={employmentType}
                items={employmentItems}
                setOpen={setEmploymentOpen}
                setValue={(val) => {
                  setEmploymentType(val());
                  setFieldValue("employment_type", val());
                }}
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                placeholder="Select employment type"
              />
              {touched.employment_type && errors.employment_type && (
                <Text style={styles.errorText}>{errors.employment_type}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Compensation Type</Text>
              <DropDownPicker
                open={compensationOpen}
                value={compensationType}
                items={compensationItems}
                setOpen={setCompensationOpen}
                setValue={(val) => {
                  setCompensationType(val());
                  setFieldValue("compensation_type", val());
                }}
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                placeholder="Select compensation type"
              />
              {touched.compensation_type && errors.compensation_type && (
                <Text style={styles.errorText}>{errors.compensation_type}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe job responsibilities, qualifications, etc."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
                onChangeText={handleChange("description")}
                onBlur={handleBlur("description")}
                value={values.description}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#999"
                onChangeText={handleChange("city")}
                onBlur={handleBlur("city")}
                value={values.city}
              />
              {touched.city && errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State / Province</Text>
              <TextInput
                style={styles.input}
                placeholder="State or Province"
                placeholderTextColor="#999"
                onChangeText={handleChange("state_province")}
                onBlur={handleBlur("state_province")}
                value={values.state_province}
              />
              {touched.state_province && errors.state_province && (
                <Text style={styles.errorText}>{errors.state_province}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Postal Code"
                placeholderTextColor="#999"
                onChangeText={handleChange("postal_code")}
                onBlur={handleBlur("postal_code")}
                value={values.postal_code}
              />
              {touched.postal_code && errors.postal_code && (
                <Text style={styles.errorText}>{errors.postal_code}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Compensation Range</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  onChangeText={handleChange(
                    `${compensationType?.toLowerCase()}_min`
                  )}
                  value={values[`${compensationType?.toLowerCase()}_min`]}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Max"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  onChangeText={handleChange(
                    `${compensationType?.toLowerCase()}_max`
                  )}
                  value={values[`${compensationType?.toLowerCase()}_max`]}
                />
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Active</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>

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
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dropdownContainer: {
    borderColor: "#ddd",
    backgroundColor: "#fff",
    zIndex: 1000,
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

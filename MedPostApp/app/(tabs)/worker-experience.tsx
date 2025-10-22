import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as yup from "yup";
import { useRouter } from "expo-router";

const experienceValidationSchema = yup.object().shape({
  company_name: yup.string().required("Company name is required"),
  position_title: yup.string().required("Position title is required"),
  start_date: yup.string().required("Start date is required"),
  end_date: yup.string().required("End date is required"),
  description: yup.string().required("Description is required"),
});

export default function Experience() {
  const router = useRouter();

  const handleSubmitForm = (values: any) => {
    Alert.alert("Experience Submitted", JSON.stringify(values, null, 2));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Formik
        initialValues={{
          company_name: "",
          position_title: "",
          start_date: "",
          end_date: "",
          description: "",
        }}
        validationSchema={experienceValidationSchema}
        onSubmit={handleSubmitForm}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor="#999"
                onChangeText={handleChange("company_name")}
                onBlur={handleBlur("company_name")}
                value={values.company_name}
              />
              {touched.company_name && errors.company_name && (
                <Text style={styles.errorText}>{errors.company_name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Position Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your title"
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
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
                onChangeText={handleChange("start_date")}
                onBlur={handleBlur("start_date")}
                value={values.start_date}
              />
              {touched.start_date && errors.start_date && (
                <Text style={styles.errorText}>{errors.start_date}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
                onChangeText={handleChange("end_date")}
                onBlur={handleBlur("end_date")}
                value={values.end_date}
              />
              {touched.end_date && errors.end_date && (
                <Text style={styles.errorText}>{errors.end_date}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your responsibilities and achievements"
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
    color: "#000",
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

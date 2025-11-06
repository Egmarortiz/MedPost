import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Formik } from "formik";
import * as yup from "yup";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../../config/api";
import BottomTab from "../../components/BottomTab";

const experienceValidationSchema = yup.object().shape({
  company_name: yup.string().required("Company name is required"),
  position_title: yup.string().required("Position title is required"),
  start_date: yup.string().required("Start date is required").matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  end_date: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable(),
  description: yup.string().required("Description is required"),
});

const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, monthRaw] = dateString.split("-");
    const month = monthRaw.padStart(2, "0").slice(0, 2);
    const monthIndex = Math.max(0, Math.min(11, parseInt(month, 10) - 1));
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return `Invalid ${year}`;
    return `${monthNames[monthIndex]} ${year}`;
  } catch {
    return dateString;
  }
};

export default function Experience() {
  const router = useRouter();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const getWorkerInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(API_ENDPOINTS.WORKER_PROFILE, {
        headers: token ? {
          "Authorization": `Bearer ${token}`
        } : {}
      });
      setWorkerId(response.data.id);
      // Load existing experiences
      console.log("[worker-experience] API experiences:", response.data.experiences);
      if (response.data.experiences) {
        setExperiences(response.data.experiences);
        console.log("[worker-experience] setExperiences:", response.data.experiences);
      } else {
        setExperiences([]);
        console.log("[worker-experience] setExperiences: []");
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch worker information");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWorkerInfo();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      getWorkerInfo();
    }, [])
  );

  const handleExperienceSubmit = async (values: any) => {
    if (!workerId) {
      Alert.alert("Error", "Worker ID not found");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      
      const payload = {
        company_name: values.company_name,
        position_title: values.position_title,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        description: values.description,
      };

      console.log("Submitting payload:", payload);

      const response = await axios.post(
        `${API_ENDPOINTS.WORKER_PROFILE.replace('/me', '')}/${workerId}/experiences`,
        payload,
        {
          headers: token ? {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          } : {}
        }
      );
      if (response.status === 201 || response.status === 200) {
        setExperiences([...experiences, response.data]);
        Alert.alert("Success", "Experience added!");
        router.replace("/(tabs)/worker-profile");
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || JSON.stringify(error?.response?.data) || "Failed to submit experience."
      );
      console.error("Error details:", error?.response?.data);
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    Alert.alert(
      "Delete Experience",
      "Are you sure you want to delete this experience?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setDeleting(experienceId);
              const token = await AsyncStorage.getItem("token");
              await axios.delete(
                `${API_ENDPOINTS.WORKER_PROFILE.replace('/me', '')}/${workerId}/experiences/${experienceId}`,
                {
                  headers: token ? {
                    "Authorization": `Bearer ${token}`
                  } : {}
                }
              );
              setExperiences(experiences.filter(exp => exp.id !== experienceId));
              Alert.alert("Success", "Experience deleted!");
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete experience");
              console.error(error);
            } finally {
              setDeleting(null);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/MedPost-Icon.png")}
            style={styles.headerLogo}
          />
          <View style={styles.headerSpacer} />
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <ScrollView
              style={{ flex: 1, backgroundColor: '#fff' }}
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
            >
              {/* Existing Experiences Section */}
              {experiences.length > 0 && (
                <View>
                  {experiences.map((exp: any) => (
                    <View key={exp.id} style={styles.experienceCard}>
                      <View style={styles.experienceHeader}>
                        <View style={styles.experienceInfo}>
                          <Text style={styles.experiencePosition}>{exp.position_title}</Text>
                          <Text style={styles.experienceCompany}>{exp.company_name}</Text>
                          <Text style={styles.experienceDate}>
                            {exp.start_date && formatDateDisplay(exp.start_date)}
                            {' - '}
                            {exp.end_date 
                              ? formatDateDisplay(exp.end_date)
                              : 'Present'}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => handleDeleteExperience(exp.id)}
                          disabled={deleting === exp.id}
                        >
                          {deleting === exp.id ? (
                            <ActivityIndicator size="small" color="#dc3545" />
                          ) : (
                            <Text style={styles.deleteButton}>✕</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      {exp.description && (
                        <Text style={styles.experienceDescription}>{exp.description}</Text>
                      )}
                    </View>
                  ))}
                  <Text style={styles.sectionDivider}>Add More Experience</Text>
                </View>
              )}

              <Formik
                initialValues={{
                  company_name: "",
                  position_title: "",
                  start_date: "",
                  end_date: "",
                  description: "",
                }}
                validationSchema={experienceValidationSchema}
                onSubmit={handleExperienceSubmit}
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
                      <Text style={styles.label}>End Date <Text style={styles.optionalText}>(Optional - leave blank if current)</Text></Text>
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
                      onPress={() => handleSubmit()}
                    >
                      <Text style={styles.submitText}>Submit</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
        <BottomTab userType="worker" active="profile" />
      </SafeAreaView>
    </>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#999",
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
  experienceCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#00ced1",
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  experienceInfo: {
    flex: 1,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 4,
    fontWeight: "500",
  },
  experienceDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  experienceDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 8,
  },
  deleteButton: {
    fontSize: 24,
    color: "#dc3545",
    fontWeight: "bold",
    padding: 8,
  },
  sectionDivider: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginVertical: 20,
    textAlign: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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

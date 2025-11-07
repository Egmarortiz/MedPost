
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import BottomTab from "../../components/BottomTab";
import { Ionicons } from "@expo/vector-icons";

export default function WorkerApplicationPage() {
  const router = useRouter();
  const { jobId, facilityId } = useLocalSearchParams();
  
  const [job, setJob] = useState<any>(null);
  const [facility, setFacility] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workerData, setWorkerData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        
        // Fetch job details
        const jobRes = await axios.get(`${API_ENDPOINTS.JOB_GET}${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJob(jobRes.data);

        // Fetch facility details
        if (facilityId) {
          const facilityRes = await axios.get(
            `${API_BASE_URL}/v1/facilities/${facilityId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setFacility(facilityRes.data);
        }

        try {
          const workerRes = await axios.get(`${API_BASE_URL}/v1/workers/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWorkerData(workerRes.data);
          
          if (workerRes.data.phone_e164) {
            setPhoneE164(workerRes.data.phone_e164);
          }
          if (workerRes.data.email) {
            setEmail(workerRes.data.email);
          }
        } catch (workerError: any) {
          console.warn("Failed to fetch worker profile:", workerError.response?.data || workerError.message);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId, facilityId]);

  const handleSubmitApplication = async () => {
    if (!email) {
      Alert.alert("Validation Error", "Please provide your email address");
      return;
    }

    if (!phoneE164) {
      Alert.alert("Validation Error", "Please provide your phone number");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const payload = {
        job_post_id: jobId,
        worker_id: workerData?.id,
        answer_text: answerText || null,
        phone_e164: phoneE164,
        email: email,
      };

      // Debug, log payload and endpoint
      console.log('Submitting application to:', `${API_ENDPOINTS.JOB_APPLY}${jobId}/apply`);
      console.log('Payload:', payload);

      const response = await axios.post(
        `${API_ENDPOINTS.JOB_APPLY}${jobId}/apply`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        "Success",
        "Your application has been submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/worker-home"),
          },
        ]
      );
    } catch (error: any) {
      if (error.response) {
        console.error("Application error:", error.response.data);
        let errorMsg = "Failed to submit application";
        if (Array.isArray(error.response.data?.detail)) {
          errorMsg = error.response.data.detail.map((e: any) => `${e.loc?.join('.') || ''}: ${e.msg}`).join('\n');
        } else if (typeof error.response.data?.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
        Alert.alert("Error", errorMsg);
      } else {
        console.error("Application error:", error.message);
        Alert.alert("Error", error.message || "Failed to submit application");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Image
            source={require("../../assets/images/MedPost-Icon.png")}
            style={styles.headerLogo}
          />
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00ced1" />
        </View>
        <BottomTab userType="worker" active="home" />
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
        <View style={styles.headerSpacer} />
        <Image
          source={require("../../assets/images/MedPost-Icon.png")}
          style={styles.headerLogo}
        />
        <View style={styles.headerSpacer} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container}>
        {job && (
          <View>
            {/* Job Card */}
            <View style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.position_title}</Text>
                {job.is_active && (
                  <View style={[styles.statusBadge, styles.activeBadge]}>
                    <Text style={[styles.statusText, { color: '#155724' }]}>Active</Text>
                  </View>
                )}
              </View>
              {facility && (
                <Text style={styles.facilityName}>{facility.legal_name}</Text>
              )}
              <Text style={styles.jobDetail}>
                {job.employment_type ? job.employment_type.replace("_", " ") : "N/A"} • {job.compensation_type || "N/A"}
              </Text>
              {(() => {
                let min, max;
                if (job.compensation_type === 'HOURLY') {
                  min = job.hourly_min;
                  max = job.hourly_max;
                } else if (job.compensation_type === 'MONTHLY') {
                  min = job.monthly_min;
                  max = job.monthly_max;
                } else if (job.compensation_type === 'YEARLY') {
                  min = job.yearly_min;
                  max = job.yearly_max;
                }
                if (min || max) {
                  return (
                    <Text style={styles.compensationDisplay}>
                      ${min}
                      {max && min !== max ? ` - $${max}` : ""}
                    </Text>
                  );
                }
                return null;
              })()}
              {job.city && job.state_province && (
                <Text style={styles.jobLocation}>📍 {job.city}, {job.state_province}</Text>
              )}
              {job.description && (
                <Text style={styles.jobDescription} numberOfLines={2}>
                  {job.description}
                </Text>
              )}
            </View>

            {/* Application Form */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Your Application</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!submitting}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  value={phoneE164}
                  onChangeText={setPhoneE164}
                  keyboardType="phone-pad"
                  editable={!submitting}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cover Letter (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us why you're interested in this position..."
                  value={answerText}
                  onChangeText={setAnswerText}
                  multiline
                  numberOfLines={6}
                  editable={!submitting}
                  placeholderTextColor="#999"
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitApplication}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        </ScrollView>
      </View>
      <BottomTab userType="worker" active="home" />
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#00ced1",
    borderBottomWidth: 1,
    borderBottomColor: "#00ced1",
  },
  backButton: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
    paddingHorizontal: 8,
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  headerSpacer: {
    width: 60,
  },
  container: { 
    flex: 1,
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8f9fa"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  jobCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  jobPostal: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  compensationSection: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#00ced1",
  },
  compensationLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  compensationValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  descriptionSection: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#00ced1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 10,
    lineHeight: 24,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: "#d4edda",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  jobDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  jobLocation: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 8,
    lineHeight: 20,
  },
  jobDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  facilityName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 20,
  },
  compensationDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 10,
    lineHeight: 22,
  },
});

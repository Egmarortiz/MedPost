import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";
import BottomTab from "../../components/BottomTab";
import { API_ENDPOINTS } from "../../config/api";

const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.localStorage.getItem(key));
  } else {
    return AsyncStorage.getItem(key);
  }
};

interface JobPostFormProps {
  onSubmit?: (data: any) => void;
  userType?: "worker" | "facility";
  hasApplied?: boolean;
  initialData?: any;
}

const JobPostForm: React.FC<JobPostFormProps> = ({
  onSubmit,
  userType = "facility",
  hasApplied = false,
  initialData = {},
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const [positionTitle, setPositionTitle] = useState(
    initialData.position_title || ""
  );
  const [employmentType, setEmploymentType] = useState(
    initialData.employment_type || null
  );
  const [compensationType, setCompensationType] = useState(
    initialData.compensation_type || null
  );
  const [compensationMin, setCompensationMin] = useState(
    initialData.compensation_min || ""
  );
  const [compensationMax, setCompensationMax] = useState(
    initialData.compensation_max || ""
  );
  const [description, setDescription] = useState(initialData.description || "");
  const [city, setCity] = useState(initialData.city || "");
  const [stateProvince, setStateProvince] = useState(
    initialData.state_province || ""
  );
  const [postalCode, setPostalCode] = useState(initialData.postal_code || "");
  const [isActive, setIsActive] = useState(initialData.is_active ?? true);

  const [employmentOpen, setEmploymentOpen] = useState(false);
  const [compensationOpen, setCompensationOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const employmentOptions = [
    { label: "Full Time", value: "FULL_TIME" },
    { label: "Part Time", value: "PART_TIME" },
  ];

  const compensationOptions = [
    { label: "Hourly", value: "HOURLY" },
    { label: "Monthly", value: "MONTHLY" },
    { label: "Yearly", value: "YEARLY" },
  ];

  const jobStatusOptions = [
    { label: "Active", value: true },
    { label: "Closed", value: false },
  ];

  // Load posted jobs and facility info on mount
  useEffect(() => {
    loadJobsAndFacility();
  }, []);

  // Refresh verification status when page comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Job post page focused - refreshing verification status");
      loadJobsAndFacility();
    }, [])
  );

  const loadJobsAndFacility = async () => {
    try {
      setLoading(true);
      const storageToken = await getStorageItem("token");
      let facilityData: any = null;

      // Get facility info
      try {
        const facilityResponse = await axios.get(
          API_ENDPOINTS.FACILITY_PROFILE,
          {
            headers: storageToken
              ? { Authorization: `Bearer ${storageToken}` }
              : {},
          }
        );
        console.log("Facility profile loaded:", facilityResponse.data);
        facilityData = facilityResponse.data;
        setFacilityId(facilityResponse.data.id);
        setIsVerified(facilityResponse.data.is_verified || false);
        console.log("Is verified:", facilityResponse.data.is_verified);
      } catch (facilityError: any) {
        console.error(
          "Error fetching facility profile:",
          facilityError?.response?.data || facilityError.message
        );
        if (facilityError?.response?.status === 401) {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please logout and login again to refresh your account."
          );
          return;
        }
        throw facilityError;
      }

      // Get jobs
      const jobsResponse = await axios.get(API_ENDPOINTS.JOBS_LIST, {
        headers: storageToken
          ? { Authorization: `Bearer ${storageToken}` }
          : {},
      });

      // Filter jobs by this facility ID
      const facilityJobs = jobsResponse.data.filter(
        (job: any) => job.facility_id === facilityData.id
      );
      setJobsList(facilityJobs || []);
    } catch (error: any) {
      console.error("Error loading jobs:", error);
      Alert.alert("Error", "Could not load your posted jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isVerified) {
      Alert.alert(
        "Verification Required",
        "Your facility must be verified before posting jobs. Please complete the verification process."
      );
      return;
    }

    if (
      !positionTitle ||
      !employmentType ||
      !compensationType ||
      !description
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!facilityId) {
      Alert.alert("Error", "Facility information not loaded");
      return;
    }

    setLoading(true);
    try {
      const storageToken = await getStorageItem("token");

      // Map compensation_min and compensation_max based on type
      const minAmount = compensationMin ? parseFloat(compensationMin) : null;
      const maxAmount = compensationMax ? parseFloat(compensationMax) : null;

      const baseData: any = {
        facility_id: facilityId,
        position_title: positionTitle,
        employment_type: employmentType,
        compensation_type: compensationType,
        description,
        city: city || "",
        state_province: stateProvince || "",
        postal_code: postalCode || "",
        is_active: isActive,
      };

      // Add the appropriate min/max fields based on compensation type
      if (minAmount !== null || maxAmount !== null) {
        if (compensationType === "HOURLY") {
          baseData.hourly_min = minAmount;
          baseData.hourly_max = maxAmount;
        } else if (compensationType === "MONTHLY") {
          baseData.monthly_min = minAmount;
          baseData.monthly_max = maxAmount;
        } else if (compensationType === "YEARLY") {
          baseData.yearly_min = minAmount;
          baseData.yearly_max = maxAmount;
        }
      }

      console.log("Posting to:", API_ENDPOINTS.JOB_CREATE);
      console.log("With data:", JSON.stringify(baseData, null, 2));

      const response = await axios.post(API_ENDPOINTS.JOB_CREATE, baseData, {
        headers: storageToken
          ? {
              Authorization: `Bearer ${storageToken}`,
              "Content-Type": "application/json",
            }
          : {},
      });

      console.log("Success! Response:", response.status);

      Alert.alert("Success", "Job posted successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(tabs)/facility-profile");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error:", error.message);
      console.error("Status:", error?.response?.status);
      console.error("Data:", error?.response?.data);

      const msg =
        error?.response?.data?.detail || error?.message || "Failed to post job";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    Alert.alert(
      "Delete Job",
      "Are you sure you want to delete this job posting?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(jobId);
              const storageToken = await getStorageItem("token");

              await axios.delete(`${API_ENDPOINTS.JOBS_LIST}/${jobId}`, {
                headers: storageToken
                  ? { Authorization: `Bearer ${storageToken}` }
                  : {},
              });

              Alert.alert("Success", "Job deleted successfully!");
              await loadJobsAndFacility();
            } catch (error: any) {
              console.error("Error deleting job:", error);
              Alert.alert("Error", "Could not delete job.");
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleJobStatus = async (jobId: string, newStatus: boolean) => {
    try {
      setDeleting(jobId);
      const storageToken = await getStorageItem("token");

      await axios.patch(
        `${API_ENDPOINTS.JOBS_LIST}${jobId}`,
        { is_active: newStatus },
        {
          headers: storageToken
            ? { Authorization: `Bearer ${storageToken}` }
            : {},
        }
      );

      Alert.alert("Success", newStatus ? "Job reopened!" : "Job closed!");
      await loadJobsAndFacility();
    } catch (error: any) {
      console.error("Error updating job:", error);
      Alert.alert("Error", "Could not update job status.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/facility-profile")}
          >
            <Text style={styles.backButton}>‹</Text>
          </TouchableOpacity>
          <Image
            source={require("../../assets/images/MedPost-Icon.png")}
            style={styles.headerLogo}
          />
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.container, styles.center]}>
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
          <View style={styles.headerSpacer} />
        </View>
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <ScrollView style={styles.container}>
            <Text style={styles.pageTitle}>Post New Job</Text>

            {jobsList.length > 0 && (
              <View>
                <Text style={styles.headerLabel}>Your Posted Jobs</Text>
                {jobsList.map((job, index) => (
                  <View key={job.id || index} style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobTitle}>{job.position_title}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          job.is_active
                            ? styles.activeBadge
                            : styles.closedBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: job.is_active ? "#155724" : "#721c24" },
                          ]}
                        >
                          {job.is_active ? "Active" : "Closed"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.jobDetail}>
                      {job.employment_type
                        ? job.employment_type.replace("_", " ")
                        : "N/A"}{" "}
                      • {job.compensation_type || "N/A"}
                    </Text>

                    {(() => {
                      let min, max;
                      if (job.compensation_type === "HOURLY") {
                        min = job.hourly_min;
                        max = job.hourly_max;
                      } else if (job.compensation_type === "MONTHLY") {
                        min = job.monthly_min;
                        max = job.monthly_max;
                      } else if (job.compensation_type === "YEARLY") {
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
                      <Text style={styles.jobLocation}>
                        {job.city}, {job.state_province}
                      </Text>
                    )}

                    {job.description && (
                      <Text style={styles.jobDescription} numberOfLines={2}>
                        {job.description}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        job.is_active
                          ? styles.closeButton
                          : styles.reopenButton,
                      ]}
                      onPress={() =>
                        handleToggleJobStatus(job.id, !job.is_active)
                      }
                      disabled={deleting === job.id}
                    >
                      <Text style={styles.toggleButtonText}>
                        {deleting === job.id
                          ? "Updating..."
                          : job.is_active
                          ? "Close Listing"
                          : "Reopen Listing"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {!isVerified && (
              <View style={styles.verificationBanner}>
                <Text style={styles.verificationText}>
                  ⚠️ Your facility is not verified. Please complete the
                  verification process to post jobs.
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Position Title *</Text>
              <TextInput
                style={styles.input}
                value={positionTitle}
                onChangeText={setPositionTitle}
                placeholder="Enter position title"
                placeholderTextColor="#888"
              />
            </View>

            <Text style={styles.label}>Employment Type *</Text>
            <DropDownPicker
              open={employmentOpen}
              value={employmentType}
              items={employmentOptions}
              setOpen={setEmploymentOpen}
              setValue={setEmploymentType}
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholder="Select employment type"
              listMode="SCROLLVIEW"
              zIndex={3000}
              zIndexInverse={1000}
            />

            <Text style={styles.label}>Compensation Type</Text>
            <DropDownPicker
              open={compensationOpen}
              value={compensationType}
              items={compensationOptions}
              setOpen={setCompensationOpen}
              setValue={setCompensationType}
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholder="Select compensation type"
              listMode="SCROLLVIEW"
              zIndex={2500}
              zIndexInverse={1500}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Compensation Amount Min</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={compensationMin}
                  onChangeText={setCompensationMin}
                  placeholder="0.00"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Compensation Amount Max</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={compensationMax}
                  onChangeText={setCompensationMax}
                  placeholder="0.00"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the job..."
                placeholderTextColor="#888"
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State / Province</Text>
              <TextInput
                style={styles.input}
                value={stateProvince}
                onChangeText={setStateProvince}
                placeholder="State or Province"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Postal Code"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Job Status</Text>
            <DropDownPicker
              open={statusOpen}
              value={isActive}
              items={jobStatusOptions}
              setOpen={setStatusOpen}
              setValue={setIsActive}
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholder="Select job status"
              listMode="SCROLLVIEW"
              zIndex={2000}
              zIndexInverse={2000}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>Save Job Post</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <BottomTab userType="facility" active="profile" />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

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
  headerSpacer: {
    width: 60,
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    flex: 1,
  },
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: { marginBottom: 18 },
  label: { fontWeight: "600", marginBottom: 5 },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#000",
  },
  textArea: { height: 100, textAlignVertical: "top", color: "#000" },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 18,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginRight: 5,
  },
  currencyInput: {
    flex: 1,
    height: 45,
    color: "#000",
    fontSize: 16,
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
    marginBottom: 18,
  },
  submitButton: {
    backgroundColor: "#00ced1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addNewButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addNewText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  jobCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#d4edda",
  },
  closedBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  jobDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: "#00ced1",
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  compensationDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00ced1",
    marginBottom: 12,
  },
  jobActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editButton: {
    backgroundColor: "#00ced1",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: "#ffc107",
  },
  reopenButton: {
    backgroundColor: "#28a745",
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 20,
    marginBottom: 12,
  },
  verificationBanner: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffc107",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  verificationText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default JobPostForm;

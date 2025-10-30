import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const API_BASE = "http://10.0.0.2:3000";

export default function JobStatusUpdate({ route }) {
  const { jobId } = route.params;

  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [jobStatusOpen, setJobStatusOpen] = useState(false);
  const [jobStatus, setJobStatus] = useState<boolean | null>(null);

  const jobStatusOptions = [
    { label: "Active", value: true },
    { label: "Closed", value: false },
  ];

  const appStatusOptions = [
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Reviewed", value: "REVIEWED" },
    { label: "Shortlisted", value: "SHORTLISTED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Hired", value: "HIRED" },
  ];

  useEffect(() => {
    fetchJobDetails();
  }, []);

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
      const data = await res.json();
      setJob(data);
      setJobStatus(data.is_active);

      const appRes = await fetch(`${API_BASE}/api/jobs/${jobId}/applications`);
      const appData = await appRes.json();
      setApplications(appData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (newStatus: boolean) => {
    try {
      await fetch(`${API_BASE}/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update job status", err);
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update application status", err);
    }
  };

  const renderApplicant = ({ item }) => (
    <View style={styles.applicantCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.applicantName}>{item.worker_name}</Text>
        <Text style={styles.applicantEmail}>{item.worker_email}</Text>
      </View>

      <DropDownPicker
        open={item.open || false}
        value={item.application_status}
        items={appStatusOptions}
        setOpen={(open) =>
          setApplications((prev) =>
            prev.map((a) => (a._id === item._id ? { ...a, open } : a))
          )
        }
        setValue={(callback) => {
          const newStatus = callback(item.application_status);
          updateApplicationStatus(item._id, newStatus);
          setApplications((prev) =>
            prev.map((a) =>
              a._id === item._id ? { ...a, application_status: newStatus } : a
            )
          );
        }}
        style={styles.dropdown}
        containerStyle={{ width: 150 }}
        placeholder="Status"
        zIndex={500}
        zIndexInverse={1000}
      />
    </View>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ced1" />
      </View>
    );

  if (!job) return <Text style={styles.center}>Job not found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{job.position_title}</Text>

      <Text style={styles.label}>Job Status</Text>
      <DropDownPicker
        open={jobStatusOpen}
        value={jobStatus}
        items={jobStatusOptions}
        setOpen={setJobStatusOpen}
        setValue={(callback) => {
          const newVal = callback(jobStatus);
          setJobStatus(newVal);
          updateJobStatus(newVal);
        }}
        style={styles.dropdown}
        placeholder="Select status"
        zIndex={1000}
        zIndexInverse={1000}
      />

      <Text style={[styles.label, { marginTop: 25 }]}>
        Applications ({applications.length})
      </Text>

      <FlatList
        data={applications}
        keyExtractor={(item) => item._id}
        renderItem={renderApplicant}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  label: { fontWeight: "600", marginBottom: 5, color: "#333" },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  applicantCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    backgroundColor: "#fafafa",
  },
  applicantName: { fontWeight: "600", color: "#000" },
  applicantEmail: { color: "#666", fontSize: 12 },
});

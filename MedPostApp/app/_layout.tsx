import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="role-select" options={{ title: "Select Role" }} />
      <Tabs.Screen name="worker-register" options={{ title: "Worker Register" }} />
      <Tabs.Screen name="worker-specialty" options={{ title: "Worker Specialty" }} />
      <Tabs.Screen name="facility-business" options={{ title: "Facility Business" }} />
      <Tabs.Screen name="facility-register" options={{ title: "Facility Register" }} />
      <Tabs.Screen name="facility-verification" options={{ title: "Facility Verfication" }} />
      <Tabs.Screen name="worker-verification" options={{ title: "Worker Verfication" }} />
      <Tabs.Screen name="worker-profile" options={{ title: "Worker Profile" }} />
      <Tabs.Screen name="facility-profile" options={{ title: "Facility Profile" }} />
      <Tabs.Screen name="worker-experience" options={{ title: "Worker Experience" }} />
      <Tabs.Screen name="job-post" options={{ title: "Job Posts" }} />
      <Tabs.Screen name="worker-credentials" options={{ title: "Worker Credentials" }} />
      <Tabs.Screen name="worker-update" options={{ title: "Worker Update" }} />
      <Tabs.Screen name="facility-update" options={{ title: "Facility Update" }} />
    </Tabs>
  );
}

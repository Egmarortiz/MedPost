import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
      {/* Auth Screens */}
      <Tabs.Screen name="login" />
      <Tabs.Screen name="role-select" />
      
      {/* Worker Screens */}
      <Tabs.Screen name="worker-register" />
      <Tabs.Screen name="worker-experience" />
      <Tabs.Screen name="worker-verification" />
      <Tabs.Screen name="worker-home" />
      <Tabs.Screen name="worker-profile" />
      <Tabs.Screen name="worker-update" />
      
      {/* Facility Screens */}
      <Tabs.Screen name="facility-register" />
      <Tabs.Screen name="facility-verification" />
      <Tabs.Screen name="facility-home" />
      <Tabs.Screen name="facility-profile" />
      <Tabs.Screen name="facility-update" />
      
      {/* Job Screens */}
      <Tabs.Screen name="job-post" />
      <Tabs.Screen name="job-update" />
      <Tabs.Screen name="search" />
      
      {/* Admin Screens */}
      <Tabs.Screen name="admin-verification" />
    </Tabs>
  );
}

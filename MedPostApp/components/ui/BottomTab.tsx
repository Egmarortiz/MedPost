import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

interface BottomTabProps {
  userType: "worker" | "facility";
  active: "search" | "home" | "profile";
}

export default function BottomTab({ userType, active }: BottomTabProps) {
  const router = useRouter();

  const tabs = userType === "facility"
    ? [
        { key: "search", icon: "search", label: "Search", route: "/(tabs)/search" },
        { key: "home", icon: "home", label: "Home", route: "/(tabs)/facility-home" },
        { key: "profile", icon: "person", label: "Profile", route: "/(tabs)/facility-profile" },
      ]
    : [
        { key: "search", icon: "search", label: "Search", route: "/(tabs)/search" },
        { key: "home", icon: "home", label: "Home", route: "/(tabs)/worker-home" },
        { key: "profile", icon: "person", label: "Profile", route: "/(tabs)/worker-profile" },
      ];

  return (
    <View style={styles.tabBar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => router.replace(tab.route)}
        >
          <Ionicons
            name={tab.icon as any}
            size={28}
            color={active === tab.key ? "#fff" : "#2d7b81ff"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    backgroundColor: "#00ced1",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
    fontWeight: "500",
  },
  activeLabel: {
    color: "#fff",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // On web redirect to landing page
      if (Platform.OS === "web") {
        router.replace("/landing-page");
      } else {
        // On mobile redirect to login
        router.replace("/(tabs)/login");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}

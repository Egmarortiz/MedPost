/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import logo from "../../assets/images/logo.png";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../../config/api";

const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid e-mail")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, ({ min }) => `Password must be at least ${min} characters`)
    .required("Password is required"),
});

export default function Login() {
  const { token, user, saveToken, saveUser, login } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [loginType, setLoginType] = React.useState<"worker" | "facility">("worker");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (values: any) => {
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    
    try {
      const endpoint = loginType === "worker" 
        ? API_ENDPOINTS.WORKER_LOGIN
        : API_ENDPOINTS.FACILITY_LOGIN;

      console.log("Attempting login to:", endpoint);
      const response = await axios.post(endpoint, values);
      
      console.log("Login response:", response.status, response.data);
      
      if (response.status === 200 && response.data?.access_token) {
        const { access_token, refresh_token, role, worker_id, facility_id, user_id } = response.data;
    
        await saveToken(access_token);
        await saveUser({
          user_id,
          role,
          worker_id,
          facility_id,
          email: values.email,
        });

        // Store the userType for use in home pages
        await AsyncStorage.setItem("userType", loginType);

        console.log("Token saved, navigating based on role:", role);

        if (role === "WORKER" || worker_id) {
          router.push("/(tabs)/worker-profile");
        } else if (role === "FACILITY" || facility_id) {
          router.push("/(tabs)/facility-profile");
        } else {
          router.push("/(tabs)/role-select");
        }
      } else {
        Alert.alert("Error", "Invalid credentials or server error.");
      }
    } catch (error: any) {
      console.error("Login error:", error?.response?.data || error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Login failed. Please try again.";
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Image source={logo} style={styles.logo} />
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginType === "worker" && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginType("worker")}
        >
          <Text
            style={[
              styles.toggleText,
              loginType === "worker" && styles.toggleTextActive,
            ]}
          >
            Worker
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginType === "facility" && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginType("facility")}
        >
          <Text
            style={[
              styles.toggleText,
              loginType === "facility" && styles.toggleTextActive,
            ]}
          >
            Facility
          </Text>
        </TouchableOpacity>
      </View>

      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={handleLogin}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isValid,
        }) => (
          <>
            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={25} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
              />
            </View>
            {errors.email && touched.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={25} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
              />
            </View>
            
            {errors.password && touched.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? "Logging in..." : "Log In"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/role-select")}
            >
              <Text style={styles.signUp}>
                Don&apos;t have an account?{" "}
                <Text style={styles.signUpLink}>Register</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  logo: {
    height: 200,
    width: 345,
    borderRadius: 40,
    resizeMode: "cover",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    marginBottom: 40,
    fontWeight: "bold",
    color: "black",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    height: 50,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
  },
  button: {
    width: "90%",
    height: 50,
    backgroundColor:"#00ced1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  signUp: {
    color: "#000",
  },
  signUpLink: {
    color: "#1E90FF",
  },
  errorText: {
    color: "red",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    width: "90%",
    marginBottom: 20,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#c0c0c0",
  },
  toggleText: {
    fontSize: 16,
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  registerButton: {
    marginTop: 10,
  },
});

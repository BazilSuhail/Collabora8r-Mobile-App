import React, { useState } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import logo from "@/assets/logo.png";

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useRouter();

  const { email, password } = formData;

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await axios.post(`${config.VITE_REACT_APP_API_BASE_URL}/auth/signin`, formData);
      await AsyncStorage.setItem('token', response.data.token);

      console.log('Response:', response.data.token);
      navigate.push('(tabs)');
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          className="h-80 px-8 justify-end pb-12 relative"
        >
          <View className="absolute top-16 left-8">
            <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Logo Section */}
          <View className="items-center mb-8">
            <View className="flex-row items-center mb-4">
              <Image source={logo} className="w-12 h-12" />
              <Text className="text-white ml-2 text-3xl font-bold">
                Collabora<Text className="font-extrabold text-red-400">8</Text>r
              </Text>
            </View>
            <Text className="text-white text-base opacity-90 text-center">
              Simplify Teamwork, Streamline Success
            </Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-white text-4xl font-bold mb-2">Join Us</Text>
            <Text className="text-white text-lg opacity-90">Create your account</Text>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <View className="flex-1 px-6 -mt-8">
          {/* Main Card */}
          <View className="bg-white rounded-3xl px-8 py-10 shadow-lg shadow-gray-200 mb-8">
            {/* Email Field */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-3">Email Address</Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  value={email}
                  onChangeText={(value) => handleChange('email', value)}
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-12 py-4 text-gray-800 text-base focus:border-blue-500"
                  placeholder="john@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-3">Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  value={password}
                  onChangeText={(value) => handleChange('password', value)}
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-12 py-4 pr-16 text-gray-800 text-base focus:border-blue-500"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              onPress={() => setIsModalOpen(true)}
              className="mb-8"
            >
              <Text className="text-right text-sm text-blue-600 font-medium">
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Error Message */}
            {errorMessage ? (
              <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6 flex-row items-center">
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <Text className="text-red-600 text-sm ml-2 flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Sign In Button */}
            <TouchableOpacity
              disabled={loading}
              onPress={handleSubmit}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                className="py-4 rounded-2xl flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="log-in-outline" size={20} color="white" />
                )}
                <Text className="text-center text-white font-semibold text-base ml-2">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Social Login Buttons */}
            <View className="flex-row space-x-4">
              <TouchableOpacity className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center">
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-gray-700 font-medium ml-2">Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center">
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="text-gray-700 font-medium ml-2">Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/authentication/login")}>
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal placeholder - uncomment when you have the modal component */}
      {/* <ForgotPasswordModal isOpen={isModalOpen} onClose={closeModal} /> */}
    </KeyboardAvoidingView>
  );
};

export default SignUp;
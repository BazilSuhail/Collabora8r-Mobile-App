import { useAuthContext } from '@/hooks/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LinearGradient,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config from '@/config/config';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const router = useRouter();
  const { login } = useAuthContext();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    email: 'lordentity6@gmail.com',
    password: '112233',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

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
      console.log("sd")

      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/auth/signin`,
        formData
      );
      login(response.data.token);
      router.replace('(tabs)');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" backgroundColor="#0ea5e9" />

      {/* Gradient Header */}
      <View className="h-64 bg-gradient-to-b from-sky-500 to-cyan-400 justify-end pb-12 px-8">
        <Text className="text-5xl font-bold text-white mb-2">Jobsly</Text>
        <Text className="text-white text-lg opacity-90">Welcome Back</Text>
      </View>

      {/* Form Container */}
      <View className="flex-1 bg-white -mt-8 rounded-t-3xl px-6 pt-8 pb-6 justify-between" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        
        {/* Form Fields */}
        <View>
          {/* Subtitle */}
          <Text className="text-center text-slate-600 text-base mb-8 font-medium">
            Enter your details below to continue
          </Text>

          {/* Email Input */}
          <View className="mb-7">
            <Text className="text-slate-700 font-semibold text-sm mb-3">Email Address</Text>
            <TextInput
              placeholder="nicholas@gmail.com"
              value={email}
              onChangeText={(val) => handleChange('email', val)}
              className="border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#CBD5E1"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-slate-700 font-semibold text-sm mb-3">Password</Text>
            <View className="relative flex-row items-center">
              <TextInput
                placeholder="••••••••••••"
                value={password}
                onChangeText={(val) => handleChange('password', val)}
                secureTextEntry={!showPassword}
                className="border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 flex-1"
                placeholderTextColor="#CBD5E1"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4"
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            onPress={() => router.push('https://collbora8r.netlify.app/login')} 
            className="mb-8 self-end"
          >
            <Text className="text-cyan-500 text-sm font-semibold">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {errorMessage ? (
            <View className="bg-red-50 border-l-4 border-red-500 rounded-lg px-4 py-3 mb-6 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text className="text-red-600 text-sm ml-3 flex-1">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.85}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl py-4 mb-6 shadow-md"
            style={{
              backgroundColor: '#3B82F6',
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-center">
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-base">
                    {loading ? 'LOGGING IN...' : 'Sign In'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-3">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="text-slate-400 mx-3 text-sm">Or continue with</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-slate-600 text-sm">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('https://collbora8r.netlify.app/register')}>
            <Text className="text-cyan-500 font-bold text-sm">Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Login;
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthContext } from '@/hooks/AuthProvider';
import config from '@/config/config';
import { FontAwesome, AntDesign, Entypo, Ionicons } from '@expo/vector-icons';

const Login = () => {
  const router = useRouter();
  const { login } = useAuthContext();

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
      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/auth/signin`,
        formData
      );
      login(response.data.token);
      router.push('(tabs)');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 justify-center">
          {/* Top Icon */}
          <View className="items-center mb-8 mt-20">
            <View className="w-16 h-16 rounded-full bg-[#E6F0FA] justify-center items-center">
              <View className="w-6 h-6 rounded-full bg-cyan-500" />
            </View>
          </View>

          {/* Welcome Text */}
          <Text className="text-2xl font-semibold text-center mb-1">Welcome back</Text>
          <Text className="text-center text-gray-500 mb-8">
            Let’s make your home be smart{'\n'}easily with us
          </Text>

          {/* Email Input */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(val) => handleChange('email', val)}
          />

          {/* Password Input */}
          <View className="relative mb-4">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              className="border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800"
              value={password}
              onChangeText={(val) => handleChange('password', val)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3"
            >
              <Entypo name={showPassword ? 'eye-with-line' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="mb-4 self-end">
            <Text className="text-cyan-500 font-medium text-sm">Forgot Password</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {errorMessage ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text className="text-red-600 text-sm ml-2 flex-1">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.8}
            className="rounded-xl overflow-hidden mb-6"
          >
            <LinearGradient
              colors={['#38bdf8', '#0ea5e9']}
              className="py-4 rounded-xl flex-row items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="log-in-outline" size={20} color="white" />
              )}
              <Text className="text-white font-semibold text-base ml-2">
                {loading ? 'Signing in...' : 'Sign in'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Or Divider */}
          <Text className="text-center text-gray-500 mb-4">Or continue with</Text>

          {/* Social Buttons */}
          <View className="flex-row justify-center space-x-4 mb-10">
            <TouchableOpacity className="w-12 h-12 rounded-xl border border-gray-200 justify-center items-center">
              <FontAwesome name="facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 rounded-xl border border-gray-200 justify-center items-center">
              <AntDesign name="google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 rounded-xl border border-gray-200 justify-center items-center">
              <Entypo name="instagram" size={24} color="#C13584" />
            </TouchableOpacity>
          </View>

          {/* Sign Up */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-500">Didn’t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('https://collbora8r.netlify.app/register')}>
              <Text className="text-cyan-500 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

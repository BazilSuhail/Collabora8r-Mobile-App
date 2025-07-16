import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthContext } from '@/hooks/AuthProvider';
import config from '@/config/config';

const Login = () => {
  const router = useRouter();
  const { login } = useAuthContext();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#0f0c29', '#302b63']}
        className="h-[40%] pl-[15px] flex-1 justify-center w-full absolute top-0 left-0 rounded-b-[50px] z-0"
      >
        <Text className="text-white text-3xl font-bold mb-1">Hello</Text>
        <Text className="text-white text-[35px] font-semibold mb-10">Sign In</Text>
      </LinearGradient >

      {/* Content */}
      <View className="flex-1 justify-end w-[80%] px-6 pb-[30%] rounded-[15px]">
        {/* Card Container */}
        <View className="bg-white rounded-3xl px-6  py-8 shadow-lg">
          {/* Email */}
          <Text className="text-gray-700 text-sm font-semibold mb-2">Email</Text>
          <TextInput
            value={email}
            onChangeText={(val) => handleChange('email', val)}
            className="border-b border-gray-300 text-gray-800 pb-2 mb-4"
            placeholder="john@email.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <Text className="text-gray-700 text-sm font-semibold mb-2">Password</Text>
          <TextInput
            value={password}
            onChangeText={(val) => handleChange('password', val)}
            className="border-b border-gray-300 text-gray-800 pb-2 mb-4"
            placeholder="******"
            placeholderTextColor="#999"
            secureTextEntry
          />

          {/* Forgot Password */}
          <TouchableOpacity className="mt-2 mb-6">
            <Text className="text-right text-sm text-gray-600 font-medium">
              Forget password?
            </Text>
          </TouchableOpacity>

          {/* Error */}
          {errorMessage ? (
            <Text className="text-red-500 text-center mb-2 text-sm">
              {errorMessage}
            </Text>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.9}
            className="rounded-full overflow-hidden"
          >
            <LinearGradient
              colors={['#1E3C72', '#2A5298']}
              className="py-3 rounded-full"
            >
              <Text className="text-center text-white font-semibold text-base">
                {loading ? 'Signing in...' : 'SIGN IN'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => console.log('Go to Sign Up')}>
            <Text className="text-blue-700 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          className="absolute top-[50%] self-center"
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default Login;

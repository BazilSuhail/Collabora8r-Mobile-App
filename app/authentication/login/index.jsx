import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthContext } from '@/hooks/AuthProvider';
import config from '@/config/config';
import { AntDesign, Ionicons } from '@expo/vector-icons';

const Login = () => {
  const router = useRouter();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const { login } = useAuthContext();

  const [formData, setFormData] = useState({
    email: 'lordentity6@gmail.com',
    password: '112233',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#4EC5C1" />

      {/* Top Gradient Area - 40% */}
      <View style={{ flex: 0.4, position: 'relative', justifyContent: 'center' }}>
        {/* Rotating Gradient Background */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
            zIndex: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LinearGradient
            colors={['#F44336', '#4A6EA9', '#4EC5C1']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: 600,
              height: 600,
              position: 'absolute',
            }}
          />
        </Animated.View>

        {/* Static Foreground Content */}
        <View style={{ zIndex: 1 }} className="px-6 items-center">
          <View className="flex-row items-center">
            <Image
              source={require('@/assets/images/icon.png')}
              className="w-[50px] h-[50px] mr-5 border-white border-[2px]"
            />
            <Text className="text-white/80 font-bold text-[40px] mb-1">Collabora<Text className="text-red-500">8</Text>r</Text>
          </View>
          <Text className="text-black text-sm opacity-80">
            Simplify Teamwork, Streamline Success
          </Text>
        </View>
      </View>

      {/* Bottom White Area - 60% */}
      <View className="flex-[0.6] bg-white rounded-t-3xl -mt-4 overflow-hidden">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="h-full flex-1 px-6 pt-8 justify-center"
          >
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2 ml-1">Email</Text>
              <View className="relative">
                <TextInput
                  placeholder=""
                  value={email}
                  onChangeText={(val) => handleChange('email', val)}
                  className="bg-gray-100 rounded-lg px-4 py-4 text-black text-base pr-12"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View className="absolute right-4 top-4" >
                  <Ionicons
                    name="mail"
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm mb-2 ml-1">Password</Text>
              <View className="relative">
                <TextInput
                  placeholder=""
                  value={password}
                  onChangeText={(val) => handleChange('password', val)}
                  secureTextEntry={!showPassword}
                  className="bg-gray-100 rounded-lg px-4 py-4 text-black text-base pr-12"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="mb-6 self-end">
              <Text className="text-gray-500 text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {errorMessage ? (
              <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 flex-row items-center">
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <Text className="text-red-600 text-sm ml-2 flex-1">{errorMessage}</Text>
              </View>
            ) : null}

            {/* Log in Button */}
            <TouchableOpacity
              disabled={loading}
              onPress={handleSubmit}
              activeOpacity={0.8}
              className="bg-black rounded-full py-4 mb-4"
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : null}
                <Text className="text-white font-semibold text-base ml-2">
                  {loading ? 'Logging in...' : 'Log in'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Or Log in with */}
            <Text className="text-center text-gray-400 text-sm mb-4">Or Log in with</Text>

            {/* Social Login Buttons */}
            <TouchableOpacity
              className="flex-row items-center justify-center bg-white border border-gray-200 rounded-full py-3"
              activeOpacity={0.7}
            >
              <AntDesign name="google" size={20} color="#DB4437" />
              <Text className="text-gray-700 font-medium ml-2">Google</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center mt-10">
              <Text className="text-gray-400 text-sm">Don't have account? </Text>
              <TouchableOpacity onPress={() => router.push('https://collbora8r.netlify.app/register')}>
                <Text className="text-blue-700 underline font-semibold text-[14px] ml-1 mb-[3px]">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default Login;

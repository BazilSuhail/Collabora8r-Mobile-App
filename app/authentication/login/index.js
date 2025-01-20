import React, { useState } from 'react';
import axios from 'axios';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Expo Icons
import { useRouter } from 'expo-router';
//import ForgotPasswordModal from './ForgotPasswordModal'; // Import your modal component if necessary

import config from '@/Config/Config';
//import Loader from '../../Assets/Loader';
import logo from "@/assets/logo.png"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '@/hooks/AuthProvider';
const Login = () => {
  const {login }=useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [focusField, setFocusField] = useState('');
  const router = useRouter();
  const { email, password } = formData;
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };


  const handleFocus = (field) => {
    setFocusField(field);
  };

  const handleBlur = () => {
    setFocusField('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await axios.post(`${config.VITE_REACT_APP_API_BASE_URL}/auth/signin`, formData);
      //await AsyncStorage.setItem('token', response.data);
      login(response.data.token)
      //console.log('FasdasdasdasdormData:', response.data.token);

      router.push('(tabs)');
    }
    catch (error) {
      setErrorMessage(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /*if (loading) {
    return <Loader message={'Signing You In'} />;
  }*/

  return (
    <View className="h-screen w-screen flex-1 justify-center items-center bg-gray-100">
      {/*<ForgotPasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />*/}

      <View className="flex w-[90vw]">
        <View className="scale-[1.2] flex flex-row mx-auto">
          <Image source={logo} className="w-[34px] h-[34px]" />
          <Text className="text-[#575757] ml-[4px] md:text-[25px] text-[25px] font-[700]">Collabora<Text className="font-[800] text-red-600">8</Text>r</Text>
        </View>

        <Text className="text-[15px] mb-[15px] text-center mt-[8px] text-gray-500 font-[400]">Simplify Teamwork, Streamline Success</Text>

        <View className="py-[35px] w-full px-[25px] flex flex-rowflex-col bg-white rounded-xl shadow-lg">
          <View className="relative mt-4 mb-6 flex flex-row items-center">
            <View className="bg-gray-400 mr-2 rounded-full flex justify-center items-center w-[40px] h-[40px]">
              <Ionicons name="mail-outline" size={22} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className={`absolute text-gray-900 font-[600] text-[16px] transition-all duration-300 ${focusField === 'email' || email ? '-top-5 text-sm' : 'top-2'}`}>
                Email
              </Text>
              <TextInput 
                className="w-full py-3 bg-transparent text-gray-700 border-b-[2px] border-gray-600 focus:outline-none"
                value={email}
                onChangeText={(value) => handleChange('email', value)}
                onFocus={() => handleFocus('email')}
                onBlur={handleBlur}
                placeholderTextColor="#888"
                keyboardType="email-address"
                required
              />
            </View>
          </View>

          <View className="relative mt-4 mb-6 flex flex-row items-center">
            <View className="bg-gray-400 mr-2 rounded-full flex items-center justify-center w-[40px] h-[40px]">
              <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            </View>
            <View className="flex-1 flex-row">
              <Text className={`absolute text-gray-900 font-[600] text-[16px] transition-all duration-300 ${focusField === 'password' || password ? '-top-5 text-sm' : 'top-2'}`}>
                Password
              </Text>
              <TextInput
                className="w-full py-3 bg-transparent text-gray-700 border-b-[2px] border-gray-600 focus:outline-none"
                value={password}
                onChangeText={(value) => handleChange('password', value)}
                onFocus={() => handleFocus('password')}
                onBlur={handleBlur}
                placeholderTextColor="#888"
                secureTextEntry
                required
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} className="hover:text-blue-100 hover:bg-blue-950 w-full my-[15px] bg-blue-600 rounded-lg  py-[12px]">
            <Text className="text-center text-white font-[500]">Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsModalOpen(true)}>
            <Text className="text-blue-600 underline mb-[8px] text-[15px] font-[600]">Forgot Password</Text>
          </TouchableOpacity>
        </View>

        <View className="w-full flex mt-[15px] flex-row px-[12px] md:px-[19px] items-center space-x-2">
          <View className="w-[47%] h-[2px] bg-[#c5c5c5]" />
          <Text className="text-gray-500 text-[14px]">OR</Text>
          <View className="w-[47%] h-[2px] bg-[#c5c5c5]" />
        </View>

        <View className="mx-auto mt-[18px]">
          <Text className="mx-auto mt-[18px] text-gray-500 font-medium">
            Don't Have An Account?
            <Text className="text-blue-700 ml-[18px] underline" onPress={() => console.log("Navigate to Register")}>
              Sign Up
            </Text>
          </Text>
        </View>
      </View>
    </View>
  )
};

export default Login;

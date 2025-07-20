import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  View, Text, TextInput, Image, TouchableOpacity,
  Modal, FlatList, ScrollView
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';

const Profile = () => {
  const { user, reFetchProfile } = useAuthContext();

  const [profile, setProfile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setSelectedAvatar(user.avatar);
    }
  }, [user]);

  const handleInputChange = useCallback((name, value) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdate = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedProfile = { ...profile, avatar: selectedAvatar };

      const response = await axios.put(`${config.VITE_REACT_APP_API_BASE_URL}/profile`, updatedProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data);
      setIsEditing(false);
      //reFetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profile');
    }
  }, [profile, selectedAvatar]);

  const profileFields = useMemo(() => [
    { icon: "user", label: "Full Name", value: profile?.name, name: "name", placeholder: "Full Name" },
    { icon: "users", label: "Gender", value: profile?.gender, name: "gender", placeholder: "Gender" },
    { icon: "calendar", label: "Date of Birth", value: profile?.dob, name: "dob", placeholder: "Date of Birth" },
    { icon: "phone", label: "Phone", value: profile?.phone, name: "phone", placeholder: "Phone Number", keyboardType: "phone-pad" },
  ], [profile]);

  const selectAvatar = (index) => {
    setSelectedAvatar(index + 1);
    setIsAvatarModalOpen(false);
  };

  if (!profile) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white p-8 rounded-2xl">
          <MaterialIcons name="refresh" size={32} color="#6366f1" />
          <Text className="text-gray-600 text-lg mt-2">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="px-3 py-4">
        {!isEditing ? (
          <>
            {/* Header Card */}
            <View className="bg-white rounded-3xl mb-6 overflow-hidden">
              <View className="h-[150px] relative">
                <Image source={themeImages["1"]} className="absolute w-full h-full" />
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                  className="absolute w-full h-full"
                />
                <View className="absolute bottom-0 left-0 right-0 p-6">
                  <View className="flex-row items-center">
                    <View className="relative">
                      <Image
                        source={avatarImages[selectedAvatar]}
                        className="w-24 h-24 rounded-full border-4 border-white"
                      />
                      <View className="absolute bottom-[1] right-[2px] w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-white text-lg opacity-90">Hello,</Text>
                      <Text className="text-white text-[28px] font-bold">{profile.name}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Profile Info */}
            <View className=" rounded-3xl px-2 mb-6 shadow-black/5">
              <Text className="text-xl font-bold text-gray-800 mb-6">Profile Information</Text>
              {[
                { icon: "user", label: "Full Name", value: profile.name, color: "#6366f1" },
                { icon: "mail", label: "Email", value: profile.email, color: "#ec4899" },
                { icon: "phone", label: "Phone", value: profile.phone, color: "#10b981" },
                { icon: "users", label: "Gender", value: profile.gender, color: "#f59e0b" },
                { icon: "calendar", label: "Date of Birth", value: new Date(profile.dob).toLocaleDateString(), color: "#8b5cf6" },
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center p-4 mb-3 bg-white rounded-2xl border border-gray-100">
                  <View className="w-10 h-10 rounded-full justify-center items-center mr-4" style={{ backgroundColor: `${item.color}20` }}>
                    <Feather name={item.icon} size={18} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500">{item.label}</Text>
                    <Text className="text-base font-semibold text-gray-800">{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="bg-blue-700 p-4 rounded-2xl flex-row justify-center items-center"
            >
              <Feather name="edit-3" size={20} color="white" />
              <Text className="text-white ml-3 text-base font-semibold">Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Edit Header */}
            <View className="bg-white rounded-3xl p-6 mb-6 shadow-black/5">
              <View className="flex-row items-center mb-6">
                <View className="relative">
                  <Image
                    source={avatarImages[selectedAvatar]}
                    className="w-20 h-20 rounded-full border-4 border-gray-200"
                  />
                  <TouchableOpacity
                    onPress={() => setIsAvatarModalOpen(true)}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full justify-center items-center"
                  >
                    <Feather name="camera" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                <View className="ml-4">
                  <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
                  <Text className="text-gray-500">Update your information</Text>
                </View>
              </View>
            </View>

            {/* Edit Form */}
            <View className="bg-white rounded-3xl p-6 mb-6 shadow-black/5">
              {profileFields.map((field, idx) => (
                <View key={idx} className="mb-4">
                  <Text className="text-sm text-gray-700 mb-2">{field.placeholder}</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <Feather name={field.icon} size={18} color="#6b7280" />
                    <TextInput
                      className="flex-1 text-base text-gray-800 ml-3"
                      placeholder={`Enter ${field.placeholder.toLowerCase()}`}
                      value={field.value}
                      keyboardType={field.keyboardType}
                      onChangeText={(text) => handleInputChange(field.name, text)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleUpdate}
                className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl flex-row justify-center items-center"
              >
                <Feather name="check" size={20} color="white" />
                <Text className="text-white ml-3 text-base font-semibold">Update Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="bg-gray-100 p-4 rounded-2xl flex-row justify-center items-center border border-gray-200"
              >
                <Feather name="x" size={20} color="#6b7280" />
                <Text className="text-gray-700 ml-3 text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Avatar Modal */}
      <Modal visible={isAvatarModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Choose Avatar</Text>
              <TouchableOpacity
                onPress={() => setIsAvatarModalOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center"
              >
                <Feather name="x" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Array.from({ length: 12 })}
              keyExtractor={(_, idx) => idx.toString()}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              renderItem={({ index }) => (
                <TouchableOpacity onPress={() => selectAvatar(index)} className="flex-1 items-center p-3">
                  <View className={`rounded-full p-1 ${selectedAvatar === index + 1 ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                    <Image source={avatarImages[index + 1]} className="w-20 h-20 rounded-full" />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Profile;

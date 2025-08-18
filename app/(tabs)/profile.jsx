import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';
import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BottomSheet from 'entity-bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Text, TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Profile Field Component
const ProfileField = ({ field, value, onChangeText, isEditing }) => {
  if (!isEditing) {
    const colors = {
      user: "#6366f1", mail: "#ec4899", phone: "#10b981",
      users: "#f59e0b", calendar: "#8b5cf6"
    };

    return (
      <View className="flex-row items-center px-4 py-2 mb-3 bg-white rounded-2xl border border-gray-100">
        <View
          className="w-10 h-10 rounded-full justify-center items-center mr-4"
          style={{ backgroundColor: `${colors[field.icon]}20` }}
        >
          <Feather name={field.icon} size={18} color={colors[field.icon]} />
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500">{field.label}</Text>
          <Text className="text-base font-semibold text-gray-800">{value}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-2">{field.label}</Text>
      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1">
        <Feather name={field.icon} size={16} color="#6b7280" />
        <TextInput
          className="flex-1 text-base text-gray-800 ml-3"
          placeholder={`Enter ${field.label.toLowerCase()}`}
          value={value}
          keyboardType={field.keyboardType}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
};

// Avatar Selection Component
const AvatarSelector = ({ selectedAvatar, onSelect }) => (
  <View className="mb-6">
    <Text className="text-base font-semibold text-gray-800 mb-4">Choose Avatar</Text>
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((item) => (
        <TouchableOpacity
          key={item.toString()}
          onPress={() => onSelect(item)}
          className="w-1/4 items-center p-2"
        >
          <View className={`rounded-full p-1 ${selectedAvatar === item ? 'bg-indigo-500' : 'bg-gray-200'}`}>
            <Image source={avatarImages[item]} className="w-16 h-16 rounded-full" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const Profile = () => {
  const { user, updateAvatar  } = useAuthContext();

  // State management
  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState({});
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfile(user);
      setSelectedAvatar(user.avatar);
      setEditedProfile({
        name: user.name,
        gender: user.gender,
        dob: user.dob,
        phone: user.phone,
      });
    }
  }, [user]);

  // Profile fields configuration
  const profileFields = useMemo(() => [
    {
      icon: "user",
      label: "Full Name",
      name: "name",
      keyboardType: "default"
    },
    {
      icon: "users",
      label: "Gender",
      name: "gender",
      keyboardType: "default"
    },
    {
      icon: "calendar",
      label: "Date of Birth",
      name: "dob",
      keyboardType: "default"
    },
    {
      icon: "phone",
      label: "Phone",
      name: "phone",
      keyboardType: "phone-pad"
    },
  ], []);

  // Display fields for read-only view
  const displayFields = useMemo(() => [
    { icon: "user", label: "Full Name", value: profile?.name },
    { icon: "mail", label: "Email", value: profile?.email },
    { icon: "phone", label: "Phone", value: profile?.phone },
    { icon: "users", label: "Gender", value: profile?.gender },
    {
      icon: "calendar",
      label: "Date of Birth",
      value: profile?.dob ? new Date(profile.dob).toLocaleDateString() : ''
    },
  ], [profile]);

  // Handle input changes
  const handleInputChange = useCallback((name, value) => {
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle avatar selection
  const handleAvatarSelect = useCallback((avatarIndex) => {
    setSelectedAvatar(avatarIndex)
    updateAvatar(avatarIndex)
  }, []);

  // Open edit modal
  const openEditModal = useCallback(() => {
    setEditedProfile({
      name: profile.name,
      gender: profile.gender,
      dob: profile.dob,
      phone: profile.phone,
    });
    setIsEditModalOpen(true);
  }, [profile]);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setError(null);
  }, []);

  // Handle profile update
  const handleUpdate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      const updatedProfile = { ...editedProfile, avatar: selectedAvatar };

      const response = await axios.put(
        `${config.VITE_REACT_APP_API_BASE_URL}/profile`,
        updatedProfile,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setProfile(response.data);
      setIsEditModalOpen(false);
      // Uncomment if needed: reFetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  }, [editedProfile, selectedAvatar]);

  // Loading state
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
    <>
      <ScrollView className="flex-1 bg-gray-100">
        <View className="px-4 py-4">
          {/* Header Card */}
          <View className="bg-white rounded-3xl mb-6 overflow-hidden">
            <View className="h-40 relative">
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
                    <View className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white text-lg opacity-90">Hello,</Text>
                    <Text className="text-white text-3xl font-bold">{profile.name}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Profile Information */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4 px-2">Profile Information</Text>
            {displayFields.map((field, idx) => (
              <ProfileField
                key={idx}
                field={field}
                value={field.value}
                isEditing={false}
              />
            ))}
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            onPress={openEditModal}
            className="bg-indigo-600 p-4 rounded-2xl flex-row justify-center items-center"
          >
            <Feather name="edit-3" size={20} color="white" />
            <Text className="text-white ml-3 text-base font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Bottom Sheet */}
      <BottomSheet
        visible={isEditModalOpen}
        onClose={closeEditModal}
        header={
          <View className="border-b-[2px] border-gray-100 px-6">
            <View className="flex-row items-center mb-4">
              <Image
                source={avatarImages[selectedAvatar]}
                className="w-16 h-16 rounded-full border-3 border-gray-200"
              />
              <View className="ml-4">
                <Text className="text-lg font-semibold text-gray-800">Edit Profile Picture</Text>
                <Text className="text-sm text-gray-500">Tap to change your avatar</Text>
              </View>
            </View>
          </View>
        }
        heightRatio={0.85}
      >
        <View className="flex-1">
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            
            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelect={handleAvatarSelect}
            />
            {/* Profile Fields - Two in a Row */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-4">Personal Information</Text>
              <View className="flex-row" style={{ gap: 12 }}>
                <View className="flex-1">
                  {profileFields.slice(0, 2).map((field, idx) => (
                    <ProfileField
                      key={idx}
                      field={field}
                      value={editedProfile[field.name]}
                      onChangeText={(text) => handleInputChange(field.name, text)}
                      isEditing={true}
                    />
                  ))}
                </View>
                <View className="flex-1">
                  {profileFields.slice(2, 4).map((field, idx) => (
                    <ProfileField
                      key={idx}
                      field={field}
                      value={editedProfile[field.name]}
                      onChangeText={(text) => handleInputChange(field.name, text)}
                      isEditing={true}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons - In One Row */}
          <View className="px-6 pb-6">
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={closeEditModal}
                disabled={isLoading}
                className="bg-gray-100 px-6 py-3 rounded-2xl flex-1 flex-row justify-center items-center border border-gray-200"
              >
                <Feather name="x" size={20} color="#6b7280" />
                <Text className="text-gray-700 ml-2 text-base font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isLoading}
                className={`px-6 py-3 rounded-2xl flex-1 flex-row justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-green-600'
                  }`}
              >
                {isLoading ? (
                  <MaterialIcons name="refresh" size={20} color="white" />
                ) : (
                  <Feather name="check" size={20} color="white" />
                )}
                <Text className="text-white ml-2 text-base font-semibold">
                  {isLoading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BottomSheet>
    </>
  );
};

export default Profile;
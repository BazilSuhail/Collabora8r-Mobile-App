import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';
import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Dimensions,
  FlatList,
  Image,
  Modal,
  PanGestureHandler,
  ScrollView,
  State,
  Text, TextInput,
  TouchableOpacity,
  View
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheet = ({ isVisible, onClose, children, title }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View className="flex-1">
        {/* Background overlay */}
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={{ opacity }}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            minHeight: SCREEN_HEIGHT * 0.7,
            maxHeight: SCREEN_HEIGHT * 0.9,
          }}
        >
          {/* Drag Handle */}
          <View className="items-center py-3">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-800">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center"
            >
              <Feather name="x" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Avatar Selection Component
const AvatarSelector = ({ selectedAvatar, onSelect }) => (
  <View className="mb-6">
    <Text className="text-base font-semibold text-gray-800 mb-4">Choose Avatar</Text>
    <FlatList
      data={Array.from({ length: 12 }, (_, i) => i + 1)}
      keyExtractor={(item) => item.toString()}
      numColumns={4}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity 
          onPress={() => onSelect(item)} 
          className="flex-1 items-center p-2"
        >
          <View className={`rounded-full p-1 ${selectedAvatar === item ? 'bg-indigo-500' : 'bg-gray-200'}`}>
            <Image source={avatarImages[item]} className="w-16 h-16 rounded-full" />
          </View>
        </TouchableOpacity>
      )}
    />
  </View>
);

// Profile Field Component
const ProfileField = ({ field, value, onChangeText, isEditing }) => {
  if (!isEditing) {
    const colors = {
      user: "#6366f1", mail: "#ec4899", phone: "#10b981", 
      users: "#f59e0b", calendar: "#8b5cf6"
    };
    
    return (
      <View className="flex-row items-center p-4 mb-3 bg-white rounded-2xl border border-gray-100">
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
    <View className="mb-4">
      <Text className="text-sm text-gray-700 mb-2">{field.label}</Text>
      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <Feather name={field.icon} size={18} color="#6b7280" />
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

const Profile = () => {
  const { user, reFetchProfile } = useAuthContext();

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
    setSelectedAvatar(avatarIndex);
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
        isVisible={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Profile"
      >
        {/* Avatar Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Image
              source={avatarImages[selectedAvatar]}
              className="w-16 h-16 rounded-full border-3 border-gray-200"
            />
            <View className="ml-4">
              <Text className="text-lg font-semibold text-gray-800">Profile Picture</Text>
              <Text className="text-sm text-gray-500">Tap to change your avatar</Text>
            </View>
          </View>
          <AvatarSelector 
            selectedAvatar={selectedAvatar} 
            onSelect={handleAvatarSelect} 
          />
        </View>

        {/* Profile Fields */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-800 mb-4">Personal Information</Text>
          {profileFields.map((field, idx) => (
            <ProfileField
              key={idx}
              field={field}
              value={editedProfile[field.name]}
              onChangeText={(text) => handleInputChange(field.name, text)}
              isEditing={true}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="space-y-3 pb-6">
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isLoading}
            className={`p-4 rounded-2xl flex-row justify-center items-center ${
              isLoading ? 'bg-gray-400' : 'bg-green-600'
            }`}
          >
            {isLoading ? (
              <MaterialIcons name="refresh" size={20} color="white" />
            ) : (
              <Feather name="check" size={20} color="white" />
            )}
            <Text className="text-white ml-3 text-base font-semibold">
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={closeEditModal}
            disabled={isLoading}
            className="bg-gray-100 p-4 rounded-2xl flex-row justify-center items-center border border-gray-200"
          >
            <Feather name="x" size={20} color="#6b7280" />
            <Text className="text-gray-700 ml-3 text-base font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
};

export default Profile;
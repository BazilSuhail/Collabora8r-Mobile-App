import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Image, TouchableOpacity, Modal, FlatList, Alert, ScrollView } from "react-native";
import { FontAwesome5, Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';

const Profile = () => {
    const [profile, setProfile] = useState({
        _id: '',
        name: '',
        gender: '',
        phone: '',
        email: '',
        dob: '',
        avatar: '1',
    });
    const { user, reFetchProfile } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    useEffect(() => {
        const fetchProfile = () => {
            try {
                setProfile(user);
                setSelectedAvatar(user.avatar);
            } catch (err) {
                setError('Error fetching profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = await AsyncStorage.getItem('token');
            const updatedProfile = { ...profile, avatar: selectedAvatar };

            const response = await axios.put(`${config.VITE_REACT_APP_API_BASE_URL}/profile`, updatedProfile, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setProfile(response.data);
            setIsEditing(false);
            reFetchProfile();
        }
        catch (err) {
            setError(err.response ? err.response.data.error : 'Error updating profile');
        }
    };

    const openAvatarModal = () => {
        setIsAvatarModalOpen(true);
    };

    const closeAvatarModal = () => {
        setIsAvatarModalOpen(false);
    };

    const selectAvatar = (index) => {
        setSelectedAvatar(index + 1);
        console.log("is " + selectedAvatar)
        setIsAvatarModalOpen(false);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <View className="bg-white p-8 rounded-2xl shadow-lg">
                    <MaterialIcons name="refresh" size={32} color="#6366f1" className="mb-4 self-center" />
                    <Text className="text-gray-600 text-lg">Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="px-6 py-4">
                {!isEditing ? (
                    <View>
                        {/* Header Card */}
                        <View className="bg-white rounded-3xl mb-6 overflow-hidden shadow-lg shadow-black/5">
                            <View className="h-48 relative">
                                <Image source={themeImages["1"]} className="absolute w-full h-full" />
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                    className="absolute w-full h-full"
                                />
                                <View className="absolute bottom-0 left-0 right-0 p-6">
                                    <View className="flex-row items-center">
                                        <View className="relative">
                                            <Image 
                                                source={avatarImages[user.avatar]} 
                                                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                                            />
                                            <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-white text-lg font-medium opacity-90">Hello,</Text>
                                            <Text className="text-white text-2xl font-bold">{profile.name}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Profile Information */}
                        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg shadow-black/5">
                            <Text className="text-xl font-bold text-gray-800 mb-6">Profile Information</Text>
                            
                            {[
                                { icon: "user", label: "Full Name", value: profile.name, color: "#6366f1" },
                                { icon: "mail", label: "Email", value: profile.email, color: "#ec4899" },
                                { icon: "phone", label: "Phone", value: profile.phone, color: "#10b981" },
                                { icon: "users", label: "Gender", value: profile.gender, color: "#f59e0b" },
                                { icon: "calendar", label: "Date of Birth", value: new Date(profile.dob).toLocaleDateString(), color: "#8b5cf6" },
                            ].map((item, index) => (
                                <View
                                    key={index}
                                    className="flex-row items-center p-4 mb-3 bg-gray-50 rounded-2xl border border-gray-100"
                                >
                                    <View className="w-10 h-10 rounded-full justify-center items-center mr-4" style={{ backgroundColor: item.color + '20' }}>
                                        <Feather name={item.icon} size={18} color={item.color} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-500 mb-1">{item.label}</Text>
                                        <Text className="text-base font-semibold text-gray-800">{item.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Edit Button */}
                        <TouchableOpacity
                            onPress={() => setIsEditing(true)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-indigo-500/25"
                        >
                            <Feather name="edit-3" size={20} color="white" className="mr-3" />
                            <Text className="text-white text-base font-semibold">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {/* Edit Header */}
                        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg shadow-black/5">
                            <View className="flex-row items-center mb-6">
                                <View className="relative">
                                    <Image 
                                        source={avatarImages[selectedAvatar]} 
                                        className="w-20 h-20 rounded-full border-4 border-gray-200"
                                    />
                                    <TouchableOpacity
                                        onPress={openAvatarModal}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full justify-center items-center shadow-lg"
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
                        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg shadow-black/5">
                            {[
                                { placeholder: "Full Name", value: profile.name, name: "name", icon: "user" },
                                { placeholder: "Gender", value: profile.gender, name: "gender", icon: "users" },
                                { placeholder: "Date of Birth", value: new Date(profile.dob).toLocaleDateString(), name: "dob", icon: "calendar" },
                                { placeholder: "Phone Number", value: profile.phone, name: "phone", keyboardType: "phone-pad", icon: "phone" },
                            ].map((field, index) => (
                                <View key={index} className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">{field.placeholder}</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                        <Feather name={field.icon} size={18} color="#6b7280" className="mr-3" />
                                        <TextInput
                                            className="flex-1 text-base text-gray-800"
                                            placeholder={`Enter ${field.placeholder.toLowerCase()}`}
                                            value={field.value}
                                            keyboardType={field.keyboardType}
                                            onChangeText={(text) => setProfile({ ...profile, [field.name]: text })}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View className="space-y-3">
                            <TouchableOpacity
                                onPress={handleUpdate}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-green-500/25"
                            >
                                <Feather name="check" size={20} color="white" className="mr-3" />
                                <Text className="text-white text-base font-semibold">Update Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsEditing(false)}
                                className="bg-gray-100 p-4 rounded-2xl flex-row justify-center items-center border border-gray-200"
                            >
                                <Feather name="x" size={20} color="#6b7280" className="mr-3" />
                                <Text className="text-gray-700 text-base font-semibold">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Avatar Modal */}
            <Modal visible={isAvatarModalOpen} transparent animationType="slide">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
                        <View className="flex-row items-center justify-between mb-6">
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
                            keyExtractor={(_, index) => index.toString()}
                            numColumns={3}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ index }) => (
                                <TouchableOpacity 
                                    onPress={() => selectAvatar(index)}
                                    className="flex-1 items-center p-3"
                                >
                                    <View className={`rounded-full p-1 ${selectedAvatar === index + 1 ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                        <Image 
                                            source={avatarImages[index + 1]} 
                                            className="w-20 h-20 rounded-full"
                                        />
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
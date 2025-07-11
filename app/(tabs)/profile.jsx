import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Image, TouchableOpacity, Modal, FlatList, Alert } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

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
                setError('Error fetching sdsd profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    /*useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('token');

                const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/auth`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setProfile(response.data);
                //console.log(response.data.avatar)
                setSelectedAvatar(response.data.avatar); // Initialize selectedAvatar with current avatar
                setProfileImage(`@/assets/Themes/${profile.avatar}.jpg`)
            } catch (err) {
                setError('Error fetching sdsd profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);*/

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
        return <View><Text>loading</Text></View>;
    }
    return (
        <View className="flex-1 bg-white p-4">
            <View className="border border-gray-200 rounded-xl p-4 shadow-md shadow-black/10">
                {!isEditing ? (
                    <View>
                        <View className="mb-5 h-44 rounded-xl overflow-hidden relative">
                            <Image source={themeImages["1"]} className="absolute w-full h-full" />
                            <View className="bg-black/30 p-5 h-full justify-end">
                                <View className="flex-row items-center">
                                    <Image source={avatarImages[user.avatar]} className="w-17 h-17 rounded-full border border-gray-300" />
                                    <View className="ml-4">
                                        <Text className="text-white text-xl font-bold">Hello,</Text>
                                        <Text className="text-white text-2xl font-bold">{profile.name}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View>
                            {[
                                { icon: "user", label: "Full Name", value: profile.name },
                                { icon: "envelope", label: "Email", value: profile.email },
                                { icon: "phone", label: "Phone", value: profile.phone },
                                { icon: "venus-mars", label: "Gender", value: profile.gender },
                                { icon: "calendar", label: "Date of Birth", value: new Date(profile.dob).toLocaleDateString() },
                            ].map((item, index) => (
                                <View
                                    key={index}
                                    className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2"
                                >
                                    <FontAwesome5 name={item.icon} size={20} color="#275ca2" className="mr-3" />
                                    <View>
                                        <Text className="text-base font-semibold text-gray-800">{item.label}</Text>
                                        <Text className="text-sm text-gray-600">{item.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => setIsEditing(true)}
                            className="flex-row justify-center items-center bg-[#275ca2] p-3 rounded-lg mt-5"
                        >
                            <FontAwesome5 name="edit" size={18} color="white" className="mr-2" />
                            <Text className="text-white text-base">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View className="flex-row items-center mb-5">
                            <Image source={avatarImages[selectedAvatar]} className="w-17 h-17 rounded-full border border-gray-300" />
                            <TouchableOpacity
                                onPress={openAvatarModal}
                                className="ml-3 bg-[#275ca2] px-3 py-2 rounded-lg"
                            >
                                <Text className="text-white text-sm">Change Avatar</Text>
                            </TouchableOpacity>
                        </View>

                        {[
                            { placeholder: "Name", value: profile.name, name: "name" },
                            { placeholder: "Gender", value: profile.gender, name: "gender" },
                            { placeholder: "Date of Birth", value: new Date(profile.dob).toLocaleDateString(), name: "dob" },
                            { placeholder: "Phone", value: profile.phone, name: "phone", keyboardType: "phone-pad" },
                        ].map((field, index) => (
                            <TextInput
                                key={index}
                                className="border border-gray-200 rounded-lg p-3 mb-3"
                                placeholder={field.placeholder}
                                value={field.value}
                                keyboardType={field.keyboardType}
                                onChangeText={(text) => setProfile({ ...profile, [field.name]: text })}
                            />
                        ))}

                        <TouchableOpacity
                            onPress={handleUpdate}
                            className="bg-[#275ca2] p-3 rounded-lg items-center mt-3"
                        >
                            <Text className="text-white text-base">Update Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsEditing(false)}
                            className="bg-red-500 p-3 rounded-lg items-center mt-3"
                        >
                            <Text className="text-white text-base">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Avatar Modal */}
            <Modal visible={isAvatarModalOpen} transparent animationType="fade">
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <View className="bg-white p-5 rounded-xl w-[90%]">
                        <Text className="text-lg font-bold mb-5">Select an Avatar</Text>
                        <FlatList
                            data={Array.from({ length: 12 })}
                            keyExtractor={(_, index) => index.toString()}
                            numColumns={3}
                            renderItem={({ index }) => (
                                <TouchableOpacity onPress={() => selectAvatar(index)}>
                                    <Image source={avatarImages[index + 1]} className="w-20 h-20 m-1.5 rounded-full" />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            onPress={() => setIsAvatarModalOpen(false)}
                            className="bg-red-500 p-3 rounded-lg items-center mt-4"
                        >
                            <Text className="text-white text-base">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>

    );
};

export default Profile;

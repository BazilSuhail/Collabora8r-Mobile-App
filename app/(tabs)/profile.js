import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Image, TouchableOpacity, Modal, FlatList, Alert } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    useEffect(() => {
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
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = await AsyncStorage.getItem('token');
            const updatedProfile = { ...profile, avatar: selectedAvatar }; // Include avatar in profile update
            console.log("Sd")
            const response = await axios.put(`${config.VITE_REACT_APP_API_BASE_URL}/auth`, updatedProfile, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("11")

            setProfile(response.data);
            setIsEditing(false);
        } catch (err) {
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
        console.log("is "+selectedAvatar)
        setIsAvatarModalOpen(false);
    };

    if (loading) {
        return <View><Text>loading</Text></View>;
    }
    return (
        <View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
            <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
                {!isEditing ? (
                    <View>
                        <View style={{ marginBottom: 20, height: 180, borderRadius: 10, overflow: "hidden" }}>
                            <Image source={themeImages["1"]} style={{ width: "100%", height: "100%", position: "absolute" }} />
                            <View style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: 20, height: "100%", justifyContent: "flex-end" }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Image source={avatarImages[profile.avatar]} style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: "#ccc" }} />
                                    <View style={{ marginLeft: 16 }}>
                                        <Text style={{ fontSize: 24, color: "white", fontWeight: "bold" }}>Hello,</Text>
                                        <Text style={{ fontSize: 32, color: "white", fontWeight: "bold" }}>{profile.name}</Text>
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
                                <View key={index} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                                    <FontAwesome5 name={item.icon} size={24} color="#275ca2" style={{ marginRight: 10 }} />
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>{item.label}</Text>
                                        <Text style={{ fontSize: 14, color: "#666" }}>{item.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity onPress={() => setIsEditing(true)} style={{ backgroundColor: "#275ca2", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 20 }}>
                            <FontAwesome5 name="edit" size={18} color="white" style={{ marginRight: 5 }} />
                            <Text style={{ color: "white", fontSize: 16 }}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                            <Image source={avatarImages[selectedAvatar]} style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: "#ccc" }} />
                            <TouchableOpacity onPress={openAvatarModal} style={{ marginLeft: 10, backgroundColor: "#275ca2", padding: 10, borderRadius: 8 }}>
                                <Text style={{ color: "white", fontSize: 14 }}>Change Avatar</Text>
                            </TouchableOpacity>
                        </View>

                        {[
                            { placeholder: "Name", value: profile.name, name: "name" },
                            { placeholder: "Gender", value: profile.gender, gender: "name" },
                            { placeholder: "Date of Birth", value: new Date(profile.dob).toLocaleDateString(), gender: "dob" },
                            { placeholder: "Phone", value: profile.phone, name: "phone", keyboardType: "phone-pad" },
                        ].map((field, index) => (
                            <TextInput
                                key={index}
                                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 }}
                                placeholder={field.placeholder}
                                value={field.value}
                                onChangeText={(text) => setProfile({ ...profile, [field.name]: text })}
                            />
                        ))}

                        <TouchableOpacity onPress={handleUpdate} style={{ backgroundColor: "#275ca2", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10 }}>
                            <Text style={{ color: "white", fontSize: 16 }}>Update Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={{ backgroundColor: "red", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10 }}>
                            <Text style={{ color: "white", fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <Modal visible={isAvatarModalOpen} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: "90%" }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>Select an Avatar</Text>
                        <FlatList
                            data={Array.from({ length: 12 })}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={3}
                            renderItem={({ index }) => (
                                <TouchableOpacity onPress={() => selectAvatar(index)}>
                                    <Image source={avatarImages[index + 1]} style={{ width: 80, height: 80, margin: 5, borderRadius: 40 }} />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setIsAvatarModalOpen(false)} style={{ backgroundColor: "red", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10 }}>
                            <Text style={{ color: "white", fontSize: 16 }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Profile;

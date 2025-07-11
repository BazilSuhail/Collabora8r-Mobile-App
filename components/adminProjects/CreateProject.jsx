import { useState } from 'react';
import axios from 'axios';

import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, FlatList, Modal } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import themeImages from '@/constants/themes';


const CreateProject = ({ setShowModal, showModal }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectManagerEmail, setProjectManagerEmail] = useState('');
    const [theme, setTheme] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showThemeModal, setShowThemeModal] = useState(false);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const token = await AsyncStorage.getItem('token');

        try {
            await axios.post(
                `${config.VITE_REACT_APP_API_BASE_URL}/projects/create`,
                { name, description, projectManagerEmail, theme },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSuccess('Project created successfully!');
            setName('');
            setDescription('');
            setProjectManagerEmail('');
            setTheme(null);
            setShowModal(false);
        } catch (err) {
            setError('Failed to create project.');
        }
    };

    return (
        <Modal transparent={true} visible={showModal} animationType="none">
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-white rounded-xl px-5 w-[90%] max-w-[400px]">
                    <TouchableOpacity onPress={() => setShowModal(!showModal)} className="self-end">
                        <Text className="text-[28px] text-gray-500">&times;</Text>
                    </TouchableOpacity>

                    <Text className="text-[18px] font-semibold text-center mb-2">
                        Create A New Project
                    </Text>
                    <View className="h-[2px] bg-gray-300 my-2.5" />

                    {error && <Text className="text-red-500 mb-2.5">{error}</Text>}
                    {success && <Text className="text-green-600 mb-2.5">{success}</Text>}

                    <View>
                        <View className="flex-row items-center">
                            <FontAwesome5 name="subscript" size={16} color="#4B5563" />
                            <Text className="ml-1.5 text-sm font-semibold text-gray-600">
                                Project Name
                            </Text>
                        </View>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            className="border border-gray-300 rounded-md mt-1.5 p-2 text-sm"
                            placeholder="Enter project name"
                        />
                    </View>

                    <View className="flex-row justify-between mt-4">
                        <View className="w-[48%]">
                            <View className="flex-row items-center">
                                <FontAwesome5 name="palette" size={16} color="#4B5563" />
                                <Text className="ml-1.5 text-sm font-semibold text-gray-600">
                                    Select Theme
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowThemeModal(true)}
                                className="border border-gray-300 rounded-md mt-1.5 p-2 items-center"
                            >
                                <Text className="text-sm">
                                    {theme !== null ? `Theme ${theme + 1}` : 'Select Theme'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="w-[48%]">
                            <View className="flex-row items-center">
                                <FontAwesome name="envelope" size={16} color="#4B5563" />
                                <Text className="ml-1.5 text-sm font-semibold text-gray-600">
                                    Manager Email
                                </Text>
                            </View>
                            <TextInput
                                value={projectManagerEmail}
                                onChangeText={setProjectManagerEmail}
                                className="border border-gray-300 rounded-md mt-1 p-2 h-[38px] text-[14px]"
                                placeholder="Enter manager's email"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View className="mt-4">
                        <View className="flex-row items-center">
                            <FontAwesome5 name="file-alt" size={16} color="#4B5563" />
                            <Text className="ml-1.5 text-sm font-semibold text-gray-600">
                                Project Description
                            </Text>
                        </View>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            className="border border-gray-300 rounded-md mt-1.5 p-2 text-sm text-top h-[80px]"
                            multiline
                            numberOfLines={4}
                            placeholder="Enter project description"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleCreateProject}
                        className="bg-[#275ca2] mt-5 py-2.5 px-3 rounded-md flex-row justify-center items-center mb-[18px]"
                    >
                        <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                        <Text className="text-white text-sm ml-2.5">
                            Create Project
                        </Text>
                    </TouchableOpacity>
                </View>

                {showThemeModal && (
                    <Modal transparent={true} visible={showThemeModal} animationType="none">
                        <View className="bg-black/40 flex-1 py-[55px] items-center justify-center">
                            <ScrollView
                                className="w-[90vw] pt-[10px] pb-[45px] rounded-[10px] px-[15px] bg-white"
                                showsVerticalScrollIndicator={false}
                            >
                                <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                                    <Text className="scale-x-[1.4] font-[700] text-gray-700 mb-[10px] ml-auto">
                                        X
                                    </Text>
                                </TouchableOpacity>

                                {Array.from({ length: 6 }).map((_, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setTheme(index);
                                            setShowThemeModal(false);
                                        }}
                                        className="overflow-hidden w-full h-[120px] mb-[8px] rounded-[10px]"
                                    >
                                        <Image
                                            source={themeImages[index + 1]}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal>

    );
};

export default CreateProject;

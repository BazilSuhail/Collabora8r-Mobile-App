import axios from 'axios';
import { useEffect, useState } from 'react';

import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import config from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themeImages from '@/constants/themes';

const EditProject = ({ setShowModal, project, showModal }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionHeight, setDescriptionHeight] = useState(10);
    const [projectManagerEmail, setProjectManagerEmail] = useState('');
    const [theme, setTheme] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showThemeModal, setShowThemeModal] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name || '');
            setDescription(project.description || '');
            setProjectManagerEmail(project.projectManager.email || '');
            setTheme(project.theme || null);
        }
    }, [project]);

    const handleEditProject = async (e) => {
        e.preventDefault();
        const token = await AsyncStorage.getItem('token');

        try {
            await axios.put(
                `${config.VITE_REACT_APP_API_BASE_URL}/projects/${project._id}/update`,
                { name, description, projectManagerEmail, theme },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSuccess('Project updated successfully!');
            setShowModal(false);
        } catch (err) {
            setError('Failed to update project.');
        }
    };

    return (
        <Modal transparent={true} visible={showModal} animationType="fade">
            <View className="flex-1 bg-black/60 justify-center items-center px-4">
                <View className="bg-white rounded-2xl shadow-2xl max-h-[480px] max-w-md">
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-6 pb-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                                <FontAwesome5 name="edit" size={18} color="#3B82F6" />
                            </View>
                            <Text className="text-xl font-bold text-gray-800">
                                Update Project
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View className="h-px bg-gray-200 mx-6" />

                    <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
                        {/* Error/Success Messages */}
                        {error ? (
                            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <Text className="text-red-700 text-sm">{error}</Text>
                            </View>
                        ) : null}
                        {success ? (
                            <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <Text className="text-green-700 text-sm">{success}</Text>
                            </View>
                        ) : null}

                        {/* Project Name */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2">
                                <FontAwesome5 name="project-diagram" size={16} color="#6B7280" />
                                <Text className="ml-2 text-sm font-semibold text-gray-700">
                                    Project Name
                                </Text>
                            </View>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500"
                                placeholder="Enter project name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Theme and Manager Email Row */}
                        <View className="flex-row justify-between mb-6">
                            {/* Theme Selection */}
                            <View className="w-[48%]">
                                <View className="flex-row items-center mb-2">
                                    <FontAwesome5 name="palette" size={16} color="#6B7280" />
                                    <Text className="ml-2 text-sm font-semibold text-gray-700">
                                        Theme
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowThemeModal(true)}
                                    className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 flex-row items-center justify-between"
                                >
                                    <Text className="text-gray-800 text-sm">
                                        {theme !== null ? `Theme ${parseInt(theme) + 1}` : 'Select Theme'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            {/* Manager Email */}
                            <View className="w-[48%]">
                                <View className="flex-row items-center mb-2">
                                    <FontAwesome name="envelope" size={16} color="#6B7280" />
                                    <Text className="ml-2 text-sm font-semibold text-gray-700">
                                        Manager
                                    </Text>
                                </View>
                                <TextInput
                                    value={projectManagerEmail}
                                    onChangeText={setProjectManagerEmail}
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500"
                                    placeholder="Email"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Description */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2">
                                <FontAwesome5 name="file-alt" size={16} color="#6B7280" />
                                <Text className="ml-2 text-sm font-semibold text-gray-700">
                                    Description
                                </Text>
                            </View>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                onContentSizeChange={(e) => {
                                    const newHeight = e.nativeEvent.contentSize.height;
                                    // Clamp the height to avoid insane values
                                    if (newHeight > 40 && newHeight < 300) {
                                        setDescriptionHeight(newHeight);
                                    }
                                }}
                                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500"
                                multiline
                                placeholder="Enter project description"
                                placeholderTextColor="#9CA3AF"
                                textAlignVertical="top"
                                style={{ height: descriptionHeight }}
                            />

                        </View>

                        {/* Update Button */}
                        <TouchableOpacity
                            onPress={handleEditProject}
                            className="bg-blue-600 rounded-lg py-4 px-6 mb-8 flex-row items-center justify-center  active:bg-blue-700"
                        >
                            <FontAwesome5 name="check-circle" size={18} color="white" />
                            <Text className="text-white font-semibold ml-2 text-base">
                                Update Project
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Theme Selection Modal */}
                {showThemeModal && (
                    <Modal transparent={true} visible={showThemeModal} animationType="fade">
                        <View className="flex-1 justify-center items-center px-4">
                            <View className="bg-white rounded-2xl h-[700px] shadow-2xl w-full max-w-md">
                                {/* Modal Header */}
                                <View className="flex-row justify-between items-center p-6 pb-4">
                                    <Text className="text-lg font-bold text-gray-800">
                                        Choose Theme
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setShowThemeModal(false)}
                                        className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                                    >
                                        <Ionicons name="close" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View className="h-px bg-gray-200 mx-6" />

                                {/* Theme Grid */}
                                <ScrollView
                                    className="h-[700px] px-3"
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View className="flex-row flex-wrap justify-center">
                                        {Array.from({ length: 6 }).map((_, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    setTheme(index+1);
                                                    setShowThemeModal(false);
                                                }}
                                                className={`w-full h-32 my-2 rounded-xl overflow-hidden  ${theme === index ? 'border-2 border-blue-500' : 'border border-gray-200'
                                                    }`}
                                            >
                                                <Image
                                                    source={themeImages[index + 1]}
                                                    className="w-full h-full"
                                                />
                                                {theme === index && (
                                                    <View className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                                                        <FontAwesome5 name="check" size={10} color="white" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal>
    );
};

export default EditProject;
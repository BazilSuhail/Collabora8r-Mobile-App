import { useState } from 'react';
import axios from 'axios';

import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, FlatList, Modal } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
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
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <View
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 10,
                        paddingHorizontal: 20,
                        width: '90%',
                        maxWidth: 400,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setShowModal(!showModal)}
                        style={{ alignSelf: 'flex-end' }}
                    >
                        <Text style={{ fontSize: 28, color: 'gray' }}>&times;</Text>
                    </TouchableOpacity>

                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: 10,
                        }}
                    >
                        Create A New Project
                    </Text>
                    <View
                        style={{
                            height: 2,
                            backgroundColor: '#D1D5DB',
                            marginVertical: 10,
                        }}
                    />

                    {error ? (
                        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
                    ) : null}
                    {success ? (
                        <Text style={{ color: 'green', marginBottom: 10 }}>{success}</Text>
                    ) : null}

                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="subscript" size={16} color="#4B5563" />
                            <Text
                                style={{
                                    marginLeft: 5,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#4B5563',
                                }}
                            >
                                Project Name
                            </Text>
                        </View>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 5,
                                marginTop: 5,
                                padding: 8,
                                fontSize: 14,
                            }}
                            placeholder="Enter project name"
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 15,
                        }}
                    >
                        <View style={{ width: '48%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome5 name="palette" size={16} color="#4B5563" />
                                <Text
                                    style={{
                                        marginLeft: 5,
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#4B5563',
                                    }}
                                >
                                    Select Theme
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowThemeModal(true)}
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                    borderRadius: 5,
                                    marginTop: 5,
                                    padding: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 14 }}>
                                    {theme !== null ? `Theme ${theme + 1}` : 'Select Theme'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ width: '48%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome name="envelope" size={16} color="#4B5563" />
                                <Text 
                                    style={{
                                        marginLeft: 5,
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#4B5563',
                                    }}
                                >
                                    Manager Email
                                </Text>
                            </View>
                            <TextInput
                                value={projectManagerEmail}
                                onChangeText={setProjectManagerEmail}
                                className="border border-gray-300 rounded-md mt-1 p-2 h-[38px] placeholder:text-[8px] text-[14px]"
                                placeholder="Enter manager's email"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={{ marginTop: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="file-alt" size={16} color="#4B5563" />
                            <Text
                                style={{
                                    marginLeft: 5,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#4B5563',
                                }}
                            >
                                Project Description
                            </Text>
                        </View>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 5,
                                marginTop: 5,
                                padding: 8,
                                fontSize: 14,
                                textAlignVertical: 'top',
                                height: 80,
                            }}
                            multiline
                            numberOfLines={4}
                            placeholder="Enter project description"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleCreateProject}
                        style={{
                            backgroundColor: '#275ca2',
                            marginTop: 22,
                            padding: 10,
                            borderRadius: 5,
                            flexDirection: 'row',
                            marginBottom:18,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 14,
                                marginLeft: 10,
                            }}
                        >
                            Create Project
                        </Text>
                    </TouchableOpacity>
                </View>

                {showThemeModal && (
                    <Modal transparent={true} visible={showThemeModal} animationType="none">
                        <View className='bg-black/40 flex-1 py-[55px] items-center justify-center'
                        >
                            <ScrollView
                                className='w-[90vw] pt-[10px] pb-[45px] rounded-[10px] px-[15px] bg-white'
                                showsVerticalScrollIndicator={false}
                            >
                                <TouchableOpacity
                                    onPress={() => setShowThemeModal(false)}
                                >
                                    <Text className='scale-x-[1.4] font-[700] text-gray-700 mb-[10px] ml-auto'>X</Text>
                                </TouchableOpacity>

                                {Array.from({ length: 6 }).map((_, index) => (
                                    <TouchableOpacity key={index}
                                        onPress={() => {
                                            setTheme(index);
                                            setShowThemeModal(false);
                                        }}
                                        className='overflow-hidden w-full h-[120px] mb-[8px] rounded-[10px]'
                                    >
                                        {/*<View className='bg-red-400 w-full rounded-lg h-[120px]'></View>*/}
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

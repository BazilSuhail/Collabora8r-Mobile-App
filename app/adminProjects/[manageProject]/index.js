import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from "react-native";
import {
  FontAwesome5,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import decodeJWT from '@/Config/DecodeJWT';
import { usePathname } from 'expo-router';
import EditProject from '@/components/adminProjects/EditProject';

const ProjectDetail = () => {
  //const { projectId } = useParams();
  const projectId = usePathname().split("/").pop();

  const [showModal, setShowModal] = useState(false);
  const [project, setProject] = useState(null);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch project details
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        const projectResponse = await axios.get(
          `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProject(projectResponse.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch project details.');
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleSearch = async () => {
    setError('');
    setUser(null);
    setSuccess('');
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/get-searched-user`,
        { email, projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data)
      setUser(response.data); // Assuming the API returns { name, email, avatar }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to find the user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    setError('');
    setSuccess('');

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/send-project-invitation`,
        { userId: user.userId, projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(response.data.message);
    } catch (err) {
      console.error(err);
      setError('Failed to add user to project.');
    }
  };

  if (!project) {
    return <View>
      <Text>
        lakdm
      </Text>
    </View>;;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB", padding: 16 }}>
      {/*showModal && <EditProject project={project} setShowModal={setShowModal} />*/}

      {showModal && <EditProject project={project} editModal={showModal} setShowModal={setShowModal} />}
      {/* Project Details */}
      <View
        style={{
          backgroundColor: "#FFF",
          padding: 16,
          borderRadius: 18,
          marginBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "#BFDBFE",
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <FontAwesome5 name="clipboard-list" size={28} color="#1D4ED8" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "600" }}>{project.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{
            backgroundColor: "#1E3A8A",
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <FontAwesome5 name="edit" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={{ color: "#FFF", fontWeight: "600" }}>Edit Project Details</Text>
        </TouchableOpacity>
      </View>

      {/* Task Guidelines */}
      <View
        style={{
          backgroundColor: "#FFF",
          padding: 16,
          borderRadius: 18,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FontAwesome5 name="file-alt" size={18} color="#1D4ED8" style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#1D4ED8" }}>Task Guidelines</Text>
        </View>
        <Text style={{ marginTop: 8, fontSize: 14, color: "#6B7280" }}>{project.description}</Text>
      </View>

      {/* Search User by Email */}
      <View
        style={{
          backgroundColor: "#FFF",
          padding: 16,
          borderRadius: 18,
          marginBottom: 16,
          minHeight: 200,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FontAwesome5
            name="envelope-open-text"
            size={20}
            color="#1D4ED8"
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#1D4ED8" }}>Search User by Email</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
            borderWidth: 2,
            borderColor: "#D1D5DB",
            borderRadius: 25,
            paddingHorizontal: 8,
          }}
        >
          <FontAwesome5 name="search" size={20} color="#6B7280" />
          <TextInput
            style={{ flex: 1, marginLeft: 8, paddingVertical: 6 }}
            placeholder="Enter user email"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity
            onPress={handleSearch}
            style={{
              backgroundColor: "#1E40AF",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 25,
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600" }}>Search</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={{ color: "#DC2626", marginTop: 8 }}>{error}</Text> : null}
        {success ? <Text style={{ color: "#16A34A", marginTop: 8 }}>{success}</Text> : null}
        {isLoading ? <Text>Loading...</Text> : null}

        {user && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              padding: 16,
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: `/Assets/${user.avatar}.jpg` }}
                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
              />
              <View>
                <Text style={{ fontWeight: "600", color: "#111827" }}>{user.name}</Text>
                <Text style={{ color: "#6B7280" }}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddUser}
              style={{
                backgroundColor: "#4338CA",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <FontAwesome5 name="user-plus" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: "#FFF", fontWeight: "600" }}>Add User</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Additional sections like Team Members and Tasks can follow the same structure */}
    </ScrollView>

  );
};

export default ProjectDetail;
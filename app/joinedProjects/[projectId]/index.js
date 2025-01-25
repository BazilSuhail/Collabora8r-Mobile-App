import { useState, useEffect } from 'react'
import axios from 'axios'
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
//import TeamMembers from './TeamMembersModal'
//import ProjectTasks from './ProjectTasks'

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import decodeJWT from '@/Config/DecodeJWT';
import { usePathname } from 'expo-router';
import ProjectTasks from '@/components/joinedProjects/ProjectTasks';
import TeamMembers from '@/components/joinedProjects/TeamMember';
import themeImages from '@/constants/themes';

const JoinedProjectDetails = () => {

  const pathname = usePathname();
  const projectId = pathname.split("/").pop();
  //const { projectId } = useParams();

  const [loggedUser, setloggedUser] = useState(null);
  const [project, setProject] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [error, setError] = useState({});
  const [view, setView] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const DecodeUserId = decodeJWT(token);
        setloggedUser(DecodeUserId);
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.project) {
          setProject(response.data.project)
          setTeamDetails(response.data.project.team)
          //console.log(teamDetails.length)
          //console.log(teamDetails)
        }
        else {
          setError((prev) => ({ ...prev, project: 'Project not found.' }));
        }
      }
      catch (err) {
        //console.error(err);
        setError((prev) => ({ ...prev, project: 'Failed to fetch project details.' }));
      }
    };

    const fetchProjectTasks = async () => {
      try {
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${projectId}/tasks`);

        const tasks = response.data.tasks;
        const assignedToMe = tasks.filter(task => task.task.assignedTo === loggedUser);
        const assignedToOthers = tasks.filter(task => task.task.assignedTo !== loggedUser);
        // tasks.forEach(task => { console.log(task);});

        setMyTasks(assignedToMe);
        setOtherTasks(assignedToOthers);
      }
      catch (err) {
        console.error(err);
        setError((prev) => ({ ...prev, tasks: 'Failed to fetch project tasks.' }));
      }
    };

    fetchProjectDetails();
    fetchProjectTasks();
  }, [projectId, loggedUser]);

  const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: 'white', padding: 20 },
    sectionContainer: { flexWrap: 'wrap' },
    projectImageContainer: {
      height: 220,
      borderRadius: 15,
      overflow: 'hidden',
      backgroundColor: '#f7d774',
      position: 'relative',
      marginBottom: 20,
    },
    projectImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingHorizontal: 15,
      zIndex: 10,
    },
    overlayText: { color: '#fff', fontWeight: '700' },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 8,
      backgroundColor: '#1E3A8A',
      marginBottom: 15,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    teamContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      marginBottom: 10,
    },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#ddd' },
    memberInfo: { flexDirection: 'column' },
    memberName: { fontWeight: 'bold' },
    memberEmail: { color: '#888', fontSize: 12 },
    errorMessage: { color: 'red', fontSize: 14, marginBottom: 15 },
    noMembersText: { color: '#3B82F6', textDecorationLine: 'underline', textAlign: 'center' },
  });


  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {project ? (
        <View>
          {error.project && <Text className="text-red-500 text-center">{error.project}</Text>}

          {/* Project Header */}
          <View className="relative">
            <Image source={themeImages[project.theme]} className="w-full absolute top-0 left-0 h-64 rounded-md" />

            <View className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
              <View>
                <Text className="text-white text-2xl mt-7 font-bold text-center">{project.name}</Text>
                <Text className="text-white text-base mt-2 text-center">{project.description}</Text>
              </View>
            </View>
          </View>

          {/* Section: Team and Tasks */}
          <View className="mt-6">
            {/* Team Members */}
            <View className="flex-1 mb-4">
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={() => setView('my')}
                  className={`flex-row items-center px-3 py-1.5 rounded-md ${view === 'my' ? 'bg-blue-500' : 'bg-gray-200'
                    } mr-2`}
                >
                  <FontAwesome5 name="border-all" size={16} color={view === 'my' ? '#ffffff' : '#1F2937'} className="mr-2" />
                  <Text className={`${view === 'my' ? 'text-white' : 'text-gray-800'}`}>All Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setView('all')}
                  className={`flex-row items-center px-3 py-1.5 rounded-md ${view === 'all' ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                >
                  <FontAwesome5 name="tasks" size={16} color={view === 'all' ? '#ffffff' : '#1F2937'} className="mr-2" />
                  <Text className={`${view === 'all' ? 'text-white' : 'text-gray-800'}`}>My Tasks</Text>
                </TouchableOpacity>
              </View>

              {/* Team Members List */}
              <TeamMembers teamDetails={teamDetails} isOpen={isModalOpen} onClose={closeModal} />
            </View>

            {/* Tasks Section */}
            <View className="flex-1 ml-4">
              {view === 'my' ? (
                <ProjectTasks creator={project.createdBy} tasks={otherTasks} />
              ) : (
                <ProjectTasks creator={project.createdBy} tasks={myTasks} />
              )}
            </View>
          </View>
        </View>
      ) : (
        <Text className="text-center text-lg text-gray-800">Project not found.</Text>
      )}
    </ScrollView>

  );
};

export default JoinedProjectDetails;

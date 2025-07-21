import config from '@/config/config';
import decodeJWT from '@/config/decodeJWT';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const JoinedProjectDetails = () => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const projectId = pathname.split('/').pop();
  const router = useRouter();

  const [loggedUser, setLoggedUser] = useState(null);
  const [project, setProject] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [error, setError] = useState({});
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const { myTasks, otherTasks } = useMemo(() => {
    if (!allTasks.length || !loggedUser) return { myTasks: [], otherTasks: [] };
    const assignedToMe = allTasks.filter(task => task.task.assignedTo === loggedUser);
    const assignedToOthers = allTasks.filter(task => task.task.assignedTo !== loggedUser);
    return { myTasks: assignedToMe, otherTasks: assignedToOthers };
  }, [allTasks, loggedUser]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError(prev => ({ ...prev, auth: 'Authentication required' }));
        return;
      }
      const decodedUserId = decodeJWT(token);
      setLoggedUser(decodedUserId);
      const response = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject(response.data.project);
      setTeamDetails(response.data.project.team || []);
    } catch (err) {
      //console.error('Project fetch error:', err);
      setError(prev => ({ ...prev, project: 'Failed to fetch project details.' }));
    }
  }, [projectId]);

  const fetchProjectTasks = useCallback(async () => {
    if (!project) return;
    try {
      const response = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${projectId}/tasks`
      );
      setAllTasks(response.data.tasks || []);
    } catch (err) {
      //console.error('Tasks fetch error:', err);
      setError(prev => ({ ...prev, tasks: 'Failed to fetch project tasks.' }));
    } finally {
      setLoading(false);
    }
  }, [project, projectId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProjectDetails(), fetchProjectTasks()]);
    setRefreshing(false);
  }, [fetchProjectDetails, fetchProjectTasks]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  useEffect(() => {
    fetchProjectTasks();
  }, [fetchProjectTasks]);

  const handleTaskClick = useCallback((taskId) => {
    if (!project?.createdBy) return;
    router.push(`/${taskId}-${project.createdBy}`);
  }, [project?.createdBy, router]);

  const getStatusStyle = useCallback((status) => {
    const statusMap = {
      'Not Started': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'InProgress': 'bg-amber-100 text-amber-700 border-amber-200',
      'In Progress': 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }, []);

  const getPriorityStyle = useCallback((priority) => {
    const priorityMap = {
      'High': 'bg-red-100 text-red-700 border-red-200',
      'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Low': 'bg-green-100 text-green-700 border-green-200'
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'No due date';
    const dateObj = new Date(date.$date || date);
    return isNaN(dateObj.getTime()) ? 'Invalid date' : dateObj.toLocaleDateString();
  }, []);

  const TaskCard = useCallback(({ task, user }) => (
    <TouchableOpacity
      onPress={() => handleTaskClick(task._id)}
      className="bg-gray-100 rounded-2xl p-5 mb-4 border border-gray-200 active:opacity-80"
    >
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 bg-indigo-100 rounded-xl items-center justify-center mr-4">
            <FontAwesome5 name="clipboard-list" size={20} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-base mb-2 leading-5" numberOfLines={2}>
              {task.title || 'Untitled Task'}
            </Text>

          </View>
        </View>
      </View>
      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-3">
              <MaterialIcons name="schedule" size={16} color="#EF4444" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-medium">Due Date</Text>
              <Text className="text-gray-900 text-sm font-semibold">{formatDate(task.dueDate)}</Text>
            </View>
          </View>
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
              <Ionicons name="person" size={16} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-medium">Assigned to</Text>
              <Text className="text-gray-900 text-sm font-semibold" numberOfLines={1}>
                {user?.name || 'Unassigned'}
              </Text>
            </View>
          </View>
        </View>
        <View className="h-px bg-white my-3" />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-gray-50 rounded-lg items-center justify-center mr-3">
              <MaterialIcons name="comment" size={16} color="#6B7280" />
            </View>
            <Text className="text-gray-600 text-sm">
              {task.comments?.length || 0} {(task.comments?.length || 0) === 1 ? 'Comment' : 'Comments'}
            </Text>
          </View>
          <View className="flex-row items-center ">
            <View className={`px-2 py-1 rounded-full border mr-2 ${getPriorityStyle(task.priority)}`}>
              <Text className="text-xs font-medium">{task.priority || 'No Priority'}</Text>
            </View>
            <View className={`px-2 py-1 rounded-full border ${getStatusStyle(task.status)}`}>
              <Text className="text-xs font-medium">{task.status || 'No Status'}</Text>
            </View>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  ), [handleTaskClick, getPriorityStyle, getStatusStyle, formatDate]);

  const EmptyState = useCallback(({ message }) => (
    <View className="items-center py-12">
      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <FontAwesome5 name="clipboard-list" size={24} color="#9CA3AF" />
      </View>
      <Text className="text-gray-500 text-base font-medium text-center">{message}</Text>
    </View>
  ), []);

  const TasksList = useCallback(({ tasks, isEmpty, emptyMessage }) => {
    if (isEmpty) return <EmptyState message={emptyMessage} />;
    return (
      <View>
        {tasks.map((item, index) => (
          <TaskCard key={item.task._id || index} task={item.task} user={item.user} />
        ))}
      </View>
    );
  }, [TaskCard, EmptyState]);

  const currentTasks = showMyTasks ? myTasks : otherTasks;
  const totalTasks = myTasks.length + otherTasks.length;

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500 text-base">Loading project details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 relative">
      {project ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: insets.bottom + 55,
              paddingHorizontal: 16
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* {(error.project || error.tasks || error.auth) && (
              <View className="flex-row items-center bg-red-50 p-4 mx-4 mt-4 rounded-xl border border-red-200">
                <MaterialIcons name="error-outline" size={20} color="#EF4444" />
                <Text className="text-red-500 text-sm font-medium ml-2">
                  {error.project || error.tasks || error.auth}
                </Text>
              </View>
            )} */}


            <View className="rounded-2xl mb-2 overflow-hidden">
              <View className="relative h-[148px] mb-3 w-full">
                <View className="absolute inset-0 w-full">
                  <Image
                    source={themeImages[project.theme]}
                    className="h-full w-full rounded-[12px] object-cover"
                  />
                </View>
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  className="absolute w-full h-full rounded-[12px] overflow-hidden"
                />
                <View className="absolute inset-0 p-5 flex justify-center">
                  <Text className="text-white text-2xl font-bold mb-2">{project.name}</Text>
                </View>
              </View>
            </View>

            {!showMyTasks && (
              <>
                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 ">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-blue-100 rounded-full justify-center items-center mr-3">
                      <FontAwesome5 name="file-alt" size={16} color="#3B82F6" />
                    </View>
                    <Text className="text-lg font-semibold text-gray-900">Project Description</Text>
                  </View>
                  <Text className="text-sm text-gray-500 leading-5">{project.description}</Text>
                </View>

                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 ">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-yellow-100 rounded-full justify-center items-center mr-3">
                      <FontAwesome5 name="crown" size={16} color="#F59E0B" />
                    </View>
                    <Text className="text-lg font-semibold text-gray-900">Project Manager</Text>
                  </View>

                  <View className={`rounded-xl p-4 border ${project.projectManager.status === "Approved" ? "bg-green-50 border-green-100" : "bg-yellow-50 border-yellow-100"}`}>
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 bg-yellow-500 rounded-full justify-center items-center mr-3">
                        <FontAwesome5 name="user-tie" size={14} color="#FFFFFF" />
                      </View>
                      <View className="flex-1 ml-1">
                        <Text className="text-[13px] font-semibold text-gray-900">
                          {project.projectManager.email}
                        </Text>
                        <View className="flex-row items-center mt-[2px]">
                          <View
                            className={`w-2 h-2 mt-[1px] rounded-full mr-2 ${project.projectManager.status === "Approved"
                              ? "bg-green-500" : "bg-yellow-400 border border-yellow-500"
                              }`}
                          />
                          <Text className="text-[11px] text-gray-500 font-medium">
                            {project.projectManager.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 flex-row items-center">
                  <View className="flex-row items-center mr-5 ">
                    <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="people" size={18} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text className="text-gray-900 font-semibold text-base">{teamDetails.length}</Text>
                      <Text className="text-gray-500 text-sm">Members</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-gray-900 font-semibold text-base">{totalTasks}</Text>
                      <Text className="text-gray-500 text-sm">Tasks</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            <View className="mb-4 border border-gray-200 bg-white p-4 rounded-2xl flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="list" size={20} color="#6366F1" />
                </View>
                <View>
                  <Text className="text-gray-900 text-lg font-semibold">
                    {showMyTasks ? 'My Tasks' : 'Other Tasks'}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {showMyTasks
                      ? `${myTasks.length} tasks assigned to you`
                      : `${otherTasks.length} tasks assigned to others`
                    }
                  </Text>
                </View>
              </View>
              <View className="bg-indigo-500 rounded-full w-8 h-8 items-center justify-center">
                <Text className="text-white font-bold text-sm">
                  {showMyTasks
                    ? `${myTasks.length}`
                    : `${otherTasks.length}`
                  }
                </Text>
              </View>
            </View>

            <TasksList
              tasks={currentTasks}
              isEmpty={currentTasks.length === 0}
              emptyMessage={showMyTasks ? 'No tasks assigned to you yet' : 'No tasks assigned to other team members'}
            />
          </ScrollView>

          {/* Custom Tab Bar */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="flex-row items-center justify-around px-4 pt-3">

              {/* All Tasks Tab */}
              <TouchableOpacity
                onPress={() => setShowMyTasks(false)}
                className="flex-1 items-center pt-2"
                activeOpacity={0.6}
              >
                <View className="items-center">
                  <Ionicons
                    name={!showMyTasks ? "grid" : "grid-outline"}
                    size={24}
                    color={!showMyTasks ? '#4F46E5' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-xs font-medium mt-1 ${!showMyTasks ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                  >
                    Stream
                  </Text>
                </View>
                {/* Active indicator */}
                {!showMyTasks && (
                  <View
                    className="absolute -top-1 w-12 h-0.5 bg-indigo-500 rounded-full"
                  />
                )}
              </TouchableOpacity>

              {/* My Tasks Tab */}
              <TouchableOpacity
                onPress={() => setShowMyTasks(true)}
                className="flex-1 items-center pt-2"
                activeOpacity={0.6}
              >
                <View className="items-center">
                  <Ionicons
                    name={showMyTasks ? "person" : "person-outline"}
                    size={24}
                    color={showMyTasks ? '#4F46E5' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-xs font-medium mt-1 ${showMyTasks ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                  >
                    My Tasks
                  </Text>
                </View>
                {/* Active indicator */}
                {showMyTasks && (
                  <View
                    className="absolute -top-1 w-12 h-0.5 bg-indigo-500 rounded-full"
                  />
                )}
              </TouchableOpacity>


              {/* Team Tab */}
              <TouchableOpacity
                onPress={openModal}
                className="flex-1 items-center pt-2"
                activeOpacity={0.6}
              >
                <View className="items-center">
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color="#9CA3AF"
                  />
                  <Text className="text-xs font-medium mt-1 text-gray-400">
                    Team
                  </Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>

          {/* Team Modal */}
          <Modal transparent={true} visible={isModalOpen} animationType="fade">
            <StatusBar backgroundColor="#00000099" barStyle="light-content" animated />
            <View className="flex-1 bg-black/60 justify-end">
              <View className="bg-white rounded-t-3xl shadow-2xl h-[450px]">
                <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-200">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <FontAwesome5 name="users" size={18} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-xl font-bold text-gray-800">All Team Members</Text>
                      <Text className="text-sm text-gray-500">
                        {teamDetails.length} {teamDetails.length === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </View>
                </View>
                <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
                  {teamDetails.length > 0 ? (
                    teamDetails.map((member, index) => (
                      <View
                        key={member._id}
                        className={`flex-row items-center p-4 bg-gray-50 rounded-xl mb-3 ${index === 0 ? 'bg-blue-50 border border-blue-200' : ''}`}
                      >
                        <View className="relative">
                          <Image
                            source={avatarImages[member.avatar]}
                            className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
                          />
                          <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                        </View>
                        <View className="flex-1 ml-4">
                          <Text className="text-lg font-semibold text-gray-800 mb-1">{member.name}</Text>
                          <View className="flex-row items-center">
                            <FontAwesome name="envelope" size={12} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-2">{member.email}</Text>
                          </View>
                        </View>
                        {index === 0 && (
                          <View className="bg-blue-500 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-semibold">Lead</Text>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 items-center">
                      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                        <FontAwesome5 name="users" size={24} color="#9CA3AF" />
                      </View>
                      <Text className="text-lg font-semibold text-gray-800 mb-2">No Team Members</Text>
                      <Text className="text-sm text-gray-500 text-center">
                        Team members will appear here once they are added to the project.
                      </Text>
                    </View>
                  )}
                </ScrollView>
                <View className="p-6 pt-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={closeModal}
                    className="bg-gray-100 rounded-xl py-4 px-6 flex-row items-center justify-center"
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#6B7280" />
                    <Text className="text-gray-700 font-semibold ml-2">Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="search" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2">Project not found</Text>
          <Text className="text-gray-500 text-base text-center leading-6">
            Please check the project ID and try again
          </Text>
        </View>
      )}
    </View>
  );
};

export default JoinedProjectDetails;
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const JoinedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    const fetchJoinedProjects = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const updatedProjects = response.data.map((project) => ({
          ...project,
          color: getRandomColor(),
        }));

        setProjects(updatedProjects);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch projects.');
      }
    };

    fetchJoinedProjects();
  }, []);

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className=" border-b border-gray-100 px-3 py-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <View className="ml-3">
                <Text className="text-[15px] font-bold text-gray-900">My Projects</Text>
                <Text className="text-[10px] text-gray-500 mt-[3px]">Projects you're part of</Text>
              </View>
            </View>
          </View>
          <View className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-blue-600 font-semibold text-sm">{projects.length} Active</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-3 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Error Message */}
        {error && !projects.length ? (
          <View className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text className="text-red-600 ml-2 font-medium">{error} No projects found.</Text>
            </View>
          </View>
        ) : (
          <View className="">
            {projects.map((project) => (
              <View
                key={project._id}
                className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
              >
                <Link href={`/joinedProjects/${project._id}`}>
                  <View className="relative h-48 w-full">
                    {/* Background Image */}
                    <View className="absolute inset-0 w-full">
                      <Image
                        source={themeImages[project.theme]}
                        className="h-full w-full object-cover"
                      />
                    </View>

                    <View className="absolute inset-0 w-full h-full bg-black/40"></View>

                    {/* Content Overlay */}
                    <View className="absolute inset-0 p-5 flex justify-between">
                      {/* Top Section - Project Name */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-white text-xl font-bold mb-1 mr-3" numberOfLines={1}>
                            {project.name}
                          </Text>
                          <View className="flex-row items-center">
                            <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                            <Text className="text-green-300 text-sm font-medium">Active Project</Text>
                          </View>
                        </View>

                        {/* Project Creator */}
                        <View className="items-center ml-3">
                          <View className="relative">
                            <Image
                              source={avatarImages[project.createdBy.avatar]}
                              className="h-10 w-10 rounded-full border-2 border-white"
                            />
                            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white items-center justify-center">
                              <Ionicons name="star" size={8} color="white" />
                            </View>
                          </View>
                          <Text className="text-white text-xs font-medium mt-1 text-center">
                            {project.createdBy.name}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Section - Stats */}
                      <View className="flex-row items-end justify-between">
                        <View className="flex-row space-x-6">
                          {/* Team Count */}
                          <View className="items-center">
                            <View className="bg-white/20 backdrop-blur-sm rounded-full p-2 mb-1">
                              <Ionicons name="people" size={16} color="white" />
                            </View>
                            <Text className="text-white text-sm font-bold">
                              {project.teamCount}
                            </Text>
                            <Text className="text-white/80 text-xs">
                              {project.teamCount === 1 ? "member" : "members"}
                            </Text>
                          </View>

                          {/* Task Count */}
                          <View className="items-center">
                            <View className="bg-white/20 backdrop-blur-sm rounded-full p-2 mb-1">
                              <Ionicons name="checkmark-circle" size={16} color="white" />
                            </View>
                            <Text className="text-white text-sm font-bold">
                              {project.taskCount}
                            </Text>
                            <Text className="text-white/80 text-xs">
                              {project.taskCount === 1 ? "task" : "tasks"}
                            </Text>
                          </View>
                        </View>

                        {/* Action Indicator */}
                        <View className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <Ionicons name="arrow-forward" size={16} color="white" />
                        </View>
                      </View>
                    </View>
                  </View>
                </Link>

                {/* Project Details Card */}
                <View className="p-4 bg-gray-50">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                        <Ionicons name="folder-open" size={14} color="#3b82f6" />
                      </View>
                      <View className="ml-3">
                        <Text className="text-gray-900 font-semibold text-sm">Project Details</Text>
                        <Text className="text-gray-500 text-xs">View tasks and progress</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center space-x-3">
                      <View className="bg-blue-50 px-2 py-1 rounded-full">
                        <Text className="text-blue-600 text-xs font-medium">In Progress</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* Empty State */}
            {projects.length === 0 && !error && (
              <View className="items-center justify-center py-16">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="folder-outline" size={32} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 text-lg font-medium mb-2">No Projects Yet</Text>
                <Text className="text-gray-400 text-sm text-center px-8">
                  You haven't joined any projects yet. When you do, they'll appear here.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default JoinedProjects;
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// //import TasksTimeline from '../TasksTimeline';
// import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
// import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';


// import AsyncStorage from '@react-native-async-storage/async-storage';
// import config from '@/config/config';
// import { Link } from 'expo-router';
// import themeImages from '@/constants/themes';
// import avatarImages from '@/constants/avatar';


// const colors = [
//   'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
// ];
// const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

// const JoinedProjects = () => {
//   const [projects, setProjects] = useState([]);
//   const [error, setError] = useState('');
//   const [selectedProjectId, setSelectedProjectId] = useState(null);

//   useEffect(() => {
//     const fetchJoinedProjects = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const updatedProjects = response.data.map((project) => ({
//           ...project,
//           color: getRandomColor(),
//         }));

//         setProjects(updatedProjects);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to fetch projects.');
//       }
//     };

//     fetchJoinedProjects();
//   }, []);

//   const handleProjectClick = (projectId) => {
//     setSelectedProjectId(projectId); // Update selected project ID
//   };

//   // Render conditional components
//   return (
//     <ScrollView className="flex-1 bg-white px-[8px]">
//       {/* Header */}
//       <View className="flex-row justify-between items-center">
//         <View className="flex-row items-center">
//           <FontAwesome5 name="users" size={24} color="gray" />
//           <Text className="text-2xl font-bold text-gray-500 ml-2">Joined Projects</Text>
//         </View>
//       </View>

//       <Text className="mt-1 text-sm font-medium text-gray-500 mb-4">
//         View all of the projects associated with your account
//       </Text>

//       <View className="h-0.5 bg-gray-300 mb-4" />

//       {/* Error Message */}
//       {error && !projects.length ? (
//         <View className="p-4 bg-red-100 border border-red-300 rounded-md">
//           <Text className="text-red-500">{error} No projects found.</Text>
//         </View>
//       ) : (
//         <View className="flex-wrap flex-row justify-between">
//           {projects.map((project) => (
//             <View
//               key={project._id}
//               className="w-full h-[120px] bg-white border-2 border-gray-200 rounded-xl shadow-sm mb-[3px] overflow-hidden"
//             >
//               <Link href={`/joinedProjects/${project._id}`}>
//                 <View className="relative mb-[45px] w-full h-[120px] overflow-hidden">
//                   <View className="absolute inset-0 w-full flex-row space-x-[8px] items-center pb-[8px]">
//                     <Image source={themeImages[project.theme]}
//                       className="h-[120px] w-full object-cover"
//                     />
//                   </View>

//                   {/* detauls of project */}
//                   <View className="absolute h-[140px] pt-[5px] flex inset-0 w-full px-[18px] bg-black/50 z-10">

//                     <View className="flex-row items-center inset-0 w-full">
//                       <Text className="text-[28px] mb-[15px] mt-[8px] font-[400] scale-y-[0.9] text-gray-200">
//                         {project.name}{project.name.length > 2 ? project.name.substring(0, 2) : project.name}
//                       </Text>
//                     </View>

//                     <View className='flex-row justify-between items-center w-full'>
//                       <View>
//                         <View className="flex-row items-center ml-[-3px]  mb-[3px]">
//                           <FontAwesome5 name="users" size={12} color="#dde2ed" />
//                           <Text className="ml-2 text-[12px] font-[700] text-gray-200">
//                             {project.teamCount}{" "}
//                             <Text className="text-[11px]">
//                               {project.teamCount === 1 ? "member" : "members"}
//                             </Text>
//                           </Text>
//                         </View>

//                         <View className="flex-row items-center">
//                           <FontAwesome5 name="tasks" size={12} color="#dde2ed" />
//                           <Text className="ml-2 text-[12px] font-[700] bg-[ #dde2ed] text-gray-200">
//                             {project.taskCount}{" "}
//                             <Text className="text-[11px]">
//                               {project.taskCount === 1 ? "task" : "tasks"}
//                             </Text>
//                           </Text>

//                           {/*<View className="flex-row items-center">
//                         <FontAwesome5 name="user-edit" size={12} color="#1e90ff" />
//                         <Text className="ml-2 text-[12px] font-semibold text-gray-500">
//                           {project.projectManager.status === "Pending" ? "Requested " : ""}
//                           Manager:
//                         </Text>
//                         {project.projectManager.status === "Pending" ? (
//                           <Text className="ml-2  py-[3px] px-3 bg-[#e0f7ff] rounded-lg text-[10px] font-bold text-[#007acc]">
//                             No manager assigned
//                           </Text>
//                         ) : (
//                           <Text className="ml-2 text-xs font-bold text-[#ffa500] underline">
//                             {project.projectManager.email}
//                           </Text>
//                         )}
//                       </View>*/}
//                         </View>
//                       </View>

//                       <View className="flex inset-0">
//                           <Image
//                             source={avatarImages[project.createdBy.avatar]}
//                             className="h-[24px] w-[24px] rounded-full border-4 border-white"
//                           />
//                         <Text className="text-[12px] mt-[3px] font-semibold text-gray-200">
//                           {project.createdBy.name}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>

//                 </View>
//               </Link>

//               {/*<View className="pl-[20px] mt-[15px]">
//                 <View className="flex-row items-center mb-1">
//                   <FontAwesome5 name="users" size={12} color="#1e90ff" />
//                   <Text className="ml-2 text-[12px] font-semibold text-gray-500">Team:</Text>
//                   <Text className="ml-2 text-[12px] font-[700] text-gray-200">
//                     {project.teamCount}{" "}
//                     <Text className="text-[11px]">
//                       {project.teamCount === 1 ? "member" : "members"}
//                     </Text>
//                   </Text>
//                 </View>

//                 <View className="flex-row items-center mb-1">
//                   <FontAwesome5 name="tasks" size={12} color="#1e90ff" />
//                   <Text className="ml-2 text-[12px] font-semibold text-gray-500">Tasks:</Text>
//                   <Text className="ml-2 text-[12px] font-[700] text-gray-200">
//                     {project.taskCount}{" "}
//                     <Text className="text-[11px]">
//                     {project.taskCount === 1 ? "task" : "tasks"}
//                     </Text>
//                   </Text>
//                 </View>

//                 <View className="flex-row items-center">
//                   <FontAwesome5 name="user-edit" size={12} color="#1e90ff" />
//                   <Text className="ml-2 text-[12px] font-semibold text-gray-500">
//                     {project.projectManager.status === "Pending" ? "Requested " : ""}
//                     Manager:
//                   </Text>
//                   {project.projectManager.status === "Pending" ? (
//                     <Text className="ml-2  py-[3px] px-3 bg-[#e0f7ff] rounded-lg text-[10px] font-bold text-[#007acc]">
//                       No manager assigned
//                     </Text>
//                   ) : (
//                     <Text className="ml-2 text-xs font-bold text-[#ffa500] underline">
//                       {project.projectManager.email}
//                     </Text>
//                   )}
//                 </View>
//               </View>*/}
//             </View>
//           ))}
//         </View>
//       )}

//       {/* Tasks Timeline */}
//       {/*selectedProjectId && (
//     <View>
//       <View className="h-1 bg-gray-300 rounded-xl my-9" />
//       <TasksTimeline projectId={selectedProjectId} />
//     </View>
//   )*/}
//     </ScrollView>

//   )
// };
// export default JoinedProjects
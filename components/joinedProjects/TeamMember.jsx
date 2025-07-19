import avatarImages from '@/constants/avatar';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

const TeamMembers = ({ teamDetails }) => {
  const [showAllMembers, setShowAllMembers] = useState(false);
  
  const displayedMembers = teamDetails.slice(0, 5);
  const remainingCount = teamDetails.length - 5;

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-5">
      
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
          <FontAwesome5 name="users" size={18} color="#3B82F6" />
        </View>
        <Text className="text-xl font-bold text-gray-800">Team Members</Text>
      </View>

      {teamDetails.length > 0 ? (
        <TouchableOpacity
          onPress={() => setShowAllMembers(true)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 active:bg-gray-50"
        >
          {/* Avatar Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              {displayedMembers.map((member, index) => (
                <View key={member._id} className={`${index > 0 ? '-ml-3' : ''}`}>
                  <Image
                    source={avatarImages[member.avatar]}
                    className="w-12 h-12 rounded-full border-3 border-white shadow-sm"
                  />
                </View>
              ))}
              
              {remainingCount > 0 && (
                <View className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center -ml-3 border-3 border-white shadow-sm">
                  <Text className="text-white font-bold text-sm">+{remainingCount}</Text>
                </View>
              )}
            </View>

            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </View>
          </View>

          {/* Team Info */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-semibold text-gray-800 mb-1">
                {teamDetails.length} {teamDetails.length === 1 ? 'Member' : 'Members'}
              </Text>
              <Text className="text-sm text-gray-500">
                Tap to view all team members
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <FontAwesome5 name="eye" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">View All</Text>
            </View>
          </View>
        </TouchableOpacity>
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

      {/* All Members Modal */}
      <Modal transparent={true} visible={showAllMembers} animationType="fade">
        
                <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" animated />
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl shadow-2xl max-h-[80%]">
            {/* Modal Header */}
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
              <TouchableOpacity
                onPress={() => setShowAllMembers(false)}
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Members List */}
            <ScrollView 
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {teamDetails.map((member, index) => (
                <View 
                  key={member._id} 
                  className={`flex-row items-center p-4 bg-gray-50 rounded-xl mb-3 ${
                    index === 0 ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <View className="relative">
                    <Image
                      source={avatarImages[member.avatar]}
                      className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
                    />
                    <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                  </View>
                  
                  <View className="flex-1 ml-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-1">
                      {member.name}
                    </Text>
                    <View className="flex-row items-center">
                      <FontAwesome name="envelope" size={12} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {member.email}
                      </Text>
                    </View>
                  </View>

                  {index === 0 && (
                    <View className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-semibold">Lead</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Modal Footer */}
            <View className="p-6 pt-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setShowAllMembers(false)}
                className="bg-gray-100 rounded-xl py-4 px-6 flex-row items-center justify-center"
              >
                <Ionicons name="checkmark-circle" size={18} color="#6B7280" />
                <Text className="text-gray-700 font-semibold ml-2">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeamMembers;
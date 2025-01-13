import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import avatarImages from '@/constants/avatar';

const TeamMembers = ({ teamDetails }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="users" size={20} color="#2563EB" style={styles.icon} />
        <Text style={styles.headerText}>Team Members</Text>
      </View>

      <ScrollView contentContainerStyle={styles.membersContainer}>
        {teamDetails.length > 0 ? (
          teamDetails.map((member) => (
            <View key={member._id} style={styles.memberCard}>
              <Image
                source={avatarImages[member.avatar]}
                style={styles.memberAvatar}
              />
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noMembersText}>No team members found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    marginRight: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
  membersContainer: {
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  noMembersText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 20,
  },
});

export default TeamMembers;

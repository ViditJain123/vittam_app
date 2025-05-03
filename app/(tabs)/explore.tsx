import { Alert, ScrollView, StyleSheet, View } from 'react-native';


import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import { Avatar, Button, Card, Divider, Text } from 'react-native-paper';
import Svg, { Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/Colors';

const ProfileScreen = () => {
  const { user, logout, deleteAccount } = useAuth();
  const router = useRouter();

  // Function to copy user ID to clipboard
  const copyUserId = async () => {
    if (user?.id && user.vvitId) {
      await Clipboard.setStringAsync(user.vvitId);
      Alert.alert('Copied!', 'VVID copied to clipboard');
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            logout();
            router.replace('/auth/login');
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteAccount();
            router.replace('/auth/login');
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Simple QR code visualization (in a real app, use a proper QR code library)
  const renderQRCode = () => {
    // This is a simplified visual representation of a QR code
    // In a real app, you would use a library like react-native-qrcode-svg
    return (
      <View style={styles.qrContainer}>
        <View style={styles.qrCode}>
          <Svg width="200" height="200" viewBox="0 0 200 200">
            {/* QR code frame */}
            <Rect x="0" y="0" width="200" height="200" fill="white" />
            <Rect x="15" y="15" width="30" height="30" fill="black" />
            <Rect x="155" y="15" width="30" height="30" fill="black" />
            <Rect x="15" y="155" width="30" height="30" fill="black" />
            
            {/* QR code data (simplified representation) */}
            {[...Array(10)].map((_, i) => (
              <React.Fragment key={i}>
                <Rect x={50 + i * 10} y="50" width="7" height="7" fill="black" />
                <Rect x="50" y={60 + i * 10} width="7" height="7" fill="black" />
                <Rect x={130 - i * 8} y="130" width="7" height="7" fill="black" />
              </React.Fragment>
            ))}
            
            {/* QR code inner patterns */}
            {[...Array(4)].map((_, i) => (
              [...Array(4)].map((_, j) => (
                <Rect 
                  key={`${i}-${j}`} 
                  x={60 + i * 20} 
                  y={60 + j * 20} 
                  width="10" 
                  height="10" 
                  fill={(i + j) % 2 === 0 ? 'black' : 'white'} 
                />
              ))
            ))}
          </Svg>
        </View>
        <Text style={styles.scanText}>Scan to pay</Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon 
          icon="account" 
          size={80} 
          style={styles.avatar}
          color={Colors.white}
        />
        <Text style={styles.userName}>
          {user ? `${user.phone}` : 'Guest User'}
        </Text>
        <Text style={styles.userEmail}>
          {user ? user.email : 'Not logged in'}
        </Text>
      </View>
      
      {renderQRCode()}
      
      <View style={styles.userIdContainer}>
        <Text style={styles.userIdLabel}>Your VVID</Text>
        <Card style={styles.userIdCard} onPress={copyUserId}>
          <Card.Content>
            <Text style={styles.userId}>{user?.vvitId || 'Not available'}</Text>
            <Text style={styles.copyHint}>Tap to copy</Text>
          </Card.Content>
        </Card>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
          contentStyle={styles.buttonContent}
          buttonColor={Colors.secondary}
        >
          Sign Out
        </Button>
        
        <Button
          mode="contained"
          icon="delete"
          onPress={handleDeleteAccount}
          style={[styles.button, styles.deleteButton]}
          contentStyle={styles.buttonContent}
          buttonColor={Colors.danger}
        >
          Delete Account
        </Button>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: Colors.background.light,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.light,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.darkGray,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 10,
    marginBottom: 10,
  },
  scanText: {
    fontSize: 16,
    color: Colors.darkGray,
  },
  userIdContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
  },
  userIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  userIdCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  userId: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: Colors.primary,
  },
  copyHint: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
  },
  divider: {
    width: '90%',
    marginVertical: 20,
    backgroundColor: Colors.lightGray,
  },
  actionButtons: {
    width: '90%',
    gap: 16,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  logoutButton: {
    marginBottom: 8,
  },
  deleteButton: {},
});

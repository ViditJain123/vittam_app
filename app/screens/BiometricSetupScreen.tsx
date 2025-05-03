import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, IconButton, ProgressBar, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { getRandomAuthPhrase } from '../utils/AuthPhrases';
import { Colors } from '../utils/Colors';

// Base URL for API requests
const API_URL = 'https://vittam.vercel.app/api';

const BiometricSetupScreen = () => {
  const [selfieMode, setSelfieMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [hasFaceData, setHasFaceData] = useState(false);
  const [hasVoiceData, setHasVoiceData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Use a random verification phrase from our collection
  const [verificationPhrase, setVerificationPhrase] = useState(getRandomAuthPhrase());
  const [faceData, setFaceData] = useState<string | null>(null);
  const [voiceData, setVoiceData] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { completeBiometricSetup, user } = useAuth();
  const router = useRouter();

  // Fake progress simulation for scanning processes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (selfieMode || voiceMode) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(current => {
          const newProgress = current + 0.1;
          if (newProgress >= 1) {
            clearInterval(interval);
            if (selfieMode) completeFaceSetup();
            if (voiceMode) completeVoiceSetup();
            return 1;
          }
          return newProgress;
        });
      }, 300);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selfieMode, voiceMode]);

  // Mock face verification - in a real app, you'd capture an actual image
  const completeFaceSetup = () => {
    setTimeout(() => {
      // Generate mock base64 encoded face data (this would be real image data in a production app)
      const mockFaceData = `face_data_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      setFaceData(mockFaceData);
      setHasFaceData(true);
      setSelfieMode(false);
      Alert.alert('Face Verification', 'Your face has been successfully registered.');
    }, 500);
  };

  // Mock voice verification - in a real app, you'd record actual audio
  const completeVoiceSetup = () => {
    setTimeout(() => {
      // Generate mock base64 encoded voice data (this would be real audio data in a production app)
      const mockVoiceData = `voice_data_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      setVoiceData(mockVoiceData);
      setHasVoiceData(true);
      setVoiceMode(false);
      Alert.alert('Voice Recognition', 'Your voice has been successfully registered.');
    }, 500);
  };

  // Complete setup and proceed
  const handleComplete = async () => {
    if (!hasFaceData && !hasVoiceData) {
      Alert.alert(
        'Verification Required', 
        'Please complete at least one verification method (face or voice).'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Skip the actual API call and fake success
      // Simulate a short delay before redirecting
      setTimeout(() => {
        // Navigate to home screen
        router.replace("/(tabs)");
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Biometric setup error:', err);
      Alert.alert('Error', 'Failed to complete biometric setup');
      setIsLoading(false);
    }
  };

  // Render the selfie capture UI
  const renderSelfieCapture = () => {
    return (
      <View style={styles.scanContainer}>
        <View style={styles.scanPlaceholder}>
          <IconButton
            icon="face-recognition"
            size={80}
            iconColor={Colors.primary}
          />
          <Text style={styles.scanningText}>
            Scanning your face...
          </Text>
          <ProgressBar 
            progress={progress} 
            color={Colors.primary} 
            style={styles.progressBar} 
          />
        </View>
      </View>
    );
  };

  // Render the voice recording UI
  const renderVoiceRecording = () => {
    return (
      <View style={styles.scanContainer}>
        <View style={styles.scanPlaceholder}>
          <IconButton
            icon="microphone"
            size={80}
            iconColor={Colors.secondary}
          />
          <Text style={styles.scanningText}>
            Please say: &quot;{verificationPhrase}&quot;
          </Text>
          <ProgressBar 
            progress={progress} 
            color={Colors.secondary} 
            style={styles.progressBar} 
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biometric Setup</Text>
        <Text style={styles.subtitle}>
          Please complete at least one of the following verification methods
        </Text>
      </View>
      
      {selfieMode ? (
        renderSelfieCapture()
      ) : voiceMode ? (
        renderVoiceRecording()
      ) : (
        <View style={styles.optionsContainer}>
          <Card style={styles.card}>
            <Card.Title 
              title="Face Verification" 
              left={(props) => (
                <Avatar.Icon 
                  {...props} 
                  icon="account-outline" 
                  color="white"
                  style={{ backgroundColor: Colors.primary }}
                />
              )}
              titleStyle={styles.cardTitle}
            />
            <Card.Content>
              <Text variant="bodyMedium">
                Register your face for secure authentication.
              </Text>
            </Card.Content>
            <Card.Actions>
              {hasFaceData ? (
                <Button 
                  mode="contained" 
                  disabled 
                  style={[styles.actionButton, { backgroundColor: Colors.success }]}
                >
                  Completed
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={() => setSelfieMode(true)}
                  style={styles.actionButton}
                  buttonColor={Colors.primary}
                >
                  Start Setup
                </Button>
              )}
            </Card.Actions>
          </Card>
          
          <Card style={styles.card}>
            <Card.Title 
              title="Voice Recognition" 
              left={(props) => (
                <Avatar.Icon 
                  {...props} 
                  icon="microphone" 
                  color="white"
                  style={{ backgroundColor: Colors.secondary }}
                />
              )}
              titleStyle={styles.cardTitle}
            />
            <Card.Content>
              <Text variant="bodyMedium">
                Record your voice saying the verification phrase.
              </Text>
            </Card.Content>
            <Card.Actions>
              {hasVoiceData ? (
                <Button 
                  mode="contained" 
                  disabled 
                  style={[styles.actionButton, { backgroundColor: Colors.success }]}
                >
                  Completed
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={() => setVoiceMode(true)}
                  style={styles.actionButton}
                  buttonColor={Colors.secondary}
                >
                  Start Recording
                </Button>
              )}
            </Card.Actions>
          </Card>
        </View>
      )}
      
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleComplete}
          loading={isLoading}
          disabled={isLoading || (!hasFaceData && !hasVoiceData)}
          style={styles.completeButton}
          contentStyle={styles.buttonContent}
          buttonColor={Colors.primary}
        >
          Complete Setup
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: Colors.background.light,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 30,
  },
  card: {
    backgroundColor: Colors.white,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 10,
    width: '100%',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 20,
  },
  completeButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  scanContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  scanPlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
    padding: 20,
  },
  scanningText: {
    marginTop: 16,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '80%',
    height: 8,
    borderRadius: 4,
  }
});

export default BiometricSetupScreen;
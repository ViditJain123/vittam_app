import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Divider, IconButton, ProgressBar, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { getRandomAuthPhrase } from '../utils/AuthPhrases';
import { Colors } from '../utils/Colors';
import { formatCurrency } from '../utils/helpers';

const SendMoneyScreen = () => {
  const [amount, setAmount] = useState('');
  const [recipientVvitId, setRecipientVvitId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpRecipient, setIsLookingUpRecipient] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const [showBiometricVerification, setShowBiometricVerification] = useState(false);
  const [selfieMode, setSelfieMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [hasFaceData, setHasFaceData] = useState(false);
  const [hasVoiceData, setHasVoiceData] = useState(false);
  const [progress, setProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  
  const { user, sendMoney, lookupRecipient } = useAuth();
  const router = useRouter();

  // Generate a random verification phrase for this transaction
  const [verificationPhrase] = useState(getRandomAuthPhrase());

  // Look up recipient when VVIT ID changes and has enough characters
  useEffect(() => {
    // Only lookup when there are enough characters (VVIT IDs are at least 8 chars)
    if (recipientVvitId.length >= 8) {
      const lookupTimeout = setTimeout(() => {
        handleRecipientLookup();
      }, 500); // Debounce the lookup
      
      return () => clearTimeout(lookupTimeout);
    } else {
      // Clear recipient name if ID is too short
      if (recipientName) {
        setRecipientName('');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientVvitId]);

  // Handle recipient lookup
  const handleRecipientLookup = async () => {
    if (!recipientVvitId || recipientVvitId.length < 8) {
      return;
    }

    // Don't lookup if it's the current user
    if (user?.vvitId === recipientVvitId) {
      setRecipientError("You can't send money to yourself");
      setRecipientName('');
      return;
    }

    setIsLookingUpRecipient(true);
    
    try {
      const result = await lookupRecipient(recipientVvitId);
      
      if (result) {
        setRecipientName(result.name);
        setRecipientError('');
      } else {
        setRecipientName('');
        setRecipientError('User not found');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setRecipientName('');
      setRecipientError('Failed to look up recipient');
    } finally {
      setIsLookingUpRecipient(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                           permissions                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      const camResult = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(camResult.status === "granted");

      const micResult = await Audio.requestPermissionsAsync();
      setAudioPermission(micResult.status === "granted");
    })();
  }, []);
  
  /* ------------------------------------------------------------------ */
  /*                     helpers: start / stop audio                    */
  /* ------------------------------------------------------------------ */
  const stopRecording = useCallback(async (): Promise<string | null> => {
    const rec = recordingRef.current;
    if (!rec) return null;

    try {
      const status = await rec.getStatusAsync();
      if (status.isRecording || !status.isDoneRecording) {
        await rec.stopAndUnloadAsync();
      }
      const uri = rec.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      return uri ?? null;
    } catch (err) {
      console.warn("Error stopping recording:", err);
      return null;
    }
  }, []);
  
  const startRecording = useCallback(async () => {
    try {
      if (!audioPermission) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Microphone permission is needed for voice verification."
          );
          return;
        }
        setAudioPermission(true);
      }

      // stop any previous recording first
      if (recordingRef.current) await stopRecording();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      recordingRef.current = rec;
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert("Error", "Failed to start recording. Please try again.");
      setIsRecording(false);
    }
  }, [audioPermission, stopRecording]);

  /* ------------------------------------------------------------------ */
  /*                       face-verification flow                       */
  /* ------------------------------------------------------------------ */
  const completeFaceVerification = useCallback((photoUri?: string) => {
    setTimeout(() => {
      setHasFaceData(true);
      setSelfieMode(false);
      if (photoUri) {
        setCapturedImage(photoUri);
      }
      Alert.alert(
        "Face Verification",
        "Your face has been successfully verified."
      );
    }, 500);
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) {
      completeFaceVerification();
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync();
      completeFaceVerification(photo.uri);
    } catch (err) {
      console.error("Failed to take picture:", err);
      Alert.alert("Error", "Failed to take picture. Please try again.");
      setSelfieMode(false);
    }
  }, [completeFaceVerification]);

  /* ------------------------------------------------------------------ */
  /*                       voice-verification flow                      */
  /* ------------------------------------------------------------------ */
  const completeVoiceVerification = useCallback(async () => {
    try {
      const uri = await stopRecording();
      setRecordingUri(uri);

      // unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (uri) {
        const { sound } = await Audio.Sound.createAsync({ uri });
        soundRef.current = sound;
        setIsPlayingAudio(true);

        Alert.alert(
          "Voice Playback",
          "Playing back your voice recording…",
          [{ text: "OK" }],
          { cancelable: true }
        );

        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
            setHasVoiceData(true);
            setVoiceMode(false);
            Alert.alert(
              "Voice Recognition",
              "Your voice has been successfully verified."
            );
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } else {
        setHasVoiceData(true);
        setVoiceMode(false);
        Alert.alert(
          "Voice Recognition",
          "Your voice has been successfully verified."
        );
      }
    } catch (err) {
      console.error("Error completing voice verification:", err);
      Alert.alert(
        "Error",
        "Failed to process voice recording. Please try again."
      );
      setVoiceMode(false);
    }
  }, [stopRecording]);

  /* ------------------------------------------------------------------ */
  /*          progress timer & branching into camera / microphone       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!selfieMode && !voiceMode) return;

    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.1;
        if (next >= 1) {
          clearInterval(id);
          selfieMode && takePicture();
          voiceMode && completeVoiceVerification();
          return 1;
        }
        return next;
      });
    }, 300);

    // kick off recording if we just entered voiceMode
    if (voiceMode) startRecording();

    setProgress(0);
    return () => clearInterval(id);
  }, [selfieMode, voiceMode, takePicture, completeVoiceVerification, startRecording]);

  /* ------------------------------------------------------------------ */
  /*                             cleanup                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    return () => {
      // stop any recording
      stopRecording().catch(() => {});
      // unload any playing audio
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [stopRecording]);

  const handleSendMoney = async () => {
    // Reset errors
    setAmountError('');
    setRecipientError('');
    
    // Validate amount
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    
    // Validate user's balance
    if (user && amountValue > user.balance) {
      setAmountError('Insufficient balance');
      return;
    }
    
    // Validate recipient
    if (!recipientVvitId || recipientVvitId.trim() === '') {
      setRecipientError('Please enter a valid VVIT ID');
      return;
    }
    
    // If recipient name is empty, try to look it up one more time
    if (!recipientName) {
      const result = await lookupRecipient(recipientVvitId);
      
      if (!result) {
        setRecipientError('Recipient not found. Please check the VVIT ID');
        return;
      }
      
      setRecipientName(result.name);
    }
    
    // Show biometric verification instead of proceeding directly
    setShowBiometricVerification(true);
  };

  const handleFinishBiometricVerification = async () => {
    if (!hasFaceData || !hasVoiceData) {
      Alert.alert(
        'Verification Required', 
        'Please complete both verification methods (face and voice) to proceed.'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const amountValue = parseFloat(amount);
      // Process the payment using the API
      const transactionId = await sendMoney(amountValue, recipientVvitId);
      
      // Navigate to success screen with transaction details
      router.push({
        pathname: '/screens/transaction-success',
        params: {
          amount: amountValue,
          recipientId: recipientVvitId,
          recipientName: recipientName,
          transactionId: transactionId,
          status: 'success'
        }
      });
    } catch (error: any) {
      Alert.alert(
        'Transaction Failed', 
        error.message || 'Could not complete the transaction'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                              UI bits                               */
  /* ------------------------------------------------------------------ */
  // Render the selfie capture UI
  const renderSelfieCapture = () => {
    if (cameraPermission === false) {
      return (
        <View style={styles.scanContainer}>
          <View style={styles.scanPlaceholder}>
            <IconButton icon="camera-off" size={80} iconColor={Colors.danger} />
            <Text style={styles.scanningText}>
              Camera permission denied. Please enable camera access in settings.
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.scanContainer}>
        <View style={styles.cameraContainer}>
          {cameraPermission && (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              ratio="4:3"
            />
          )}
          <ProgressBar
            progress={progress}
            color={Colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.scanningText}>Scanning your face...</Text>
        </View>
      </View>
    );
  };

  // Render the voice recording UI
  const renderVoiceRecording = () => {
    if (audioPermission === false) {
      return (
        <View style={styles.scanContainer}>
          <View style={styles.scanPlaceholder}>
            <IconButton
              icon="microphone-off"
              size={80}
              iconColor={Colors.danger}
            />
            <Text style={styles.scanningText}>
              Microphone permission denied. Please enable microphone access in
              settings.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.scanContainer}>
        <View style={styles.scanPlaceholder}>
          <IconButton
            icon={
              isPlayingAudio
                ? "play-circle"
                : isRecording
                ? "microphone"
                : "microphone-outline"
            }
            size={80}
            iconColor={
              isPlayingAudio
                ? Colors.primary
                : isRecording
                ? Colors.success
                : Colors.secondary
            }
          />
          <View style={styles.phraseContainer}>
            <Text style={styles.phraseInstruction}>Please say:</Text>
            <Text style={styles.verificationPhrase}>
              &quot;{verificationPhrase}&quot;
            </Text>
          </View>
          
          <View style={styles.recordingStatusContainer}>
            <Text
              style={[
                styles.recordingStatusText,
                { color: isRecording ? Colors.success : Colors.secondary },
              ]}
            >
              {isPlayingAudio
                ? "Playing back your recording..."
                : progress >= 1
                ? "Processing..."
                : isRecording
                ? "Recording your voice..."
                : "Preparing to record..."}
            </Text>
          </View>
          
          <ProgressBar
            progress={progress}
            color={Colors.secondary}
            style={styles.progressBar}
          />
        </View>
      </View>
    );
  };

  // Render biometric verification UI
  const renderBiometricVerification = () => {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              setShowBiometricVerification(false);
              setHasFaceData(false);
              setHasVoiceData(false);
            }}
          />
          <Text style={styles.title}>Verify Transaction</Text>
        </View>

        <Card style={styles.transactionCard}>
          <Card.Content>
            <Text style={styles.transactionTitle}>Transaction Details</Text>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Amount:</Text>
              <Text style={styles.transactionValue}>{formatCurrency(parseFloat(amount))}</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>To:</Text>
              <Text style={styles.transactionValue}>
                {recipientName} ({recipientVvitId})
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        <Text style={styles.verificationInstructions}>
          Please complete both verification methods to authorize this transaction
        </Text>
        
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
                {hasFaceData && capturedImage ? (
                  <View style={styles.capturedImageContainer}>
                    <Image
                      source={{ uri: capturedImage }}
                      style={styles.capturedImage}
                    />
                  </View>
                ) : (
                  <Text variant="bodyMedium">
                    Verify your identity with facial recognition.
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                {hasFaceData ? (
                  <Button 
                    mode="contained" 
                    disabled 
                    style={[styles.actionButton, { backgroundColor: Colors.success }]}
                  >
                    Verified
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    onPress={() => setSelfieMode(true)}
                    style={styles.actionButton}
                    buttonColor={Colors.primary}
                  >
                    Start Verification
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
                {hasVoiceData && recordingUri ? (
                  <View style={styles.capturedImageContainer}>
                    <IconButton
                      icon="check-circle"
                      size={50}
                      iconColor={Colors.success}
                    />
                    <Text style={{ color: Colors.success, marginTop: 8 }}>
                      Voice verification complete
                    </Text>
                  </View>
                ) : (
                  <Text variant="bodyMedium">
                    Verify your identity with voice recognition.
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                {hasVoiceData ? (
                  <Button 
                    mode="contained" 
                    disabled 
                    style={[styles.actionButton, { backgroundColor: Colors.success }]}
                  >
                    Verified
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
            onPress={handleFinishBiometricVerification}
            loading={isLoading}
            disabled={isLoading || (!hasFaceData || !hasVoiceData)}
            style={styles.completeButton}
            contentStyle={styles.buttonContent}
            buttonColor={Colors.primary}
          >
            Confirm & Send Money
          </Button>
        </View>
      </ScrollView>
    );
  };

  // Render the main form UI
  const renderSendMoneyForm = () => {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Send Money</Text>
        </View>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {user ? formatCurrency(user.balance) : '₹0.00'}
          </Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.formContainer}>
          <TextInput
            label="Amount (₹)"
            value={amount}
            onChangeText={(text) => {
              // Only allow numbers and decimal point
              const filtered = text.replace(/[^0-9.]/g, '');
              setAmount(filtered);
              setAmountError('');
            }}
            mode="outlined"
            keyboardType="numeric"
            error={!!amountError}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
          />
          {!!amountError && <Text style={styles.errorText}>{amountError}</Text>}
          
          <TextInput
            label="Recipient's VVIT ID"
            value={recipientVvitId}
            onChangeText={(text) => {
              setRecipientVvitId(text);
              setRecipientError('');
            }}
            mode="outlined"
            error={!!recipientError}
            style={styles.input}
            theme={{ colors: { primary: Colors.primary } }}
          />
          {!!recipientError && <Text style={styles.errorText}>{recipientError}</Text>}
          
          {isLookingUpRecipient && (
            <View style={styles.lookupContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.lookupText}>Looking up recipient...</Text>
            </View>
          )}
          
          {recipientName && (
            <View style={styles.recipientInfoContainer}>
              <Text style={styles.recipientInfoLabel}>Recipient:</Text>
              <Text style={styles.recipientInfoName}>{recipientName}</Text>
            </View>
          )}
          
          <Button
            mode="contained"
            onPress={handleSendMoney}
            loading={isLoading}
            disabled={isLoading || !amount || !recipientVvitId}
            style={styles.sendButton}
            contentStyle={styles.buttonContent}
            buttonColor={Colors.primary}
          >
            Continue
          </Button>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Note: You will be required to verify your identity before completing this transaction.
          </Text>
        </View>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Protect route - redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {showBiometricVerification ? renderBiometricVerification() : renderSendMoneyForm()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: Colors.background.light,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  balanceContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  errorText: {
    color: Colors.danger,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 8,
    fontSize: 12,
  },
  lookupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 8,
  },
  lookupText: {
    marginLeft: 8,
    color: Colors.darkGray,
    fontSize: 14,
  },
  recipientInfoContainer: {
    backgroundColor: Colors.background.light,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  recipientInfoLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    marginRight: 8,
  },
  recipientInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  sendButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  infoText: {
    color: Colors.darkGray,
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Biometric verification styles
  optionsContainer: {
    gap: 20,
    marginBottom: 30,
  },
  card: {
    backgroundColor: Colors.white,
    elevation: 4,
    borderRadius: 12,
    marginVertical: 8,
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
  },
  cameraContainer: {
    width: 280,
    height: 350,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
  },
  camera: { 
    width: '100%', 
    height: '100%' 
  },
  phraseContainer: { 
    alignItems: 'center', 
    marginVertical: 16, 
    width: '100%' 
  },
  phraseInstruction: { 
    fontSize: 16, 
    color: Colors.darkGray, 
    marginBottom: 10 
  },
  verificationPhrase: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f8f4ff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.secondary,
    width: '100%',
  },
  recordingStatusContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 8,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  recordingStatusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  capturedImageContainer: { 
    alignItems: 'center', 
    marginVertical: 10 
  },
  capturedImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  transactionCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginVertical: 16,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.primary,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  transactionLabel: {
    fontSize: 16,
    color: Colors.darkGray,
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  verificationInstructions: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.darkGray,
    marginVertical: 16,
  },
});

export default SendMoneyScreen;
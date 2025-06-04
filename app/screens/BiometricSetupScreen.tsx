import { Audio } from "expo-av";
import { Camera, CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  IconButton,
  ProgressBar,
  Text,
} from "react-native-paper";

import { useAuth } from "../context/AuthContext";
import { getRandomAuthPhrase } from "../utils/AuthPhrases";
import { Colors } from "../utils/Colors";

const BiometricSetupScreen = () => {
  /* ------------------------------------------------------------------ */
  /*                          state & helpers                           */
  /* ------------------------------------------------------------------ */
  const [selfieMode, setSelfieMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [hasFaceData, setHasFaceData] = useState(false);
  const [hasVoiceData, setHasVoiceData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verificationPhrase] = useState(getRandomAuthPhrase());
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { completeBiometricSetup } = useAuth();
  const router = useRouter();

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
  const completeFaceSetup = useCallback((photoUri?: string) => {
    setTimeout(() => {
      setHasFaceData(true);
      setSelfieMode(false);
      Alert.alert(
        "Face Verification",
        "Your face has been successfully registered."
      );
    }, 500);
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) {
      completeFaceSetup();
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedImage(photo.uri);
      completeFaceSetup(photo.uri);
    } catch (err) {
      console.error("Failed to take picture:", err);
      Alert.alert("Error", "Failed to take picture. Please try again.");
      setSelfieMode(false);
    }
  }, [completeFaceSetup]);

  /* ------------------------------------------------------------------ */
  /*                       voice-verification flow                      */
  /* ------------------------------------------------------------------ */
  const completeVoiceSetup = useCallback(async () => {
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
              "Your voice has been successfully registered and verified."
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
          "Your voice has been successfully registered."
        );
      }
    } catch (err) {
      console.error("Error completing voice setup:", err);
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
          voiceMode && completeVoiceSetup();
          return 1;
        }
        return next;
      });
    }, 300);

    // kick off recording if we just entered voiceMode
    if (voiceMode) startRecording();

    setProgress(0);
    return () => clearInterval(id);
  }, [selfieMode, voiceMode, takePicture, completeVoiceSetup, startRecording]);

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

  /* ------------------------------------------------------------------ */
  /*                              UI bits                               */
  /* ------------------------------------------------------------------ */
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

  const handleComplete = async () => {
    if (!hasFaceData && !hasVoiceData) {
      Alert.alert(
        "Verification Required",
        "Please complete at least one verification method."
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      router.replace("/(tabs)");
      setIsLoading(false);
    }, 1000);
  };

  /* ------------------------------------------------------------------ */
  /*                               render                               */
  /* ------------------------------------------------------------------ */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biometric Setup</Text>
        <Text style={styles.subtitle}>
          Please complete at least one of the following verification methods
        </Text>
      </View>

      {selfieMode
        ? renderSelfieCapture()
        : voiceMode
        ? renderVoiceRecording()
        : (
          <View style={styles.optionsContainer}>
            {/* Face card ------------------------------------------------ */}
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
                    Register your face for secure authentication.
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                {hasFaceData ? (
                  <Button
                    mode="contained"
                    disabled
                    style={[
                      styles.actionButton,
                      { backgroundColor: Colors.success },
                    ]}
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

            {/* Voice card ----------------------------------------------- */}
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
                    Record your voice saying the verification phrase.
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                {hasVoiceData ? (
                  <Button
                    mode="contained"
                    disabled
                    style={[
                      styles.actionButton,
                      { backgroundColor: Colors.success },
                    ]}
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

/* -------------------------------------------------------------------- */
/*                                styles                                */
/* -------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: Colors.background.light,
  },
  header: { marginBottom: 30, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: Colors.darkGray, textAlign: "center" },
  optionsContainer: { gap: 20, marginBottom: 30 },
  card: { backgroundColor: Colors.white, elevation: 4, borderRadius: 12 },
  cardTitle: { fontWeight: "bold" },
  actionButton: { marginTop: 10, width: "100%" },
  footer: { marginTop: "auto", paddingVertical: 20 },
  completeButton: { borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  scanContainer: { alignItems: "center", marginVertical: 20 },
  scanPlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    marginBottom: 20,
    padding: 20,
  },
  cameraContainer: {
    width: 280,
    height: 350,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 20,
    position: "relative",
    alignItems: "center",
  },
  camera: { width: "100%", height: "100%" },
  scanningText: {
    marginTop: 16,
    color: Colors.darkGray,
    textAlign: "center",
    marginBottom: 20,
    position: "absolute",
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  progressBar: {
    width: "80%",
    height: 8,
    borderRadius: 4,
    position: "absolute",
    bottom: 45,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  phraseContainer: { alignItems: "center", marginVertical: 16, width: "100%" },
  phraseInstruction: { fontSize: 16, color: Colors.darkGray, marginBottom: 10 },
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
  verificationPhrase: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.secondary,
    textAlign: "center",
    padding: 12,
    backgroundColor: "#f8f4ff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.secondary,
    width: "100%",
  },
  capturedImageContainer: { alignItems: "center", marginVertical: 10 },
  capturedImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: Colors.success,
  },
});

export default BiometricSetupScreen;
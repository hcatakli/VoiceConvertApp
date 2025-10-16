import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { Stack } from "expo-router";
import { Mic, Square } from "lucide-react-native";
import { Audio } from "expo-av";
import { useMutation } from "@tanstack/react-query";
import VoiceSelector from "../../components/VoiceSelector";
import AudioPlayer from "../../components/AudioPlayer";
import { useVoice } from "../../contexts/VoiceContext";
import { API_BASE_URL } from "../../constants/api";
import Colors from "../../constants/color";

export default function VoiceCloneScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sourceAudioUri, setSourceAudioUri] = useState<string | null>(null);
  const [convertedAudioUri, setConvertedAudioUri] = useState<string | null>(
    null
  );
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { selectedVoiceId } = useVoice();

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const voiceCloneMutation = useMutation({
    mutationFn: async (audioUri: string) => {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append("file", blob, "recording.webm");
      } else {
        const uriParts = audioUri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        const audioFile = {
          uri: audioUri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any;

        formData.append("file", audioFile);
      }

      formData.append("voice_id", selectedVoiceId);

      const response = await fetch(`${API_BASE_URL}/speech-to-speech`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to convert voice");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return url;
    },
    onSuccess: (url) => {
      setConvertedAudioUri(url);
    },
    onError: (error) => {
      console.error("Voice clone error:", error);
      Alert.alert("Error", "Failed to convert voice. Please try again.");
    },
  });

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Please grant microphone access");
        return;
      }

      if (Platform.OS !== "web") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Platform.OS === "web"
          ? Audio.RecordingOptionsPresets.HIGH_QUALITY
          : {
              android: {
                extension: ".m4a",
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
              },
              ios: {
                extension: ".wav",
                outputFormat: Audio.IOSOutputFormat.LINEARPCM,
                audioQuality: Audio.IOSAudioQuality.HIGH,
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
              },
              web: {
                mimeType: "audio/webm",
                bitsPerSecond: 128000,
              },
            }
      );

      setRecording(newRecording);
      setIsRecording(true);
      setConvertedAudioUri(null);

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(Math.floor((status.durationMillis ?? 0) / 1000));
        }
      });
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      if (Platform.OS !== "web") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      const uri = recording.getURI();
      setRecording(null);
      setRecordingDuration(0);

      if (uri) {
        setSourceAudioUri(uri);
        voiceCloneMutation.mutate(uri);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.colors.background,
          },
          headerTintColor: Colors.colors.text,
          headerTitle: "Voice Clone",
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Clone Your Voice</Text>
          <Text style={styles.subtitle}>
            Record your voice and convert it to another voice
          </Text>

          <VoiceSelector />

          <View style={styles.recordingContainer}>
            <Animated.View
              style={[
                styles.recordingRipple,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isRecording ? 0.3 : 0,
                },
              ]}
            />

            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={voiceCloneMutation.isPending}
              testID="record-button"
            >
              {isRecording ? (
                <Square color={Colors.colors.text} size={32} fill={Colors.colors.text} />
              ) : (
                <Mic color={Colors.colors.text} size={32} />
              )}
            </TouchableOpacity>

            {isRecording && (
              <View style={styles.recordingInfo}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Recording: {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}
          </View>

          {voiceCloneMutation.isPending && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.colors.primary} />
              <Text style={styles.loadingText}>Converting voice...</Text>
            </View>
          )}

          {sourceAudioUri && (
            <View style={styles.audioSection}>
              <Text style={styles.audioLabel}>Original Audio</Text>
              <AudioPlayer
                audioUri={sourceAudioUri}
                onError={(error) => Alert.alert("Error", error)}
              />
            </View>
          )}

          {convertedAudioUri && (
            <View style={styles.audioSection}>
              <Text style={styles.audioLabel}>Converted Voice</Text>
              <AudioPlayer
                audioUri={convertedAudioUri}
                onError={(error) => Alert.alert("Error", error)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    marginBottom: 24,
  },
  recordingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
    position: "relative",
  },
  recordingRipple: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.colors.secondary,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonActive: {
    backgroundColor: Colors.colors.error,
  },
  recordingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.colors.error,
  },
  recordingText: {
    fontSize: 16,
    color: Colors.colors.text,
    fontWeight: "600" as const,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
  },
  audioSection: {
    marginTop: 24,
  },
  audioLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.colors.text,
    marginBottom: 8,
  },
});

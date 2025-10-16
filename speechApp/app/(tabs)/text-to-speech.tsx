import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Stack } from "expo-router";
import { Send } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import VoiceSelector from "../../components/VoiceSelector";
import AudioPlayer from "../../components/AudioPlayer";
import { useVoice } from "@/contexts/VoiceContext";
import { API_BASE_URL } from "../../constants/api";
import Colors from "../../constants/color";

export default function TextToSpeechScreen() {
  const [text, setText] = useState("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const { selectedVoiceId } = useVoice();

  const textToSpeechMutation = useMutation({
    mutationFn: async (inputText: string) => {
      const formData = new FormData();
      formData.append("text", inputText);
      formData.append("voice_id", selectedVoiceId);

      const response = await fetch(
    `${API_BASE_URL}/text-to-speech?text=${encodeURIComponent(text)}&voice_id=${selectedVoiceId}`,
    { method: 'POST' }
    );

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return url;
    },
    onSuccess: (url) => {
      setAudioUri(url);
    },
    onError: (error) => {
      console.error("Text to speech error:", error);
      Alert.alert("Error", "Failed to generate speech. Please try again.");
    },
  });

  const handleGenerate = () => {
    if (!text.trim()) {
      Alert.alert("Error", "Please enter some text to convert");
      return;
    }
    textToSpeechMutation.mutate(text);
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
          headerTitle: "Text to Speech",
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Convert Text to Speech</Text>
            <Text style={styles.subtitle}>
              Enter your text and select a voice to generate speech
            </Text>

            <VoiceSelector />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter text here..."
                placeholderTextColor={Colors.colors.textSecondary}
                multiline
                numberOfLines={6}
                value={text}
                onChangeText={setText}
                testID="text-input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.generateButton,
                (!text.trim() || textToSpeechMutation.isPending) &&
                  styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={!text.trim() || textToSpeechMutation.isPending}
              testID="generate-button"
            >
              {textToSpeechMutation.isPending ? (
                <ActivityIndicator color={Colors.colors.text} />
              ) : (
                <>
                  <Send color={Colors.colors.text} size={20} />
                  <Text style={styles.generateButtonText}>Generate Speech</Text>
                </>
              )}
            </TouchableOpacity>

            {audioUri && (
              <AudioPlayer
                audioUri={audioUri}
                onError={(error) => Alert.alert("Error", error)}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
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
  inputContainer: {
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 16,
    color: Colors.colors.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.colors.surfaceLight,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.colors.text,
  },
});

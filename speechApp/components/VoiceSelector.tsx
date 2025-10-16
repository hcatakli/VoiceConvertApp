import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useVoice } from "@/contexts/VoiceContext";
import Colors from "@/constants/color";

export default function VoiceSelector() {
  const [modalVisible, setModalVisible] = useState(false);
  const {
    voices,
    selectedVoice,
    selectedVoiceId,
    setSelectedVoiceId,
    isLoadingVoices,
  } = useVoice();

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        testID="voice-selector-button"
      >
        <View style={styles.selectorContent}>
          <Text style={styles.label}>Voice</Text>
          <Text style={styles.selectedVoice}>
            {selectedVoice?.name ?? "Select Voice"}
          </Text>
        </View>
        <ChevronDown color={Colors.colors.textSecondary} size={20} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Voice</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>

            {isLoadingVoices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.voiceList}>
                {voices.map((voice) => (
                  <TouchableOpacity
                    key={voice.voice_id}
                    style={styles.voiceItem}
                    onPress={() => {
                      setSelectedVoiceId(voice.voice_id);
                      setModalVisible(false);
                    }}
                    testID={`voice-option-${voice.voice_id}`}
                  >
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    {voice.voice_id === selectedVoiceId && (
                      <Check color={Colors.colors.primary} size={20} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  selectedVoice: {
    fontSize: 16,
    color: Colors.colors.text,
    fontWeight: "600" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.surfaceLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: Colors.colors.primary,
    fontWeight: "600" as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  voiceList: {
    padding: 8,
  },
  voiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  voiceName: {
    fontSize: 16,
    color: Colors.colors.text,
  },
});

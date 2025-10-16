import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import { Play, Pause, Volume2 } from "lucide-react-native";
import Colors from "@/constants/color";

interface AudioPlayerProps {
  audioUri: string | null;
  onError?: (error: string) => void;
}

export default function AudioPlayer({ audioUri, onError }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const waveAnimations = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
        const loadNewAudio = async () => {
            if (!audioUri) return;

            // Önceki sesi temizle
            if (sound) {
            await sound.unloadAsync();
            setSound(null);
            }

            try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
            setIsPlaying(false);
            setPosition(0);
            setDuration(0);
            } catch (error) {
            console.error("Error loading new audio:", error);
            onError?.("Failed to load audio");
            }
        };

        loadNewAudio();
        }, [audioUri]);

  useEffect(() => {
    const startWaveAnimation = () => {
      const animations = waveAnimations.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + index * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300 + index * 50,
              useNativeDriver: true,
            }),
          ])
        )
      );

      Animated.stagger(50, animations).start();
    };

    


    const stopWaveAnimation = () => {
      waveAnimations.forEach((anim) => {
        anim.setValue(0.3);
      });
    };

    if (isPlaying) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }
  }, [isPlaying, waveAnimations]);

  const loadAudio = async () => {
    try {
      if (!audioUri) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      return newSound;
    } catch (error) {
      console.error("Error loading audio:", error);
      onError?.("Failed to load audio");
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis ?? 0);
      setPosition(status.positionMillis ?? 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!sound) {
        const newSound = await loadAudio();
        if (newSound) {
          await newSound.playAsync();
        }
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing/pausing audio:", error);
      onError?.("Failed to play audio");
    }
  };

  const formatTime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioUri) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.waveformContainer}>
        {waveAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              {
                transform: [{ scaleY: anim }],
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          testID="audio-play-button"
        >
          {isPlaying ? (
            <Pause color={Colors.colors.text} size={28} fill={Colors.colors.text} />
          ) : (
            <Play color={Colors.colors.text} size={28} fill={Colors.colors.text} />
          )}
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <View style={styles.timeInfo}>
            <Volume2 color={Colors.colors.textSecondary} size={16} />
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: duration > 0 ? `${(position / duration) * 100}%` : "0%",
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  waveformContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    marginBottom: 20,
  },
  waveBar: {
    width: 3,
    height: 60,
    backgroundColor: Colors.colors.primary,
    borderRadius: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  timeContainer: {
    flex: 1,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.colors.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.colors.primary,
  },
});

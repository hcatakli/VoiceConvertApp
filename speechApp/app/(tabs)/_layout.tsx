import { Tabs } from "expo-router";
import { MessageSquare, Mic, Repeat } from "lucide-react-native";
import React from "react";
import Colors from "../../constants/color";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.colors.primary,
        tabBarInactiveTintColor: Colors.colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.colors.surface,
          borderTopColor: Colors.colors.surfaceLight,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="text-to-speech"
        options={{
          title: "Text to Speech",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="speech-to-text"
        options={{
          title: "Speech to Text",
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="voice-clone"
        options={{
          title: "Voice Clone",
          tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

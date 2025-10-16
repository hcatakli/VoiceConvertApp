import createContextHook from "@nkzw/create-context-hook";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { API_BASE_URL, Voice } from "@/constants/api";

export const [VoiceProvider, useVoice] = createContextHook(() => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    "EXAVITQu4vr4xnSDxMaL"
  );

  const voicesQuery = useQuery({
    queryKey: ["voices"],
    queryFn: async (): Promise<Voice[]> => {
      const response = await fetch(`${API_BASE_URL}/voices`);
      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }
      return response.json();
    },
  });

  const selectedVoice = voicesQuery.data?.find(
    (v) => v.voice_id === selectedVoiceId
  );

  return {
    voices: voicesQuery.data ?? [],
    selectedVoiceId,
    selectedVoice,
    setSelectedVoiceId,
    isLoadingVoices: voicesQuery.isLoading,
    voicesError: voicesQuery.error,
  };
});

export const API_BASE_URL = "http://localhost:8000";

export interface Voice {
  name: string;
  voice_id: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id?: string;
}

export interface SpeechToTextResponse {
  text: string;
}

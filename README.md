**Voice Studio - AI Text & Speech Transformation App**
Voice Studio is a mobile application built with React Native and Expo that allows users to interact with AI-powered voice technologies. It provides three main features:
Text to Speech (TTS) – Convert any text into natural-sounding speech using selectable AI voices.
Speech to Text (STT) – Record your voice and get accurate transcriptions in real-time.
Speech to Speech (STS) / Voice Conversion – Transform your recorded voice into another AI voice while preserving your speech content.

**Key Features**
- Multiple AI voices to choose from
- Real-time audio recording and playback
- Interactive waveform visualization during audio playback
- Responsive and user-friendly UI
- Works on iOS, Android, and Web

**Tech Stack**
Frontend: React Native, Expo, TypeScript
Audio Processing: Expo Audio, expo-av, ElevenLabs
Backend: FastAPI (Python) for handling TTS, STT, and STS requests
State Management: React Context & React Query
UI Components: Lucide icons, LinearGradient, SafeAreaView

**Usage**
Clone the repository

Run 
/ npm install or yarn install

Start the Expo server with npx expo start

Make sure the FastAPI backend is running for TTS/STT/STS endpoints

**Future Improvements**
Add more AI voices and multilingual support
Save and share generated audio files
Integrate offline TTS/STT models

# Voice Studio - AI Text & Speech Transformation App
Voice Studio is a mobile application built with React Native and Expo that allows users to interact with AI-powered voice technologies. It provides three main features:
Text to Speech (TTS) – Convert any text into natural-sounding speech using selectable AI voices.
Speech to Text (STT) – Record your voice and get accurate transcriptions in real-time.
Speech to Speech (STS) / Voice Conversion – Transform your recorded voice into another AI voice while preserving your speech content.

## Key Features
- Multiple AI voices to choose from
- Real-time audio recording and playback
- Interactive waveform visualization during audio playback
- Responsive and user-friendly UI
- Works on iOS, Android, and Web

## Tech Stack
**Frontend:** React Native, Expo, TypeScript
**Audio Processing:** Expo Audio, expo-av, ElevenLabs
**Backend:** FastAPI (Python) for handling TTS, STT, and STS requests
**State Management:** React Context & React Query
**UI Components:** Lucide icons, LinearGradient, SafeAreaView

## Get started
1. Clone the repository
   ```bash
   git clone https://github.com/hcatakli/ReactFlow-Learn-react-.git
   ```
2. Run
   ```bash
   npm install or yarn install
   ```
3. Start the app

   ```bash
    npx expo start
   ```
4. Make sure the FastAPI backend is running for TTS/STT/STS endpoints

### Future Improvements
Add more AI voices and multilingual support
Save and share generated audio files
Integrate offline TTS/STT models

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)

## Learn more
To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

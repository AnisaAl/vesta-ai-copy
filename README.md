# Fashion AI Companion

A mobile-first AI-powered fashion companion that transforms fashion discovery and personal styling through intelligent, adaptive technologies.

## Features

- **AI Fashion Assistant**: Chat with an AI that understands fashion trends and can provide personalized styling advice
- **Image Analysis**: Upload images of clothing items or outfits to get tailored recommendations
- **Multi-platform**: Available as both a web application and a native mobile app
- **Chat History**: Review past conversations and fashion advice
- **Robust Fallback System**: Uses Fashion-MNIST dataset when OpenAI API is unavailable

## Technology Stack

### Web Application
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI API with local fallback system

### Mobile Application
- **Framework**: React Native with Expo
- **UI**: React Native Paper
- **Navigation**: React Navigation
- **API**: Shared backend with web application

## Getting Started

### Prerequisites
- Node.js (version 18 or later)
- npm or yarn
- PostgreSQL database

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgresql://username:password@localhost:5432/fashion_ai
OPENAI_API_KEY=your_openai_api_key
```

### Installation and Running (Web)

1. Install dependencies:
   ```
   npm install
   ```

2. Start the application:
   ```
   npm run dev
   ```

This will start both the backend server and frontend application.

### Installation and Running (Mobile)

1. Navigate to the mobile directory:
   ```
   cd client/mobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the API URL in `src/lib/api.js` with your server's IP address

4. Start the Expo development server:
   ```
   npm start
   ```

5. Use the Expo Go app on your device to scan the QR code, or run in an emulator/simulator

## Development Notes

- The web application communicates with the backend through RESTful API endpoints
- The mobile application uses the same API endpoints but requires the correct IP address to be configured
- Both applications use shared data models defined in `shared/schema.ts`
- Chat history is persisted in the database and available across platforms

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# Ad-Maestro

Ad-Maestro is an AI-powered video advertisement creation platform that enables users to generate high-quality video ads from scripts with consistent characters and visual styles.

> **Note**: This project is currently under development and is proprietary software. It is not intended for redistribution or public use without permission.

## Features

- **Script Generation**: Create compelling ad scripts with AI assistance
- **Character Consistency**: Maintain consistent characters throughout your video using reference images
- **Visual Storyboarding**: Design detailed storyboards with precise control over shot types, camera movements, and visual styles
- **AI-Powered Image Generation**: Create high-quality preview images using fal.ai's Instant Character model
- **Video Generation**: Transform storyboard scenes into cohesive videos with image-to-video AI

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher recommended)
- Git

## API Keys Required

Ad-Maestro leverages several AI services that require API keys:

1. **[fal.ai](https://fal.ai/)** - For image generation (Instant Character) and video generation
   - Used for creating high-quality character images and converting them to videos
   - Free tier available with limited usage

2. **[Groq](https://groq.com/)** - For LLM and TTS capabilities
   - Powers the script generation, language understanding, and text-to-speech functionality
   - Provides fast inference for both text and voice generation
   - Free tier available with generous limits

3. **[ElevenLabs](https://elevenlabs.io/)** - For high-quality soundeffects
   - Creates realistic sfx for your videos
   - Free tier available with limited sound generation

## Installation

Follow these steps to set up Ad-Maestro locally:

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ad-maestro.git
cd ad-maestro
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment variables file**

Create a `.env.local` file in the root directory and add your API keys:

```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
# Note: The fal.ai API key is entered directly in the application UI
```

## Running the Application

Start the development server:

```bash
npm run dev
```

This will start the Vite development server. Open your browser and navigate to:

```
http://localhost:5173
```

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Using Ad-Maestro

### Step 1: Script Generation
1. Start on the landing page and click "Get Started"
2. Enter your product or service details, target audience, and tone
3. Use AI to generate a compelling script
4. Edit the script as needed

### Step 2: Character Setup
1. Go to the "Characters" tab
2. Upload a reference image for your main character
3. Provide a character name and description
4. Choose between Instant Character (high quality) and MiniMax (stylized) models

### Step 3: Storyboard Creation
1. Navigate to the "Storyboard" tab
2. For each scene, customize:
   - Shot types (wide, medium, close-up)
   - Camera movements (static, pan, tilt, tracking)
   - Environment type (interior, exterior)
   - Time of day and lighting conditions
   - Visual style and color palette

### Step 4: Generate Preview Images
1. Click "Generate All Previews" to create images for all scenes, or
2. Generate individual preview images for each scene

### Step 5: Video Generation
1. Go to the "Videos" tab
2. Generate videos for scenes with preview images
3. Review the generated videos

### Step 6: Final Editing
Finalize your video in the editor before exporting.

## API Key Setup Guide

### fal.ai
1. Create an account at [fal.ai](https://fal.ai/)
2. Go to your account dashboard
3. Click on "API Keys" in the left sidebar
4. Create a new API key with an appropriate name
5. Copy the key and enter it in the "AI Assistant" tab of Ad-Maestro when prompted

### Groq
1. Sign up at [Groq](https://groq.com/)
2. Navigate to your API keys section in the dashboard
3. Generate a new API key
4. Copy the key and add it to your `.env.local` file as `VITE_GROQ_API_KEY=your_key_here`

### ElevenLabs
1. Create an account at [ElevenLabs](https://elevenlabs.io/)
2. Go to your profile settings
3. Find your API key in the "API" section
4. Copy the key and add it to your `.env.local` file as `VITE_ELEVENLABS_API_KEY=your_key_here`

## Troubleshooting

**Common issues and solutions:**

- **API Key Errors**: 
  - Ensure your API keys are correctly entered without extra spaces
  - Check if you've hit rate limits on free tiers
  - Verify the API key is active in the provider's dashboard

- **Image Generation Issues**:
  - Some prompts may be rejected due to content policies
  - Try more neutral descriptions if images fail to generate
  - Check your fal.ai account for any credits/usage limitations

- **Long Processing Times**:
  - Video generation can take several minutes, be patient
  - Check your internet connection
  - Consider using lower quality settings for faster results

- **Browser Compatibility**:
  - Ad-Maestro works best on Chrome, Edge, or Firefox
  - Ensure your browser is up to date

## Technologies Used

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui and Radix UI
- **Routing**: React Router v6
- **Build Tool**: Vite
- **AI Services**:
  - fal.ai for image and video generation
  - Groq for AI text generation
  - ElevenLabs for voice synthesis

## Project Status

This project is currently under development and is proprietary. It is not open-source and is not licensed for redistribution or modification without explicit permission.

## Additional Resources

To help you understand the technologies used in Ad-Maestro:

### Documentation

- [React Documentation](https://reactjs.org/docs/getting-started.html) - React fundamentals
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript language features
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Vite Guide](https://vitejs.dev/guide/) - Next-generation frontend tooling

### API References

- [fal.ai API Documentation](https://fal.ai/docs) - For image and video generation
- [Groq API Reference](https://console.groq.com/docs/quickstart) - For text generation
- [ElevenLabs API Documentation](https://elevenlabs.io/docs) - For voice synthesis

### Component Libraries

- [shadcn/ui Documentation](https://ui.shadcn.com/docs) - Re-usable components built with Radix UI
- [Radix UI Primitives](https://www.radix-ui.com/docs/primitives/overview/introduction) - UI component primitives

### Additional Learning

- [React Router Documentation](https://reactrouter.com/en/main) - For application routing
- [Tailwind UI](https://tailwindui.com/) - For design inspiration
- [Lucide Icons](https://lucide.dev/) - Icon set used in the project

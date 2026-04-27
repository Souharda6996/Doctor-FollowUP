# HomeoDoc Frontend

The interactive UI for the Homeopathy AI Assistant, built with Next.js 14 and Tailwind CSS.

## 🚀 Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` file with:
   - `NEXT_PUBLIC_API_URL`: Pointing to your backend (default: http://localhost:8000)
   - Firebase client credentials for Authentication.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   *Accessible at: http://localhost:3000*

## 📁 Key Directories

- `src/app/`: Next.js App Router pages.
- `src/lib/`: Core logic and API client.
- `src/contexts/`: Shared state (Auth, UI).
- `messages/`: Localization files (en/hi).

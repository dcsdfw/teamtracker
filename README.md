# Time Tracker App

A React-based time tracking application for cleaning teams with Firebase backend.

## 🚀 Features

- **Time Tracking**: Start/stop timer with notes
- **Facility Management**: Multiple facility support with dropdown selection
- **Manager Interface**: View all time entries and manage facilities
- **Offline Support**: Firebase Firestore with offline persistence
- **Mobile-Friendly**: Responsive design for mobile devices
- **Navigation**: Hamburger menu for easy navigation

## 🔧 Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd timetracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Firestore database
   - Set up Firestore rules (see Security section)
   - Get your Firebase config from Project Settings

5. **Run the app**
   ```bash
   npm run dev
   ```

## 🔒 Security

### Current Security Model
- **Simple Cleaner IDs**: Uses basic cleaner ID system (not production-ready)
- **Open Access**: Firestore rules allow read/write for all users
- **No Authentication**: No user authentication implemented

### Production Security Recommendations
1. **Implement Firebase Authentication**
2. **Add user-based Firestore rules**
3. **Validate cleaner IDs server-side**
4. **Add rate limiting**
5. **Implement proper session management**

### Firestore Rules
Current rules allow open access. For production, implement:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /logs/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.cleanerId;
    }
  }
}
```

## 📱 Usage

### For Cleaners
1. Enter your cleaner ID or use "MANAGER" for manager mode
2. Select your facility from the dropdown
3. Start the timer when you begin work
4. Stop the timer and add notes when finished
5. Save your entry

### For Managers
1. Use "MANAGER" as cleaner ID
2. Access Manager Mode from hamburger menu
3. View all time entries
4. Add new facilities
5. Manage schedules

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📁 Project Structure

```
src/
├── App.tsx                 # Main application component
├── App.css                 # Main styles
├── firebase.ts             # Firebase configuration
├── firestoreService.ts     # Firebase service layer
├── useTimer.ts             # Timer hook
├── CleanerLogin.tsx        # Login component
├── components/
│   ├── ManagerInterface.tsx # Manager interface
│   ├── StartButton.tsx     # Start button component
│   ├── StopButton.tsx      # Stop button component
│   └── NotesBox.tsx        # Notes input component
```

## ⚠️ Important Notes

- **Environment Variables**: Never commit `.env` files to Git
- **Firebase Keys**: Keep Firebase configuration secure
- **Production**: Implement proper authentication before production use
- **Backup**: Regularly backup your Firestore data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

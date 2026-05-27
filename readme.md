# 🐸 Frog Rush 2 — Mobile Testing & Android Deployment Guide

This guide focuses exclusively on testing the game on Android devices using Capacitor.

## 1. Syncing Changes to Android
Whenever you modify `game.js` or `index.html` in the root folder, you must sync them to the Android project.

1.  **Open Terminal** in the `frog game` directory.
2.  **Copy Assets:**
    ```powershell
    npx cap copy android
    ```
3.  **Update Plugins** (if you added new Capacitor plugins):
    ```powershell
    npx cap sync android
    ```

## 2. Testing on Physical Device (Development)
1.  **Enable Developer Options** on your Android phone and turn on **USB Debugging**.
2.  **Connect Device** via USB to your computer.
3.  **Launch Android Studio:**
    ```powershell
    npx cap open android
    ```
4.  **Run:** Select your phone in the top toolbar and press the **Play (Run)** button (or `Shift + F10`).

## 3. Testing via APK (Sideloading)
Use this to share the game with others for testing without using Android Studio.

1.  **Build Debug APK:** In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
2.  **Locate File:** The file will be at `android/app/build/outputs/apk/debug/app-debug.apk`.
3.  **Install:** Transfer this file to your phone and open it to install.

## 4. Mobile Playtesting Checklist
Focus on these mobile-specific interactions:

- [ ] **Touch Responsiveness:** Is there any noticeable lag between a screen tap and the frog jumping?
- [ ] **Immersive Mode:** Does the game automatically hide the Android navigation bar and status bar?
- [ ] **Performance:** Does the game maintain a smooth 60 FPS during "Fever Mode" with many particles?
- [ ] **Audio Context:** Does the sound start immediately after the first tap on the screen?
- [ ] **Backgrounding:** If you minimize the app and return, does it resume correctly?
- [ ] **Battery/Heat:** Does the device get excessively hot after 10+ minutes of play?

## 5. Production Release (Google Play)
1.  **Update Versioning:** Open `android/app/build.gradle` and increment `versionCode` and `versionName`.
2.  **Generate Signed AAB:**
    *   In Android Studio: `Build > Generate Signed Bundle / APK`.
    *   Select `Android App Bundle`.
    *   Use `release.keystore` to sign.
3.  **Optimization:** Ensure `minifyEnabled` is set to `true` in your release build type for a smaller file size.

## 6. Android Troubleshooting
- **Black Screen:** Ensure all file paths in `index.html` are relative (e.g., `game.js`) and not absolute (`/game.js`).
- **Laggy Gameplay:** Ensure Hardware Acceleration is enabled in the `AndroidManifest.xml`.
- **WebView Version:** If things look broken, ensure the "Android System WebView" on the test device is updated via the Play Store.

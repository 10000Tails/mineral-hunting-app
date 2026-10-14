# Sign-in setup (Firebase, Google, Apple)

The app signs people in with **Sign in with Apple** and **Sign in with Google**, using
Firebase Authentication. Favorites are saved to the signed-in account in Firestore.
Until the steps below are done, the app runs normally and simply says sign-in isn't set up.

Sign-in does **not** work in Expo Go. Test it in a development build or TestFlight build
(see "Test it" below).

Bundle ID used everywhere: `com.robertsbuildinggroup.mineralhunter`
(set in `app.json`; change it everywhere before the first App Store upload if you want a different one).

## 1. Firebase project

1. Go to <https://console.firebase.google.com> and create a project (e.g. "Mineral Hunter").
   Google Analytics isn't needed.
2. **Project settings → General → Your apps → Add app → Web (`</>`)**. Name it anything.
   Copy the config values into a new `.env` file (copy `.env.example`):
   `apiKey`, `authDomain`, `projectId`, `appId`.
3. Still in **Your apps**, **Add app → iOS**, bundle ID `com.robertsbuildinggroup.mineralhunter`.
   You don't need to add the downloaded `GoogleService-Info.plist` to the project — open it and
   copy its `CLIENT_ID` into `.env` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

## 2. Turn on Google sign-in

1. **Build → Authentication → Get started → Sign-in method → Google → Enable**, pick a support
   email, **Save**.
2. Open the Google provider again and expand **Web SDK configuration**. Copy the
   **Web client ID** into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

## 3. Turn on Sign in with Apple

Needs the Apple Developer Program membership.

1. In the Apple Developer site (<https://developer.apple.com/account>) → **Certificates,
   Identifiers & Profiles → Identifiers**, make sure the App ID
   `com.robertsbuildinggroup.mineralhunter` exists with **Sign In with Apple** checked.
   (EAS Build can create it for you on the first build.)
2. **Keys → +**, name it "Mineral Hunter Sign in with Apple", check **Sign in with Apple**,
   configure it for the App ID above, **Continue → Register**, and **download the .p8 key**
   (you can only download it once). Note the **Key ID** and your **Team ID** (top right).
3. In Firebase: **Authentication → Sign-in method → Add new provider → Apple → Enable**.
   Under **OAuth code flow configuration** enter the Team ID, Key ID and the contents of the
   .p8 file. **Save**. (This is what lets the app revoke Apple's token when someone deletes
   their account, which Apple requires.)

## 4. Firestore (saved favorites)

1. **Build → Firestore Database → Create database**, production mode, a US location.
2. **Rules** tab: replace the rules with the contents of `firestore.rules` in this repo, **Publish**.

## 5. Put the values where builds can see them

- `.env` in the project folder (from `.env.example`) is used when you run `npx expo start`
  and when you build on your Mac.
- For EAS cloud builds, either commit `.env` (these values are public client IDs that ship
  inside the app anyway, not passwords) or add each one with
  `npx eas-cli@latest env:create`.

## Test it

Expo Go can't run Google or Apple sign-in. Make a development build once and install it on
your iPhone:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform ios
```

EAS will ask to register your iPhone; follow the link it shows on the phone. After that,
`npx expo start` works with the installed development build just like Expo Go did.

## Account deletion

Apple requires apps with sign-in to offer account deletion. The Account tab has
**Delete Account**: it asks Apple/Google to confirm, deletes the person's favorites in
Firestore, revokes the Apple token, and deletes the Firebase account.

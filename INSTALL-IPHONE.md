# Installing DeadRight on your iPhone

The app compiles and runs on the simulator. Getting it onto a physical iPhone
needs **code signing**, which requires your Apple ID — so these steps are yours
to run, not something that can be automated from a terminal.

---

## Option A — Free Apple ID (7-day install)

Free, works today, but the app **stops opening after 7 days** and you re-run the
same steps to renew. Fine for testing on your own phone.

### 1. Sign in to Xcode
`Xcode → Settings → Accounts → +` → Apple ID → sign in with your normal Apple ID.
No paid developer program needed.

### 2. Open the workspace
```bash
open ios/DeadRight.xcworkspace
```
Always the **.xcworkspace**, never the .xcodeproj (CocoaPods requires it).

### 3. Set the signing team
Select the **DeadRight** target → **Signing & Capabilities**:
- ✅ Automatically manage signing
- **Team**: your Apple ID (it'll say "Personal Team")

If you get *"Failed to register bundle identifier"*, `co.deadright.app` is taken
on Apple's side. Change **Bundle Identifier** to something unique, e.g.
`com.<yourname>.deadright`, and update `app.json` → `ios.bundleIdentifier` to match.

### 4. Plug in your iPhone
- Connect by USB, unlock it, tap **Trust This Computer**
- In Xcode's device dropdown (top bar), pick your iPhone instead of a simulator
- Your iPhone needs **Developer Mode**: Settings → Privacy & Security →
  Developer Mode → On → restart when prompted (iOS 16+)

### 5. Build a Release version
Debug builds need the Metro server running on your Mac — the app will show a red
"No script URL provided" screen without it. For a standalone app:

**Xcode → Product → Scheme → Edit Scheme → Run → Build Configuration → `Release`**

Then press **▶︎ Run** (or ⌘R).

### 6. Trust the developer certificate on the phone
First launch will refuse with *"Untrusted Developer"*. On the iPhone:

**Settings → General → VPN & Device Management → [your Apple ID] → Trust**

Open the app again and it works.

---

## Option B — TestFlight (90 days, shareable)

Needs the **Apple Developer Program ($99/year)**. Worth it if you want other
people testing, or you're heading toward the App Store.

1. Enroll at <https://developer.apple.com/programs/>
2. Create the app record in App Store Connect using your bundle ID
3. In Xcode: device dropdown → **Any iOS Device (arm64)** →
   **Product → Archive**
4. In the Organizer window → **Distribute App → TestFlight & App Store**
5. Once processed, add testers in App Store Connect — they install via the
   TestFlight app

Builds last 90 days and anyone you invite can install, no cable needed.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Red screen, "No script URL provided" | Debug build with no Metro. Switch the scheme to Release (step 5) |
| "Untrusted Developer" | Step 6 — trust the cert on the phone |
| "Failed to register bundle identifier" | Bundle ID taken; pick a unique one (step 3) |
| App vanishes after a week | Expected on a free Apple ID — rebuild to renew |
| Emoji show as boxes | Only happens on the *simulator* (its runtime lacks the emoji font). Real devices are fine |

---

## Android, for comparison

No signing ceremony — the APK is already built and self-contained:

```bash
cd android && ./gradlew :app:assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```
Or just copy `DeadRight.apk` to the phone and tap it.

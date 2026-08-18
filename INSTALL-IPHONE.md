# Installing DeadRight on your iPhone

Once the phone has been paired and trusted **once** (the one-time setup below),
installing a fresh build is fully scriptable from the terminal — no Xcode
window, no clicking Run.

---

## The fast path — build and install from the terminal

Works whenever the phone is plugged in (or on the same Wi-Fi, once paired),
unlocked, and Developer Mode is on. Verified on Xcode 16 / iOS 26.

```bash
# Team ID is the cert's OU field — not the ID in the identity's parentheses
TEAM=$(security find-certificate -c "Apple Development" -p | openssl x509 -noout -subject | tr '/' '\n' | sed -n 's/^OU=//p')
UDID=$(xcodebuild -workspace ios/DeadRight.xcworkspace -scheme DeadRight -showdestinations 2>/dev/null | sed -n 's/.*{ platform:iOS, arch:arm64, id:\([^,]*\), name:.*/\1/p' | head -1)
DEVICE=$(xcrun devicectl list devices | awk '/available \(paired\)/ {print $3; exit}')

xcodebuild -workspace ios/DeadRight.xcworkspace -scheme DeadRight \
  -configuration Release \
  -destination "id=$UDID" \
  -derivedDataPath /tmp/deadright-ios \
  DEVELOPMENT_TEAM="$TEAM" CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates \
  build

xcrun devicectl device install app --device "$DEVICE" \
  /tmp/deadright-ios/Build/Products/Release-iphoneos/DeadRight.app

xcrun devicectl device process launch --device "$DEVICE" co.deadright.app
```

Takes ~4 minutes cold, and the derived-data tree is ~2 GB — delete
`/tmp/deadright-ios` when you're done.

### The two device IDs are different — this trips people up

`xcodebuild` and `devicectl` identify the same phone by different IDs:

| Tool | ID kind | Looks like |
|---|---|---|
| `xcodebuild -destination` | hardware UDID | `00008120-00104434213BA01E` |
| `xcrun devicectl --device` | CoreDevice UUID | `678E7B29-796E-51FF-8C5A-5A62B9DCDBF6` |

Feeding the CoreDevice UUID to `xcodebuild` fails with *"Unable to find a device
matching the provided destination specifier"* even though the phone is right
there. List them with:

```bash
xcrun devicectl list devices
xcodebuild -workspace ios/DeadRight.xcworkspace -scheme DeadRight -showdestinations
```

### Always Release, never Debug

A Debug build expects the Metro dev server and shows a red *"No script URL
provided"* screen on its own. `-configuration Release` embeds `main.jsbundle`
(~4.7 MB) into the .app, so the app is standalone.

This also means **JS-only changes still need a full rebuild** — there's no
`expo-updates`/EAS channel configured in this project, so nothing can be pushed
over the air.

---

## One-time setup

Only needed on a phone that has never been used for development on this Mac.

### 1. Sign in to Xcode
`Xcode → Settings → Accounts → +` → Apple ID. No paid developer program needed —
a free Apple ID gives you a "Personal Team".

This is what puts the `Apple Development` certificate in your keychain. Confirm:

```bash
security find-identity -v -p codesigning
```

### 2. Pair the phone
Connect by USB, unlock it, tap **Trust This Computer**.

### 3. Turn on Developer Mode
On the phone: **Settings → Privacy & Security → Developer Mode → On** → restart
when prompted (iOS 16+).

### 4. First build from Xcode
The very first install is easiest through the GUI, because Xcode registers the
device with your team and generates the provisioning profile:

```bash
open ios/DeadRight.xcworkspace
```
Always the **.xcworkspace**, never the .xcodeproj (CocoaPods needs it). Select
the **DeadRight** target → **Signing & Capabilities** → ✅ Automatically manage
signing → **Team**: your Personal Team. Pick the phone in the device dropdown,
set the scheme to Release (**Product → Scheme → Edit Scheme → Run → Build
Configuration → Release**), then ⌘R.

After that succeeds once, use the terminal path above forever.

### 5. Trust the certificate on the phone
First launch refuses with *"Untrusted Developer"*:

**Settings → General → VPN & Device Management → [your Apple ID] → Trust**

---

## The 7-day expiry

On a free Apple ID the signing certificate lasts **7 days** — the app stops
opening after that. Re-running the fast-path script re-signs and reinstalls it.
Nothing is lost; it's not a rebuild-from-scratch situation.

The Apple Developer Program ($99/yr) raises this to a year and unlocks
TestFlight (below).

---

## TestFlight — 90 days, shareable, no cable

Needs the **Apple Developer Program**. Worth it only if other people need to
test, or you're heading for the App Store.

1. Enroll at <https://developer.apple.com/programs/>
2. Create the app record in App Store Connect using `co.deadright.app`
3. Xcode: device dropdown → **Any iOS Device (arm64)** → **Product → Archive**
4. Organizer → **Distribute App → TestFlight & App Store**
5. Add testers in App Store Connect; they install via the TestFlight app

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| "Unable to find a device matching the provided destination specifier" | Passed the CoreDevice UUID to `xcodebuild`; it wants the hardware UDID |
| Red screen, "No script URL provided" | Debug build with no Metro. Use `-configuration Release` |
| "Untrusted Developer" | Trust the cert on the phone (one-time setup, step 5) |
| "Failed to register bundle identifier" | `co.deadright.app` is taken on Apple's side. Pick a unique ID and update `app.json` → `ios.bundleIdentifier` |
| App stops opening after a week | Expected on a free Apple ID — re-run the fast path |
| `devicectl` hangs or can't reach the device | Phone locked, or unplugged before pairing over Wi-Fi settled. Unlock and retry |
| Emoji show as boxes | Simulator only — its runtime lacks the emoji font. Real devices are fine |

---

## Android, for comparison

No signing ceremony:

```bash
cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=$HOME/Library/Android/sdk ./gradlew :app:assembleRelease
```
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

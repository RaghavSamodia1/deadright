# Iteration screenshots

One folder per iteration, named `YYYY-MM-DD-topic`, holding the frames captured
while verifying that change.

**Emulator frames are committed. Device frames are not.** This repository is
public and `docs/` is its GitHub Pages source, so anything here is published.
The emulator runs on the demo account and shows nobody real; a capture from an
actual phone shows real people's names, handles and groups. Name a folder
`…-phone` and `.gitignore` keeps it out.

## Capturing

Android emulator:

    adb exec-out screencap -p > screenshots/<folder>/<name>.png

iPhone: harder than it looks, and currently not possible from here.
`devicectl` has no screenshot command. `idevicescreenshot` (libimobiledevice,
installed) does, but it needs the Developer Disk Image mounted, and iOS 17+
uses a personalized image that libimobiledevice 1.4.0 cannot mount over USB
without a `pymobiledevice3` tunnel running as root. Until that is set up, take
device screenshots by hand (side button + volume up).

Name frames for what they show (`home-before.png`, `home-after.png`), not the
order they were taken in.

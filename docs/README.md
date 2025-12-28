# Fasting Tracker

A production-ready intermittent fasting tracker built with vanilla HTML/CSS/JavaScript and Capacitor for mobile deployment. Track your fasting journey with intelligent protocols, achievement badges, body stats, and metabolic phase detection.

## Features

### Core Functionality
- **⏱️ Smart Timer**: Never auto-stops - continues past protocol end time for extended fasts
- **📱 Offline-First**: Works completely offline with localStorage
- **🔔 Local Notifications**: Capacitor-based notifications (no backend required)
- **📊 Body Stats Tracking**: Weight, measurements, energy, mood with Chart.js graphs
- **🏆 Achievement System**: 21 unlockable badges across 4 categories
- **🔄 Maintenance Mode**: Flexible protocols when you've reached your goals
- **🗓️ Fasting Scheduler (Optional)**: Daily start/end reminders with no auto-start

### Fasting Protocols
1. **8:16** - Beginner (8hr fasting, 16hr eating)
2. **10:14** - Beginner (10hr fasting, 14hr eating)
3. **12:12** - Beginner (12hr fasting, 12hr eating)
4. **14:10** - Intermediate (14hr fasting, 10hr eating)
5. **16:8** - Intermediate (16hr fasting, 8hr eating)
6. **18:6** - Advanced (18hr fasting, 6hr eating)
7. **20:4** - Advanced (20hr fasting, 4hr eating)
8. **24+** - Extended (24+ hour fasting)

### Metabolic Phases (4-hour increments)
- **0-4h**: Fed State - Digesting food
- **4-8h**: Early Fasting - Transitioning to fat burning
- **8-12h**: Fat Burning - Primary fuel switch
- **12-16h**: Ketosis Begins - Ketone production
- **16-24h**: Deep Ketosis - Peak fat burning
- **24-48h**: Autophagy - Cellular cleanup
- **48-72h**: Deep Autophagy - Enhanced repair
- **72+h**: Maximum Autophagy - Advanced renewal

### Badge Categories
- **Milestone** (9 badges): First fast, protocol completions
- **Consistency** (5 badges): Streaks, progression, maintenance
- **Nutrition** (3 badges): Meal diversity
- **Body Goals** (4 badges): Measurements, weight loss

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6 modules)
- **Charts**: Chart.js 4.4.0
- **Mobile**: Capacitor 6.x
- **Notifications**: @capacitor/local-notifications
- **Storage**: localStorage (cloud-sync ready schemas)
- **No frameworks**: No React, Vue, or Angular
- **No backend**: Completely offline-first

## Project Structure

```
fasting_tracker/
├── index.html                 # Main app shell
├── package.json              # Dependencies and scripts
├── capacitor.config.ts       # Capacitor configuration
├── android/                   # Android Studio WebView wrapper
├── scripts/                   # Build/copy helpers for web/Android assets
├── dist/                      # Generated web build output (created by web:build)
├── src/
│   ├── app.js               # Main bootstrap file
│   ├── state/
│   │   ├── storage.js       # localStorage wrapper with CRUD
│   │   └── device.js        # Device ID management
│   ├── protocols/
│   │   └── protocols.js     # 8 fasting protocol definitions
│   ├── fasting/
│   │   ├── phases.js        # 9 metabolic phase definitions
│   │   ├── timer.js         # Timer that never auto-stops
│   │   └── sessions.js      # Fasting history management
│   ├── notifications/
│   │   └── notifications.js # Capacitor local notifications
│   ├── scheduler/
│   │   └── scheduler.js     # Optional fasting schedule reminders
│   ├── badges/
│   │   └── badges.js        # Badge system (21 badges)
│   ├── bodyStats/
│   │   └── bodyStats.js     # Body stats tracking
│   ├── meals/
│   │   └── meals.js         # Meal library
│   ├── maintenance/
│   │   └── maintenance.js   # Maintenance mode logic
│   ├── ui/
│   │   ├── navigation.js    # Tab navigation
│   │   ├── dashboard.js     # Dashboard UI & timer display
│   │   ├── bodyStatsView.js # Body stats UI & graphs
│   │   ├── badgesView.js    # Badges rendering
│   │   └── settingsView.js  # Settings UI
│   └── styles/
│       └── main.css         # All application styles
└── docs/
    └── README.md             # This file
```

## Installation

### Prerequisites
- Node.js 16+ and npm
- For iOS: Xcode 14+ (macOS only)
- For Android: Android Studio with SDK 33+

### Development Setup

1. **Clone or navigate to the project directory**
```bash
cd fasting_tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

This starts a local server at `http://localhost:8080`. The app works fully in the browser.

## Mobile Build Instructions

### Local Release APK (Signed)

1. Export signing env vars:
```bash
export FASTFLOW_KEYSTORE_PASSWORD="your_keystore_password"
export FASTFLOW_KEY_PASSWORD="your_key_password"
```
2. Build release APK:
```bash
cd android
./gradlew assembleRelease
```
3. Output APK:
`android/app/build/outputs/apk/release/app-release.apk`

### GitHub Actions APK Builds

Release APKs are built via GitHub Actions and uploaded as workflow artifacts. This is the source of truth for tester downloads.

Workflow file: `.github/workflows/android-apk.yml`

Required repository secrets:
- `FASTFLOW_KEYSTORE_BASE64`
- `FASTFLOW_KEYSTORE_PASSWORD`
- `FASTFLOW_KEY_PASSWORD`

## Fasting Scheduler (Optional)

FastFlow includes an optional fasting scheduler that sends reminder notifications at your chosen daily start and end times. It never starts or stops a fast automatically—you’re always in control.

- Enable it in Settings → **Fasting Schedule (Optional)**
- Set start and end times (daily)
- Reminders appear once per day
- Disabling the scheduler cancels pending reminders

## Manual Test Checklist (Scheduler)

- Enable scheduler → notifications appear at the chosen times
- Disable scheduler → no reminders fire
- Manual start/stop still works normally
- App closed/backgrounded → reminders still appear
- Reopen app → no duplicate reminders
- Fast already active → no start reminder (reschedules on state change)
- Fast inactive → no end reminder (reschedules on state change)

### Android WebView Wrapper (Android Studio)

This repo includes a minimal Android Studio project in `android/` that wraps the web app in a WebView and loads `file:///android_asset/www/index.html`.

1. **Build and copy web assets**
```bash
npm run android:assets
```

2. **Open Android Studio**
Open the `android/` directory in Android Studio and press **Run** on a connected device or emulator.

3. **Run web in browser (optional)**
```bash
npm run web:serve
```

### Initialize Capacitor

```bash
npm run cap:init
```

### Android Build

1. **Add Android platform**
```bash
npm run cap:add:android
```

2. **Sync web code to Android**
```bash
npm run cap:sync
```

3. **Open in Android Studio**
```bash
npm run cap:open:android
```

4. In Android Studio:
   - Wait for Gradle sync to complete
   - Connect a device or start an emulator
   - Click "Run" to build and install the app

### iOS Build (macOS only)

1. **Add iOS platform**
```bash
npm run cap:add:ios
```

2. **Sync web code to iOS**
```bash
npm run cap:sync
```

3. **Open in Xcode**
```bash
npm run cap:open:ios
```

4. In Xcode:
   - Select your development team in signing settings
   - Select a device or simulator
   - Click "Run" to build and install the app

### Update Mobile Apps After Changes

After making changes to web code:

```bash
npm run cap:sync
```

This copies updated files to iOS and Android projects.

## Data Architecture

All data uses cloud-sync ready schemas with:
- `uuid`: Unique identifier for each record
- `deviceId`: Device identifier for multi-device sync
- `syncStatus`: 'pending' | 'synced' | 'conflict'
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `lastSyncedAt`: ISO timestamp (nullable)

### Collections
- `fastingSessions`: Completed fasting sessions
- `activeFast`: Current active fast state
- `bodyStats`: Body measurements and stats
- `meals`: Meal library entries
- `unlockedBadges`: Achievement badges
- `maintenanceMode`: Maintenance mode state
- `deviceId`: Device identifier
- `notificationPreferences`: Notification settings

## Key Implementation Details

### Timer Never Auto-Stops
The timer uses two time references:
- `plannedEndTime`: When protocol SHOULD end (for UI guidance)
- `actualEndTime`: When user STOPS the fast (set on manual stop)

The timer continues running past `plannedEndTime` and enters "Extended Fast" mode with visual indicators (orange color, animated progress bar).

### Event-Driven Architecture
Custom events for loosely coupled components:
- `timerUpdate`: Timer state changes
- `fastPlannedEndReached`: Protocol duration complete
- `badgeUnlocked`: New badge achieved
- `tabChanged`: Navigation changes
- `maintenanceModeChanged`: Maintenance mode toggle

### Notification Types
1. **Fast ending soon**: Protocol-specific offset (1-2 hours before)
2. **Fast complete**: At planned end (timer continues)
3. **Water reminders**: Every 60 minutes (120 in maintenance mode)
4. **Phase transitions**: Optional (off by default)

### Badge Unlock Triggers
- Session completion
- Protocol milestones
- Streak achievements
- Body stat goals
- Maintenance mode activation

## Development Scripts

```bash
npm run dev              # Start dev server
npm run web:serve         # Start dev server (alias)
npm run web:build         # Copy web assets into dist/
npm run android:assets    # Copy dist/ into android assets/www
npm run cap:init         # Initialize Capacitor
npm run cap:add:android  # Add Android platform
npm run cap:add:ios      # Add iOS platform
npm run cap:sync         # Sync web to native
npm run cap:open:android # Open in Android Studio
npm run cap:open:ios     # Open in Xcode
```

## Browser Compatibility

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

## Future Enhancements

- Cloud sync backend (schemas already prepared)
- Apple Health / Google Fit integration
- Advanced analytics and insights
- Social features and community
- Custom protocol builder
- Meal planning integration


## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using vanilla JavaScript and Capacitor**

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastingtracker.app',
  appName: 'Fasting Tracker',
  webDir: '.',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
      sound: "beep.wav"
    }
  }
};

export default config;

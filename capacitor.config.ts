import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deglobeal.taskoramint',
  appName: 'TaskoraMint',
  webDir: 'dist',
  server: {
    url: 'https://taskoramint.vercel.app',
    cleartext: false,
  },
};

export default config;
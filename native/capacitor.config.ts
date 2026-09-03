import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alviratech.alvira",
  appName: "ALVIRA",
  webDir: "www",
  server: {
    url: "https://alviratech.vercel.app/app",
    cleartext: false
  }
};

export default config;

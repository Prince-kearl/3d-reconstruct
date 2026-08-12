export const SETTINGS_SECTIONS = [
  "General",
  "Appearance",
  "Reconstruction",
  "Viewport",
  "Performance",
  "Files & Storage",
  "Autosave & Recovery",
  "Privacy",
  "Keyboard Shortcuts",
  "About",
] as const;

export const QUICK_PRESETS = [
  { name: "Balanced Workstation", desc: "Optimized for most users" },
  { name: "Maximum Quality", desc: "Best quality, higher resource use" },
  { name: "Low VRAM", desc: "Optimized for limited VRAM" },
  { name: "Custom", desc: "Manually configured settings" },
] as const;

export const SHORTCUTS: [string, string][] = [
  ["Start Reconstruction", "Ctrl+R"],
  ["Save Scene", "Ctrl+S"],
  ["Toggle Console", "Ctrl+`"],
  ["Frame Selection", "F"],
  ["Fullscreen", "Shift+F"],
];

export const CONFIG_LOG = [
  "[10:48:02]  Local preferences loaded",
  "[10:48:03]  GPU profile detected: RTX 3060",
  "[10:48:04]  Balanced Workstation preset active",
  "[10:48:05]  Autosave recovery verified",
  "[10:48:06]  Configuration valid",
  "[10:48:07]  Settings ready",
];

export const SETTINGS_HEALTH = [
  "Preferences Loaded",
  "Paths Available",
  "GPU Profile Valid",
  "Recovery Enabled",
  "No Conflicts",
];

export const SYSTEM_INFO: [string, string][] = [
  ["Platform", "Windows 11"],
  ["CPU", "12-Core Processor"],
  ["Memory", "32 GB"],
  ["GPU", "RTX 3060"],
  ["VRAM", "12 GB"],
  ["WebGL", "2.0"],
];

export const ACCENT_SWATCHES = [
  "var(--accent)",
  "var(--ok)",
  "oklch(0.72 0.13 210)",
  "oklch(0.8 0.15 80)",
  "oklch(0.65 0.2 25)",
];
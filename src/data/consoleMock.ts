export type Severity = "INFO" | "OK" | "WARN" | "ERR";

export type ConsoleEvent = {
  n: string;
  time: string;
  level: Severity;
  text: string;
  source: string;
};

export const LOG_SOURCES: { name: string; count: number }[] = [
  { name: "All Sources", count: 128 },
  { name: "Reconstruction", count: 42 },
  { name: "Refinement", count: 21 },
  { name: "Texture", count: 18 },
  { name: "Export", count: 16 },
  { name: "Scenes", count: 12 },
  { name: "System", count: 19 },
];

export const SEVERITIES: { name: string; count: number; dot: string }[] = [
  { name: "Info", count: 96, dot: "var(--axis-z)" },
  { name: "Success", count: 24, dot: "var(--ok)" },
  { name: "Warning", count: 6, dot: "var(--lime)" },
  { name: "Error", count: 2, dot: "var(--axis-x)" },
];

export const SAVED_QUERIES = [
  "Current Session",
  "Errors Only",
  "GPU Events",
  "Export Pipeline",
  "Last Reconstruction",
];

export const CONSOLE_EVENTS: ConsoleEvent[] = [
  { n: "001", time: "10:44:01.284", level: "INFO", text: "Session initialized: Portrait Project", source: "System" },
  { n: "002", time: "10:44:01.512", level: "INFO", text: "GPU detected: NVIDIA RTX 3060 (12GB)", source: "System" },
  { n: "003", time: "10:44:02.106", level: "OK", text: "Reconstruction engine ECON ready", source: "Reconstruction" },
  { n: "004", time: "10:44:02.844", level: "OK", text: "Refined mesh loaded — 1,186,420 vertices", source: "Refinement" },
  { n: "005", time: "10:44:03.091", level: "OK", text: "4 texture maps linked — 2048 × 2048", source: "Texture" },
  { n: "006", time: "10:44:03.528", level: "INFO", text: "Scene 'Crystal Portrait' activated", source: "Scenes" },
  { n: "007", time: "10:44:04.004", level: "OK", text: "Camera_Main and lighting rig validated", source: "Scenes" },
  { n: "008", time: "10:44:04.619", level: "WARN", text: "GPU memory usage reached 61%", source: "System" },
  { n: "009", time: "10:44:05.217", level: "INFO", text: "Export preset: Crystal Production", source: "Export" },
  { n: "010", time: "10:44:05.840", level: "OK", text: "Watertight check passed", source: "Export" },
  { n: "011", time: "10:44:06.133", level: "OK", text: "Crystal bounds validated — 14.8 × 20.0 × 11.6 cm", source: "Export" },
  { n: "012", time: "10:44:06.721", level: "INFO", text: "Waiting for next command...", source: "System" },
];

export const JOB_QUEUE: { name: string; state: "Completed" | "Running" | "Queued" }[] = [
  { name: "Texture Cache", state: "Completed" },
  { name: "Export Validation", state: "Completed" },
  { name: "Scene Render", state: "Running" },
  { name: "Snapshot Index", state: "Queued" },
];

export const CONSOLE_ERRORS = [
  { time: "10:44:04", text: "Missing optional AO cache" },
  { time: "10:44:07", text: "Preview timeout recovered" },
];

export const OUTPUT_LINES: { time: string; text: string; tone: "muted" | "warn" | "ok" }[] = [
  { time: "10:44:01", text: "System health check completed", tone: "muted" },
  { time: "10:44:01", text: "All required engines available", tone: "muted" },
  { time: "10:44:02", text: "2 recoverable warnings detected", tone: "warn" },
  { time: "10:44:02", text: "No blocking errors", tone: "ok" },
  { time: "10:44:02", text: "Console stream active", tone: "ok" },
];

export const SESSION_HEALTH = [
  "API Bridge",
  "GPU Runtime",
  "Asset Cache",
  "Job Queue",
  "Event Stream",
];

export const SESSION_INFO: [string, string][] = [
  ["Project", "Portrait Project"],
  ["Session ID", "DXF-240811-A7"],
  ["Started", "Today, 10:44"],
];

export const RUNTIME_INFO: [string, string][] = [
  ["Frontend", "v0.8.4-beta"],
  ["WebGL", "2.0"],
  ["Three.js", "r180"],
  ["Renderer", "Hardware"],
];

export const THROUGHPUT_A = [8, 26, 14, 33, 20, 30, 12, 28, 18, 24];
export const THROUGHPUT_B = [4, 12, 9, 18, 11, 16, 8, 15, 10, 13];
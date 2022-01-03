import { execSync } from "child_process";
import fs from "fs";

function getCommandResult(command: string) {
  try {
    return execSync(command).toString().trim();
  } catch (e) {
    return null;
  }
}

function getVenvPythonPath() {
  if (fs.existsSync("speech-recognition/venv/bin/python")) {
    return "speech-recognition/venv/bin/python";
  } else if (fs.existsSync("speech-recognition/venv/Scripts/python.exe")) {
    return "speech-recognition\\venv\\Scripts\\python.exe";
  }
  throw new Error("Could not find venv python");
}

interface SpeechRecognitionResult {
  text: string;
  confidence: number;
}

export function getSpeechRecognition(
  filename: string
): SpeechRecognitionResult | null {
  const pythonPath = getVenvPythonPath();
  const result = getCommandResult(
    pythonPath + " speech-recognition/main.py --filename " + filename
  );
  if (result) {
    try {
      const json = JSON.parse(result);
      if (json.status) {
        return json;
      }
    } catch (e) {
      console.warn(result);
    }
  }
  return null;
}

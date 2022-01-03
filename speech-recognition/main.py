import argparse
import json

import speech_recognition

parser = argparse.ArgumentParser(description='Speech recognition')
parser.add_argument(
    "--filename",
    help='WAVファイルへのパス',
    required=True
)
args = parser.parse_args()

r = speech_recognition.Recognizer()

with speech_recognition.AudioFile(args.filename) as source:
    audio = r.record(source)

result = r.recognize_google(audio, language='ja-JP', show_all=True)
if not isinstance(result, dict) or len(result.get("alternative", [])) == 0:
    print(json.dumps({
        "status": False,
    }), end="")
    exit()
if "confidence" in result["alternative"]:
    best_hypothesis = max(result["alternative"], key=lambda alternative: alternative["confidence"])
else:
    best_hypothesis = result["alternative"][0]

try:
    if "confidence" in best_hypothesis:
        print(json.dumps({
            "status": True,
            'text': best_hypothesis["transcript"],
            'confidence': best_hypothesis["confidence"],
        }), end="")
    else:
        print(json.dumps({
            "status": True,
            'text': best_hypothesis["transcript"]
        }), end="")
except:
    print(best_hypothesis)

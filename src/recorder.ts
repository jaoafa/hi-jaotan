import { OpusEncoder } from "@discordjs/opus";
import { EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import { User } from "discord.js";
import * as stream from "stream";
import { FileWriter } from "wav";

class OpusDecodingStream extends stream.Transform {
  encoder;

  constructor(options: stream.TransformOptions | undefined, encoder: any) {
    super(options);
    this.encoder = encoder;
  }

  _transform(
    data: any,
    _encoding: BufferEncoding,
    callback: stream.TransformCallback
  ) {
    this.push(this.encoder.decode(data));
    callback();
  }
}

export async function recorder(
  receiver: VoiceReceiver,
  userId: string,
  user?: User
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const filename = `./recordings/${Date.now()}-${user?.username}.wav`;
    const encoder = new OpusEncoder(16000, 1);
    receiver
      .subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 100,
        },
      })
      .pipe(new OpusDecodingStream({}, encoder))
      .pipe(
        new FileWriter(filename, {
          channels: 1,
          sampleRate: 16000,
        }),
        { end: true }
      )
      .on("finish", () => resolve(filename))
      .on("error", (e) => reject(e));
  });
}

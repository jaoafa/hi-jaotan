import {
  DiscordGatewayAdapterCreator,
  joinVoiceChannel,
  VoiceConnection,
} from '@discordjs/voice'
import { Client, Guild, TextChannel, VoiceBasedChannel } from 'discord.js'

export const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe])

export async function joinChannel(
  channel: VoiceBasedChannel
): Promise<VoiceConnection | null> {
  return joinChannelId(channel.id, channel.guild)
}

export async function joinChannelId(
  channelId: string,
  guild: Guild
): Promise<VoiceConnection | null> {
  try {
    const connection = joinVoiceChannel({
      channelId: channelId,
      guildId: guild.id,
      selfDeaf: false,
      selfMute: false,
      debug: true,
      adapterCreator:
        guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
    })
    return connection
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function report(client: Client, message: string) {
  const channel = client.channels.resolve('971530492740526090') as TextChannel
  await channel?.send(message)
}

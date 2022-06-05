import {
  entersState,
  getVoiceConnection,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import config from 'config'
import {
  Guild,
  GuildMember,
  Snowflake,
  TextChannel,
  VoiceBasedChannel,
} from 'discord.js'
import fs from 'fs'
import { getClient } from './main'
import { recorder } from './recorder'
import { getSpeechRecognition } from './speech-recognition'
import { joinChannel, SILENCE_FRAME } from './utils'

let recordingUsers: string[] = []

async function getUser(userId: Snowflake) {
  const client = getClient()
  if (client.users.cache.get(userId)) {
    return client.users.cache.get(userId)
  }
  return await client.users.fetch(userId)
}

export async function processJoin(connection: VoiceConnection | null) {
  if (connection) {
    const result = connection.playOpusPacket(SILENCE_FRAME)
    console.log('Send silence packet: ', result)

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20e3)
      const receiver = connection.receiver

      receiver.speaking.on('start', async (userId: string) => {
        if (recordingUsers.includes(userId)) {
          return
        }
        recordingUsers.push(userId)
        const user = await getUser(userId)
        console.log(`💬 ${user?.tag} starts speaking`)
        const filename = await recorder(receiver, userId, user)
        console.log(
          `⏩ ${user?.tag} ends speaking (and recognizing) -> ${filename}`
        )

        const result = getSpeechRecognition(filename)
        recordingUsers = recordingUsers.filter((id) => id !== userId)
        if (fs.existsSync(filename)) fs.unlinkSync(filename)
        if (!result) {
          console.log(`❌ ${user?.tag} failed recognize speech`)
          return
        }

        const confidence = Math.floor(result.confidence * 100)
        console.log(
          `✅ ${user?.tag} recognized speech: ${result.text} (${confidence}%)`
        )
        const message = `\`${user?.tag}\`: \`${result.text}\` (${confidence}%)`
        getClient()
          .channels.fetch(config.get('sendChannel'))
          .then((channel) => {
            if (channel instanceof TextChannel) channel.send(message)
          })

        if (config.has('threadChannel') && config.get('sendThread')) {
          getClient()
            .channels.fetch(config.get('threadChannel'))
            .then((channel) => {
              if (!(channel instanceof TextChannel)) return
              channel?.threads
                .fetch(config.get('sendThread'))
                .then((thread) => {
                  if (!thread) return
                  thread?.send(message)
                })
            })
        }
      })
    } catch (error) {
      console.warn(error)
    }
  }
}

export async function Join(
  guild: Guild,
  channel: VoiceBasedChannel,
  member: GuildMember
) {
  console.log(
    `Member ${member.user.tag} Join to ${channel.name} in ${guild.name}`
  )
  const joiningChannel = getVoiceConnection(guild.id)
  let connection: VoiceConnection | null = null
  if (!joiningChannel) {
    // どこにも参加していないので参加する
    connection = await joinChannel(channel)
  } else if (joiningChannel.joinConfig.channelId === channel.id) {
    // 同じチャンネルに参加しているので何もしない
    return
  } else {
    // それ以外(他のチャンネルに参加している)のときは、何もしない
    return
  }
  await processJoin(connection)
}

export async function Move(
  guild: Guild,
  oldChannel: VoiceBasedChannel,
  newChannel: VoiceBasedChannel,
  member: GuildMember
) {
  console.log(
    `Member ${member.user.tag} Moved to ${newChannel.name} in ${guild.name} from ${oldChannel.name}`
  )

  if (member.id === getClient().user?.id) {
    const connection = getVoiceConnection(guild.id)
    if (connection) {
      await processJoin(connection)
    }
  }
}

export async function Leave(
  guild: Guild,
  channel: VoiceBasedChannel,
  member: GuildMember
) {
  console.log(
    `Member ${member.user.tag} Leaved from ${channel.name} in ${guild.name}`
  )
  const count = channel.members.filter(
    (u) => u.id !== getClient().user?.id && !u.user.bot
  ).size

  const joiningChannel = getVoiceConnection(guild.id)

  if (member.id === getClient().user?.id) {
    if (count !== 0) {
      console.log('🤖 Reconnecting...')
      const connection = await joinChannel(channel)
      await processJoin(connection)
    }
  } else if (
    joiningChannel &&
    joiningChannel.joinConfig.channelId === channel.id
  ) {
    if (count === 0) {
      console.log('🤖 Disconnect')
      const connection = getVoiceConnection(guild.id)
      if (connection) {
        connection.disconnect()
      }
    }
  }
}

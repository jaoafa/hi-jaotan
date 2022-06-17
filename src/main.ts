import config from 'config'
import { Client, Intents } from 'discord.js'
import { joinChannel } from './utils'
import { Join, Leave, Move, processJoin } from './vc-events'

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
})

export function getClient() {
  return client
}

client.on('ready', (client) => {
  console.log('Ready: ' + client.user.tag)

  /*
  setInterval(() => {
    try {
      client.guilds.cache.forEach((guild) => {
        const connection = getVoiceConnection(guild.id)
        const channelId = connection?.joinConfig.channelId
        if (connection) {
          console.log(connection.state.status)
          let result = connection.playOpusPacket(SILENCE_FRAME)
          if (result === undefined) {
            if (channelId)
              joinChannelId(channelId, guild)
                .then((connection) => {
                  processJoin(connection)
                    .then(() => {
                      console.log('Reconnected')
                    })
                    .catch((err) => {
                      console.log(err)
                    })
                })
                .catch((err) => {
                  console.log(err)
                })

            result = connection.playOpusPacket(SILENCE_FRAME)
            if (result === undefined) {
              client.destroy()
              if (channelId)
                joinChannelId(channelId, guild)
                  .then((connection) => {
                    processJoin(connection)
                      .then(() => {
                        console.log('Reconnected')
                      })
                      .catch((err) => {
                        console.log(err)
                      })
                  })
                  .catch((err) => {
                    console.log(err)
                  })
            }
          }
          console.log(
            `${guild.name} (${guild.id}): Send silence packet:`,
            result
          )
        }
      })
    } catch (err) {
      console.log(err)
    }
  }, 60000)
  */
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  if (!message.guild) return
  if (!message.member) return
  if (!message.member.voice.channel) return

  const channel = message.member.voice.channel

  if (message.content.toLowerCase() === '!!join') {
    const connection = await joinChannel(channel)
    if (connection) {
      await processJoin(connection)
      await message.reply(':white_check_mark: Joined the channel')
    }
  }
})

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState && oldState) {
    if (newState.member === null) {
      return
    }
    if (newState.guild != null) {
      if (
        config.has('guilds') &&
        !(config.get('guilds') as string[]).includes(newState.guild.id)
      ) {
        // 対象外チャンネル
        return
      }
    }
    if (
      oldState.channelId === null &&
      newState.channelId != null &&
      newState.channel != null
    ) {
      Join(newState.guild, newState.channel, newState.member)
    }
    if (
      oldState.channelId != null &&
      oldState.channel != null &&
      newState.channelId === null &&
      client.user?.id !== undefined &&
      newState.guild.members.resolve(client.user?.id) != null &&
      newState.guild.members.resolve(client.user?.id)?.voice.channelId !==
        null &&
      newState.guild.members.resolve(client.user?.id)?.voice.channelId !==
        newState.channelId
    ) {
      Leave(newState.guild, oldState.channel, newState.member)
    }
    if (
      oldState.channelId != null &&
      oldState.channel != null &&
      newState.channelId != null &&
      newState.channel != null &&
      oldState.channelId !== newState.channelId
    ) {
      Move(newState.guild, oldState.channel, newState.channel, newState.member)
    }
  }
})

client.on('shardError', (error) => {
  console.error('A websocket connection encountered an error:', error)
})

client.login(config.get('discordToken')).catch((err) => console.error(err))

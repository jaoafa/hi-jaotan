import config from "config";
import { Client } from "discord.js";
import { Join, Leave, Move } from "./vc-events";

const client = new Client({
  intents: ["GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILDS"],
});

export function getClient() {
  return client;
}

client.on("ready", (client) => console.log("Ready: " + client.user.tag));

client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState && oldState) {
    if (newState.member === null) {
      return;
    }
    if (newState.guild != null) {
      if (
        config.has("guilds") &&
        !(config.get("guilds") as string[]).includes(newState.guild.id)
      ) {
        // 対象外チャンネル
        return;
      }
    }
    if (
      oldState.channelId === null &&
      newState.channelId != null &&
      newState.channel != null
    ) {
      Join(newState.guild, newState.channel, newState.member);
    }
    if (
      oldState.channelId != null &&
      oldState.channel != null &&
      newState.channelId === null
    ) {
      Leave(newState.guild, oldState.channel, newState.member);
    }
    if (
      oldState.channelId != null &&
      oldState.channel != null &&
      newState.channelId != null &&
      newState.channel != null &&
      oldState.channelId !== newState.channelId
    ) {
      Move(newState.guild, oldState.channel, newState.channel, newState.member);
    }
  }
});

client.login(config.get("discordToken"));

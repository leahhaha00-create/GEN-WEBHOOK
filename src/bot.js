// FULL DISCORD BOT — Aesthetic Channels + Auto Webhooks + /gen webhook
// Host on Render — Ready for GitHub
// Node.js 18+, discord.js v14

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// Aesthetic emoji channels
const channels = [
  { key: "saved-webhook", label: "Saved Webhooks", emoji: "📁" },
  { key: "visits", label: "Visits", emoji: "📊" },
  { key: "nbc", label: "NBC", emoji: "📦" },
  { key: "prem", label: "Premium", emoji: "💎" },
  { key: "vnbc", label: "V-NBC", emoji: "🚀" },
  { key: "vprem", label: "V-Premium", emoji: "✨" },
  { key: "success", label: "Success", emoji: "✅" },
  { key: "failed", label: "Failed", emoji: "❌" }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const commands = [
    new SlashCommandBuilder()
      .setName("gen")
      .setDescription("Generate webhook URL for a specific channel")
      .addStringOption(o =>
        o
          .setName("channel")
          .setDescription("Which webhook to retrieve")
          .setRequired(true)
      )
      .toJSON()
  ];

  await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
    body: commands
  });

  console.log("Slash commands registered.");
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID);

  for (const ch of channels) {
    const prettyName = `${ch.emoji}┃${ch.key}`;

    let channel = guild.channels.cache.find(c => c.name === prettyName);

    if (!channel) {
      channel = await guild.channels.create({
        name: prettyName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });
    }

    const hooks = await channel.fetchWebhooks();
    let webhook = hooks.find(w => w.name === `${ch.key}-webhook`);

    if (!webhook) {
      webhook = await channel.createWebhook({
        name: `${ch.key}-webhook`
      });
    }

    const save = channels.find(c => c.key === "saved-webhook");
    const savedPretty = `${save.emoji}┃${save.key}`;
    const savedChannel = guild.channels.cache.find(c => c.name === savedPretty);

    if (savedChannel) {
      await savedChannel.send(
        `**${ch.label} Webhook:** \`${webhook.url}\``
      );
    }
  }

  await registerCommands();
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "gen") {
    const target = interaction.options.getString("channel");
    const ch = channels.find(c => c.key === target);

    if (!ch)
      return interaction.reply({
        content: "Unknown webhook channel.",
        ephemeral: true
      });

    const prettyName = `${ch.emoji}┃${ch.key}`;
    const channel = interaction.guild.channels.cache.find(
      c => c.name === prettyName
    );

    const hooks = await channel.fetchWebhooks();
    const webhook = hooks.find(w => w.name === `${ch.key}-webhook`);

    return interaction.reply({
      content: `**${ch.label} Webhook:** \`${webhook.url}\``,
      ephemeral: true
    });
  }
});

client.login(TOKEN);
  

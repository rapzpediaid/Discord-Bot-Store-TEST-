// Discord Store Bot (Replit Ready)
// Fitur: Role Menu, Post, Auto Post, Ticket, AI Chat, dll.
// Tambahan: Express server untuk keep-alive di Replit.

require("dotenv").config();
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionsBitField,
} = require("discord.js");
const cron = require("node-cron");
const OpenAI = require("openai").default;

// --- Express Keep Alive ---
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("🌐 Keep-alive server running."));

// --- Bot Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const PREFIX = process.env.PREFIX || "!";

// --- Utility: Embed ---
function createEmbed({ title, description, color = 0x2b2d31, footer }) {
  const e = new EmbedBuilder()
    .setTitle(title || "")
    .setDescription(description || "")
    .setColor(color)
    .setTimestamp();
  if (footer) e.setFooter({ text: footer });
  return e;
}

// --- Ready Event ---
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Message Commands ---
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "ping") {
    msg.reply("🏓 Pong!");
  }

  if (cmd === "post") {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return msg.reply("❌ Hanya admin!");
    const title = args.shift() || "Store Post";
    const body = args.join(" ") || "No body";
    const embed = createEmbed({
      title,
      description: body,
      footer: "Store Bot",
    });
    const buyBtn = new ButtonBuilder()
      .setCustomId("store_buy_button")
      .setLabel("Buy")
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(buyBtn);
    msg.channel.send({ embeds: [embed], components: [row] });
  }

  if (cmd === "menu") {
    const embed = createEmbed({
      title: "📦 Store Menu",
      description: "Pilih kategori di bawah:",
    });
    const btn1 = new ButtonBuilder()
      .setCustomId("menu_item_1")
      .setLabel("Games")
      .setStyle(ButtonStyle.Secondary);
    const btn2 = new ButtonBuilder()
      .setCustomId("menu_item_2")
      .setLabel("Topup")
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(btn1, btn2);
    msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// --- Button Interaction ---
client.on("interactionCreate", async (inter) => {
  if (!inter.isButton()) return;

  if (inter.customId === "store_buy_button") {
    await inter.reply({
      content: "✅ Pesanan diterima! Silakan hubungi admin.",
      ephemeral: true,
    });
  }

  if (inter.customId === "menu_item_1") {
    await inter.reply({
      embeds: [createEmbed({ title: "🎮 Games", description: "Daftar game di sini." })],
      ephemeral: true,
    });
  }

  if (inter.customId === "menu_item_2") {
    await inter.reply({
      embeds: [createEmbed({ title: "💎 Topup", description: "Layanan topup tersedia." })],
      ephemeral: true,
    });
  }
});

// --- AI Chat Command (prefix) ---
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "ai") {
    if (!process.env.OPENAI_API_KEY)
      return msg.reply("❌ AI tidak dikonfigurasi.");
    const prompt = args.join(" ");
    if (!prompt) return msg.reply("❓ Masukkan pertanyaan setelah `!ai`.");

    await msg.channel.send("🤖 Sedang berpikir...");

    try {
      const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      const answer = res.choices?.[0]?.message?.content || "Tidak ada jawaban.";
      msg.reply(answer);
    } catch (err) {
      console.error(err);
      msg.reply("❌ Terjadi error saat memanggil AI.");
    }
  }
});

// --- Login Bot ---
client.login(process.env.DISCORD_TOKEN);

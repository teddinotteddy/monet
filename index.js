import { Client, GatewayIntentBits, Routes } from "discord.js"
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv"
import { REST } from "@discordjs/rest"
import express from "express"
import path from "path"
import { fileURLToPath } from 'url';

dotenv.config()

const app = express()

const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const GUILD_ID = process.env.GUILD_ID
const API_KEY = process.env.API_KEY
const PORT = process.env.PORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"))
})

const configuration = new Configuration({
    apiKey: API_KEY
})

const openai = new OpenAIApi(configuration)

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
})

const rest = new REST({ version: "10" }).setToken(TOKEN)

client.on("ready", () => {
    console.log("Monet is ready to paint!")
    client.user.setActivity("painting things!")
})

client.on("interactionCreate", async (interaction) => {
    if (interaction.commandName === "paint") {
        const prompt = interaction.options.get("prompt").value
        const channelid = interaction.channelId

        interaction.reply("Painting, please wait a moment.")

        const result = await openai.createImage({
            prompt,
            n: 1,
            size: "1024x1024",
        })

        const url =  result.data.data[0].url
        console.log(url)

        const channel = client.channels.cache.get(channelid)
        channel.send(`Prompt: ${prompt} Image link: ${url}`)
    }
})

async function main() {

    const commands = [
        {
            name: "paint",
            description: "Takes a prompt and then uses AI to paint an image!",
            options: [
                {
                    name: "prompt",
                    description: "Any idea you can think of!",
                    type: 3,
                    required: true
                }
            ]
        }
    ]

    try {
        console.log("Started refreshing application (/) commands.")

        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        })

        client.login(TOKEN)
    }
    catch(err) {
        console.log(err)
    }
}

main()
app.listen(
    PORT,
    () => console.log(`It's alive! On http://localhost:${PORT}`)
)

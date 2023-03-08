// Import required modules
const fs = require('node:fs'); // File system module
const path = require('node:path'); // Path module
const {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  Collection,
} = require('discord.js'); // Discord.js library
const examQuestion = require('./scheduled_scripts/exam-question'); // Import examQuestion script
const roles = require('./scheduled_scripts/roles'); // Import roles script

// Read the secrets.json file and parse the contents
let configFile = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));

// Create a new Discord client with specified intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create a collection to store the commands
client.commands = new Collection();

// Get all files in the 'commands' folder and filter for .js files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

// Loop through each command file and add it to the client.commands collection
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Event listener for when the client is ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Initialize the examQuestion and roles scripts
  examQuestion.init(client, configFile);
  roles.init(client, configFile);
});

// Event listener for when a user interacts with the bot
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    // If it is a command
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }
    try {
      await command.execute(interaction); // Execute the command
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    // If it is a button click
    if (interaction.customId.includes('exam')) {
      // If the button is for an exam
      examQuestion.answers(interaction); // Call the examQuestion answers function
    } else if (interaction.customId.includes('role')) {
      // If the button is for a role
      roles.update(interaction); // Call the roles update function
    }
  }
});

// Event listener for when a message is deleted
client.on('messageDelete', async (message) => {
  console.log('del');
  try {
    if (message.author.bot) return;
    if (message.content === '') return;
    let channel = client.channels.cache.find(
      (ch) => ch.name === configFile.log_chan
    );
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(':wastebasket: Message Delete in #' + message.channel.name)
      .setAuthor({ name: message.author.username })
      .setDescription('Deleted on ' + new Date().toString())
      .addFields({
        name: 'Message content',
        value: '```' + message.content + '```',
      });
    channel.send({ embeds: [embed] });
  } catch (e) {
    console.error(e);
  }
});

client.login(configFile.token).catch(function () {
  console.error(
    'Login failed. The token that you put in is most likely invalid.'
  );
  process.exit(1);
});

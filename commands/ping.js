const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		const sent = await interaction.reply({content: 'Pinging...', fetchReply: true });
		interaction.editReply(`Websocket heartbeat: ${interaction.client.ws.ping}ms. Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
	},
};

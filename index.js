const {
	Client,
	GatewayIntentBits,
	Partials,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ComponentType,
	StringSelectMenuBuilder,
} = require("discord.js");

const { token } = require("./config.json");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const ID_CANAL_REGISTRO = "1362947408526573588";
const ROL_SIN_VERIFICACION = "1362947750873792715";
const MAPEO_GRUPOS = {
	unity_lunes_630: "ROL_Unity_Lunes_630",
	scratch_miercoles_400: "ROL_Scratch_Miercoles_400",
	// agrega más según necesidad
};

client.once("ready", () => {
	console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
	const canalRegistro = member.guild.channels.cache.get(ID_CANAL_REGISTRO);
	if (!canalRegistro) return;

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("iniciar_registro")
			.setLabel("Iniciar Registro")
			.setStyle(ButtonStyle.Primary)
	);

	try {
		await member.roles.add(ROL_SIN_VERIFICACION);
		console.log(`✅ Asignado el rol de Sin Verificación a ${member.user.tag}`);
	} catch (error) {
		console.error("Error al asignar el rol de Sin Verificación:", error);
	}
	canalRegistro.send({
		content: `Bienvenido <@${member.id}>! Para acceder al servidor, completa el siguiente formulario.`,
		components: [row],
	});
});

client.login(token);

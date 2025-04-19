const {
	Client,
	GatewayIntentBits,
	Partials,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
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

const PROFESORES = {
	miller: {
		nombre: "Miller",
		materias: {
			roblox: {
				nombre: "Roblox",
				dias: {
					martes: ["6:30pm"],
				},
			},
			unity: {
				nombre: "Unity",
				dias: {
					miercoles: ["5:00pm"],
				},
			},
			python: {
				nombre: "Python",
				dias: {
					jueves: ["6:30pm"],
				},
			},
		},
	},
	damian: {
		nombre: "Damian",
		materias: {
			unity: {
				nombre: "Unity",
				dias: {
					lunes: ["6:00pm"],
					jueves: ["6:30pm"],
					viernes: ["5:00pm"],
					sabado: ["10:30am"],
				},
			},
			roblox: {
				nombre: "Roblox",
				dias: {
					martes: ["5:00pm"],
				},
			},
			python: {
				nombre: "Python",
				dias: {
					sabado: ["9:00am"],
					miercoles: ["6:30pm"],
				},
			},
		},
	},
	leonardo: {
		nombre: "Leonardo",
		materias: {
			unity: {
				nombre: "Unity",
				dias: {
					lunes: ["Intensivo"],
					martes: ["Intensivo"],
				},
			},
			roblox: {
				nombre: "Roblox",
				dias: {
					miercoles: ["6:30pm"],
					sabado: ["10:30am"],
				},
			},
			python: {
				nombre: "Python",
				dias: {
					jueves: ["6:30pm"],
				},
			},
		},
	},
	miguel: {
		nombre: "Miguel",
		materias: {
			unity: {
				nombre: "Unity",
				dias: {
					viernes: ["5:00pm"],
				},
			},
			roblox: {
				nombre: "Roblox",
				dias: {
					martes: ["5:00pm"],
					miercoles: ["5:00pm", "6:30pm"],
					jueves: ["5:00pm"],
					viernes: ["6:30pm"],
				},
			},
		},
	},
	hafid: {
		nombre: "Hafid",
		materias: {
			unity: {
				nombre: "Unity",
				dias: {
					viernes: ["6:30pm"],
				},
			},
		},
	},
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
		console.log(`✅ Rol "Sin Verificación" asignado a ${member.user.tag}`);
	} catch (error) {
		console.error("❌ Error al asignar rol:", error);
	}

	canalRegistro.send({
		content: `Bienvenido <@${member.id}>! Para acceder al servidor, completa el siguiente formulario:`,
		components: [row],
	});
});

const sesiones = new Map(); // userId -> sesión temporal

client.on("interactionCreate", async (interaction) => {
	if (interaction.isButton() && interaction.customId === "iniciar_registro") {
		const userId = interaction.user.id;

		sesiones.set(userId, {}); // Reinicia la sesión

		const row = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("select_profesor")
				.setPlaceholder("¿Quién es tu profesor?")
				.addOptions(
					Object.keys(PROFESORES).map((id) => ({
						label: PROFESORES[id].nombre,
						value: id,
					}))
				)
		);

		// Usar update si es parte de una respuesta previa, reply si es una nueva
		try {
			if (interaction.replied || interaction.deferred) {
				await interaction.update({
					content: "Paso 1: Elige tu profesor",
					components: [row],
				});
			} else {
				await interaction.reply({
					content: "Paso 1: Elige tu profesor",
					components: [row],
					ephemeral: true,
				});
			}
		} catch (error) {
			console.error("Error al enviar la respuesta de registro:", error);
		}
	}

	if (interaction.isStringSelectMenu()) {
		const userId = interaction.user.id;
		const sesion = sesiones.get(userId) || {};
		const { customId, values, member, guild } = interaction;
		const selected = values[0];

		if (customId === "select_profesor") {
			sesion.profesorId = selected;
			sesiones.set(userId, sesion);

			const profesor = PROFESORES[selected];
			const row = new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("select_materia")
					.setPlaceholder("¿Qué materia ves con este profesor?")
					.addOptions(
						Object.keys(profesor.materias).map((mat) => ({
							label: profesor.materias[mat].nombre,
							value: mat,
						}))
					)
			);
			await interaction.update({
				content: "Paso 2: Elige la materia",
				components: [row],
			});
		} else if (customId === "select_materia") {
			sesion.materiaId = selected;
			sesiones.set(userId, sesion);

			const profesor = PROFESORES[sesion.profesorId];
			const dias = Object.keys(profesor.materias[selected].dias);

			const row = new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("select_dia")
					.setPlaceholder("¿Qué día ves la materia?")
					.addOptions(dias.map((dia) => ({ label: dia, value: dia })))
			);

			await interaction.update({
				content: "Paso 3: Elige el día",
				components: [row],
			});
		} else if (customId === "select_dia") {
			sesion.dia = selected;
			sesiones.set(userId, sesion);

			const profesor = PROFESORES[sesion.profesorId];
			const horas = profesor.materias[sesion.materiaId].dias[selected];

			const row = new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("select_hora")
					.setPlaceholder("¿A qué hora?")
					.addOptions(horas.map((hora) => ({ label: hora, value: hora })))
			);

			await interaction.update({
				content: "Paso 4: Elige la hora",
				components: [row],
			});
		} else if (customId === "select_hora") {
			const hora = selected;
			const { profesorId, materiaId, dia } = sesion;
			const profesor = PROFESORES[profesorId];
			const materia = profesor.materias[materiaId];

			const rolEstudiante = `Estudiantes ${profesor.nombre}`;
			const rolClase = `${profesor.nombre} - ${materia.nombre} - ${dia} - ${hora}`;

			// Crear roles si no existen
			let rol1 = interaction.guild.roles.cache.find(
				(r) => r.name === rolEstudiante
			);
			if (!rol1) {
				rol1 = await guild.roles.create({
					name: rolEstudiante,
					reason: "Registro automático",
				});
			}
			let rol2 = interaction.guild.roles.cache.find((r) => r.name === rolClase);
			if (!rol2) {
				rol2 = await guild.roles.create({
					name: rolClase,
					reason: "Registro automático",
				});
			}

			await member.roles.add(rol1);
			await member.roles.add(rol2);

			// Botón para registrar otra clase o finalizar registro
			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("iniciar_registro")
					.setLabel("Registrar otra clase")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("finalizar_registro")
					.setLabel("Finalizar registro")
					.setStyle(ButtonStyle.Secondary)
			);

			await interaction.update({
				content: `✅ Registro completado. Añadidos:\n- ${rol1.name}\n- ${rol2.name}`,
				components: [row],
			});

			sesiones.delete(userId);
		}
	}

	// Interacción para finalizar el registro
	if (interaction.isButton() && interaction.customId === "finalizar_registro") {
		await interaction.member.roles.remove(ROL_SIN_VERIFICACION).catch(() => {});

		await interaction.update({
			content:
				"✅ Has finalizado el registro exitosamente. ¡Bienvenido a la clase!",
			components: [],
		});
	}
});

client.login(token);

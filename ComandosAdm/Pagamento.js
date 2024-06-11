const Discord = require("discord.js");
const config = require("../config.json");
const mysql = require("mysql");

module.exports = {
  name: "pagamentos",
  description: "📱 [Configuração]",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "produto",
      description: "produto da sua escolha",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Bot Fivem",
          value: "bot",
        },
      ],
    },
  ],

  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        Discord.PermissionFlagsBits.Administrator
      )
    )
      return interaction.reply({
        content: `**❌ | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!**`,
        ephemeral: true,
      });

    const mercadopago = require("mercadopago");
    mercadopago.configurations.setAccessToken(config.MERCADO_TOKEN);

    const payment_data = {
      transaction_amount: 1,
      installments: 1,
      payment_method_id: "pix",
      payer: {
        type: "customer",
        email: "teste@gmail.com",
      },
    };

    const payment = await mercadopago.payment.create(payment_data);

    const buffer = Buffer.from(
      payment.body.point_of_interaction.transaction_data.qr_code_base64,
      "base64"
    );
    const attachment = new Discord.AttachmentBuilder(buffer, {
      name: "image.png",
    });

    interaction.reply({
      embeds: [
        new Discord.EmbedBuilder()
          .setImage("attachment://image.png")
          .addFields({
            name: "💸 Seu QR-CODE foi gerado!",
            value: payment.body.point_of_interaction.transaction_data.qr_code,
          })
          .setColor("#00BDAE")
          .setFooter({
            text: "Você tem até 24 horas para efetuar o pagamento deste qr-code",
          }),
      ],
      files: [attachment],
      ephemeral: true,
    });

    const interval = setInterval(async () => {
      const res = await mercadopago.payment.get(payment.body.id);
      const pagamentoStatus = res.body.status;

      if (pagamentoStatus != "pending") {
        return;
      }

      if (pagamentoStatus === "pending") {
        clearInterval(interval);
        const embedlogs = new Discord.EmbedBuilder().setDescription(
          "**Pagamento aprovado!**"
        );
        interaction.fetchReply();

        const connection = mysql.createConnection(config.mysql);

        connection.connect((err) => {
          if (err)
            return console.log(
              "👋 Não fo possível conectar ao mysql para fazer a wl!"
            );
        });

        connection.query(
          `SELECT * FROM mensal WHERE user = '${interaction.user.id}'`,
          function (error, res, fields) {
            if (error) connection.end();
            if (res[0]){
              connection.query(`UPDATE mensal SET date = DATE_ADD(NOW(), INTERVAL 30 DAY)`)
            } else {
              connection.query(`INSERT INTO mensal (date, user) VALUES (DATE_ADD(NOW(), INTERVAL 30 DAY), '${interaction.user.id}')`)
            }
          }
        );

        await interaction.editReply({
          embeds: [embedlogs],
          components: [],
          files: [],
        });
        await interaction.user.send({
          embeds: [embedlogs],
          components: [],
          files: [],
        });
      }
    }, 5 * 1000);

  },

};

require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🌑 The System is alive.');
});

app.listen(PORT, () => {
    console.log(`🌑 Web server running on port ${PORT}`);
});

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require('discord.js');

const { QuickDB } = require('quick.db');
const db = new QuickDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// XP COOLDOWN MAP
const cooldowns = new Map();

// BOT COMMAND CHANNEL ID
const BOT_COMMAND_CHANNEL = '1508955661667537097';

client.once('clientReady', () => {
    console.log(`🌑 The System is online as ${client.user.tag}`);
});


// NEW MEMBER JOIN
client.on('guildMemberAdd', async member => {

    // GIVE E-RANK ONLY IF USER HAS NO HUNTER RANK
    const alreadyRanked = member.roles.cache.some(role =>
        role.name.includes('Rank') ||
        role.name.includes('Monarch') ||
        role.name.includes('Kage')
    );

    if (!alreadyRanked) {

        const role = member.guild.roles.cache.find(
            r => r.name === '🔰 E-Rank Hunter'
        );

        if (role) {
            await member.roles.add(role);
        }
    }

    // FIND WELCOME CHANNEL
    const channel = member.guild.channels.cache.find(
        c => c.name.includes('welcome')
    );

    // SEND WELCOME MESSAGE
    if (channel) {

        channel.send(
`⚔️ **A new hunter has entered the gates.**

Welcome ${member}.

🌑 **The System recognizes your arrival.**

**Enter the gates. Rise through the ranks.**

https://tenor.com/view/solo-leveling-我獨自升級-s2-gif-1128383619595271984`
        );
    }
});


// MESSAGE SYSTEM
client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (!message.guild) return;

    // =========================
    // CLEAR COMMAND
    // =========================

    if (message.content.startsWith('!clear')) {

        const hasPermission =
            message.member.roles.cache.some(r => r.name.includes('Kage')) ||
            message.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasPermission) {

            const warning = await message.reply(
`⚠️ **Only Kages may use this command.**`
            );

            setTimeout(() => {
                message.delete().catch(() => {});
                warning.delete().catch(() => {});
            }, 3000);

            return;
        }

        const args = message.content.split(' ');
        const amount = parseInt(args[1]);

        if (!amount || amount < 1 || amount > 100) {

            const warning = await message.reply(
`⚠️ **Choose a number between 1 and 100.**`
            );

            setTimeout(() => {
                warning.delete().catch(() => {});
            }, 3000);

            return;
        }

        try {

            await message.channel.bulkDelete(amount, true);

            const confirmMessage = await message.channel.send(
`🌑 **The System erased ${amount} messages.**`
            );

            setTimeout(() => {
                confirmMessage.delete().catch(() => {});
            }, 3000);

        } catch (error) {

            console.log(error);

            const warning = await message.reply(
`⚠️ **The System failed to erase the messages.**`
            );

            setTimeout(() => {
                warning.delete().catch(() => {});
            }, 3000);
        }

        return;
    }


    // LEVEL-UP CHANNEL
    const levelChannel = message.guild.channels.cache.find(
        c => c.name.includes('level-up')
    );

    const userId = message.author.id;

    // XP COOLDOWN SYSTEM
    const cooldownTime = 10000;

    if (cooldowns.has(userId)) {

        const expirationTime = cooldowns.get(userId) + cooldownTime;

        if (Date.now() < expirationTime) {

            if (
                message.content.toLowerCase() !== '!level' &&
                message.content.toLowerCase() !== '!rank'
            ) {
                return;
            }
        }
    }

    cooldowns.set(userId, Date.now());

    // GET XP
    let xp = await db.get(`xp_${userId}`) || 0;

    // DETERMINE RANK FROM ROLES
    let currentRank = 'Unranked Hunter';

    if (message.member.roles.cache.some(r => r.name.includes('Eternal Kage'))) {
        currentRank = '👑 Eternal Kage';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('Shadow Monarch'))) {
        currentRank = '🌑 Shadow Monarch';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('S-Rank'))) {
        currentRank = '💎 S-Rank Hunter';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('A-Rank'))) {
        currentRank = '🛡️ A-Rank Hunter';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('B-Rank'))) {
        currentRank = '⚔️ B-Rank Hunter';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('C-Rank'))) {
        currentRank = '🗡️ C-Rank Hunter';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('D-Rank'))) {
        currentRank = '🏹 D-Rank Hunter';
    }
    else if (message.member.roles.cache.some(r => r.name.includes('E-Rank'))) {
        currentRank = '🔰 E-Rank Hunter';
    }

    // NEXT RANK
    let nextRank = '🏹 D-Rank Hunter';
    let nextXP = 250;

    if (xp >= 250) {
        nextRank = '🗡️ C-Rank Hunter';
        nextXP = 800;
    }

    if (xp >= 800) {
        nextRank = '⚔️ Manual Hunter Evaluation';
        nextXP = null;
    }


    // !LEVEL COMMAND
    if (message.content.toLowerCase() === '!level') {

        if (message.channel.id !== BOT_COMMAND_CHANNEL) {

            const warning = await message.reply(
`⚠️ **Use commands inside <#1508955661667537097>.**`
            );

            setTimeout(() => {
                message.delete().catch(() => {});
                warning.delete().catch(() => {});
            }, 3000);

            return;
        }

        let remainingXP = nextXP ? nextXP - xp : 0;

        return message.reply(
`🌑 **Hunter Level Information**

⚔️ **Current XP:** ${xp}

🏆 **Current Rank:** ${currentRank}

${nextXP
? `🔥 **XP Until ${nextRank}:** ${remainingXP}`
: '👑 **You have reached the highest automatic rank.**'}`
        );
    }


    // !RANK COMMAND
    if (message.content.toLowerCase() === '!rank') {

        if (message.channel.id !== BOT_COMMAND_CHANNEL) {

            const warning = await message.reply(
`⚠️ **Use commands inside <#1508955661667537097>.**`
            );

            setTimeout(() => {
                message.delete().catch(() => {});
                warning.delete().catch(() => {});
            }, 3000);

            return;
        }

        return message.reply(
`🌑 **Hunter Rank Status**

⚔️ **Hunter:** ${message.author.username}

🏆 **Rank:** ${currentRank}`
        );
    }


    // ADD XP
    xp += 5;

    await db.set(`xp_${userId}`, xp);


    // D-RANK PROMOTION
    if (xp >= 250 &&
        message.member.roles.cache.some(r => r.name.includes('E-Rank'))) {

        const role = message.guild.roles.cache.find(
            r => r.name === '🏹 D-Rank Hunter'
        );

        if (role && !message.member.roles.cache.has(role.id)) {

            await message.member.roles.add(role);

            if (levelChannel) {
                levelChannel.send(
`📈 **${message.author} has advanced to 🏹 D-Rank Hunter.**

🌑 **The System acknowledges your growth.**`
                );
            }
        }
    }


    // C-RANK PROMOTION
    if (xp >= 800 &&
        message.member.roles.cache.some(r => r.name.includes('D-Rank'))) {

        const role = message.guild.roles.cache.find(
            r => r.name === '🗡️ C-Rank Hunter'
        );

        if (role && !message.member.roles.cache.has(role.id)) {

            await message.member.roles.add(role);

            if (levelChannel) {
                levelChannel.send(
`🌑 **${message.author} has awakened as a 🗡️ C-Rank Hunter.**

⚔️ **A powerful presence has emerged within the Association.**`
                );
            }
        }
    }
});

client.login(process.env.TOKEN);
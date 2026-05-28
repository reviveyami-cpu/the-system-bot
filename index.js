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

// =========================
// SETTINGS
// =========================

const BOT_COMMAND_CHANNEL = '1508955661667537097';
const HUNTER_RANK_CHANNEL = '1509120285457252384';

// XP cooldown
const cooldowns = new Map();

client.once('clientReady', () => {

    console.log(`🌑 The System is online as ${client.user.tag}`);

    updateHunterRanks();

    // UPDATE EVERY 2 HOURS
    setInterval(updateHunterRanks, 7200000);
});


// =========================
// HUNTER RANK LIST SYSTEM
// =========================

async function updateHunterRanks() {

    const guilds = client.guilds.cache;

    guilds.forEach(async guild => {

        const channel = guild.channels.cache.get(HUNTER_RANK_CHANNEL);

        if (!channel) return;

        const members = await guild.members.fetch();

        const ranks = [
            'Eternal Kage',
            'Shadow Monarch',
            'S-Rank',
            'A-Rank',
            'B-Rank',
            'C-Rank'
        ];

        let output =
`# 🌑 Hunter Association Rankings

**The System has updated the hunter registry.**

━━━━━━━━━━━━━━━
`;

        for (const rankName of ranks) {

            const rankedMembers = members.filter(member =>
                member.roles.cache.some(role =>
                    role.name.includes(rankName)
                )
            );

            if (rankedMembers.size > 0) {

                output += `\n## ⚔️ ${rankName}\n`;

                rankedMembers.forEach(member => {
                    output += `• ${member.user.username}\n`;
                });
            }
        }

        output += `\n━━━━━━━━━━━━━━━
🌑 **Next update in 2 hours.**`;

        // DELETE OLD BOT MESSAGES
        const messages = await channel.messages.fetch({ limit: 20 });

        const botMessages = messages.filter(
            m => m.author.id === client.user.id
        );

        await channel.bulkDelete(botMessages, true).catch(() => {});

        // SEND NEW RANK LIST
        channel.send(output);
    });
}


// =========================
// MEMBER JOIN
// =========================

client.on('guildMemberAdd', async member => {

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

    const channel = member.guild.channels.cache.find(
        c => c.name.includes('welcome')
    );

    if (channel) {

        channel.send(
`⚔️ **A new hunter has entered the gates.**

Welcome ${member}.

🌑 **The System recognizes your arrival.**

https://tenor.com/view/solo-leveling-我獨自升級-s2-gif-1128383619595271984`
        );
    }
});


// =========================
// MESSAGE SYSTEM
// =========================

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
                message.delete().catch(() => {});
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
                message.delete().catch(() => {});
                warning.delete().catch(() => {});
            }, 3000);
        }

        return;
    }


    // =========================
    // LOCK COMMAND
    // =========================

    if (message.content.toLowerCase() === '!lock') {

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

        await message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                SendMessages: false
            }
        );

        await message.channel.send(
`🔒 **This channel has been locked by The System.**`
        );

        setTimeout(() => {
            message.delete().catch(() => {});
        }, 1000);

        return;
    }


    // =========================
    // UNLOCK COMMAND
    // =========================

    if (message.content.toLowerCase() === '!unlock') {

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

        await message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                SendMessages: null
            }
        );

        await message.channel.send(
`🔓 **This channel has been unlocked by The System.**`
        );

        setTimeout(() => {
            message.delete().catch(() => {});
        }, 1000);

        return;
    }


    // =========================
    // XP SYSTEM
    // =========================

    const levelChannel = message.guild.channels.cache.find(
        c => c.name.includes('level-up')
    );

    const userId = message.author.id;

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

    let xp = await db.get(`xp_${userId}`) || 0;

    // =========================
    // RANK DETECTION
    // =========================

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

    // =========================
    // NEXT RANK
    // =========================

    let nextRank = '🏹 D-Rank Hunter';
    let nextXP = 250;

    if (xp >= 250) {
        nextRank = '🗡️ C-Rank Hunter';
        nextXP = 800;
    }

    if (xp >= 800) {
        nextRank = '🌑 Awakened Hunter';
        nextXP = null;
    }


    // =========================
    // LEVEL COMMAND
    // =========================

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

        const awakened = message.member.roles.cache.some(
            r => r.name.includes('Awakened')
        );

        let remainingXP = nextXP ? nextXP - xp : 0;

        return message.reply(
`🌑 **Hunter Level Information**

⚔️ **Current XP:** ${xp}

🏆 **Current Rank:** ${currentRank}

${awakened
? '🌑 **Status:** Awakened Hunter'
: `🔥 **XP Until ${nextRank}:** ${remainingXP}`}`
        );
    }


    // =========================
    // RANK COMMAND
    // =========================

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


    // =========================
    // ADD XP
    // =========================

    xp += 5;

    await db.set(`xp_${userId}`, xp);


    // =========================
    // D-RANK PROMOTION
    // =========================

    if (
        xp >= 250 &&
        message.member.roles.cache.some(r => r.name.includes('E-Rank'))
    ) {

        const oldRole = message.guild.roles.cache.find(
            r => r.name === '🔰 E-Rank Hunter'
        );

        const newRole = message.guild.roles.cache.find(
            r => r.name === '🏹 D-Rank Hunter'
        );

        if (newRole && !message.member.roles.cache.has(newRole.id)) {

            if (oldRole) {
                await message.member.roles.remove(oldRole);
            }

            await message.member.roles.add(newRole);

            if (levelChannel) {

                levelChannel.send(
`📈 **${message.author} has advanced to 🏹 D-Rank Hunter.**

🌑 **The System acknowledges your growth.**`
                );
            }
        }
    }


    // =========================
    // C-RANK PROMOTION
    // =========================

    if (
        xp >= 800 &&
        message.member.roles.cache.some(r => r.name.includes('D-Rank'))
    ) {

        const oldRole = message.guild.roles.cache.find(
            r => r.name === '🏹 D-Rank Hunter'
        );

        const cRankRole = message.guild.roles.cache.find(
            r => r.name === '🗡️ C-Rank Hunter'
        );

        const awakenedRole = message.guild.roles.cache.find(
            r => r.name.includes('Awakened')
        );

        if (cRankRole && !message.member.roles.cache.has(cRankRole.id)) {

            if (oldRole) {
                await message.member.roles.remove(oldRole);
            }

            await message.member.roles.add(cRankRole);

            if (awakenedRole) {
                await message.member.roles.add(awakenedRole);
            }

            if (levelChannel) {

                levelChannel.send(
`# 🌑 AWAKENING DETECTED

⚔️ ${message.author} has awakened as a 🗡️ C-Rank Hunter.

🌑 **The System recognizes a newly Awakened Hunter.**

https://tenor.com/view/dragon-ball-dragon-ball-super-goku-goku-ultra-instinct-ui-gif-10017138207648182009`
                );
            }
        }
    }
});

client.login(process.env.TOKEN);
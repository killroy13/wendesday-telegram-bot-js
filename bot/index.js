const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');

const token = process.env.BOT_TOKEN;

const bot_username = '@WednesdayLinkBot';

const options = {
    polling: true,
    webHook: {
      port: process.env.PORT
    }
};

let bot;
if (process.env.NODE_ENV === 'production') {
    const url = process.env.HEROKU_URL || 'https://wednesday-telegram-bot.herokuapp.com:443';
    const bot = new TelegramBot(token, options);

    bot.setWebHook(`${url}/bot${token}`);
 } else {
    bot = new TelegramBot(token,
        {
            polling: true
        }
    );
 }

const DAY = 3;
const TIME = 16;

const DEFAULT_TIME_INTERVAL = 3600000;
const WEEK_INTERVAL = 604800000;

const successMessage = 'Done.';
const annoyingQuestion = 'Is this annoying? \n';
const annoyingAnswer = 'Don\'t talk with me!';
const notAdminMessage = 'You are not an Admin. Go to hell!'
const errMessage = "Sorry there's something wrong with the server\nPlease try again!";
const helpMessage = `
                    Welcome at <b>WednesdayBot</b>, thank you for using  me!

                    Available commands:
                    /start - start bot
                    /help - to see available commands
                    /play - to roll the dice
                    /register - not work for now
                    /stop - stop bot

                    To talk with me please type /your_message + mention me through @***
`;

let users = [];
const startedIntervalsByChatIds = new Map();

// Bot commands
let botCommands = {
    start: '/start',
    register: '/register',
    play: '/play',
    stop: '/stop',
    help: '/help'
}

const URLs = [
    'https://www.youtube.com/watch?v=Oct2xKMGOno',
    'https://www.youtube.com/watch?v=PAnKl7862qc',
    'https://www.youtube.com/watch?v=1CH-7qjz4D4',
    'https://www.youtube.com/watch?v=PE8GlPpuLuY',
    'https://www.youtube.com/watch?v=IR0QUwGmo4A',
    'https://www.youtube.com/watch?v=zHpFuOlPrlQ',
    'https://www.youtube.com/watch?v=OzQ-KvxLVT0',
    'https://www.youtube.com/watch?v=csqJK8wwaHw',
    'https://www.youtube.com/watch?v=csqJK8wwaHw',
    'https://www.youtube.com/watch?v=KSwnFzlPEuY',
    'https://www.youtube.com/watch?v=aew9WTLqjDc',
    'https://www.youtube.com/watch?v=DREDJ4fkz-g',
    'https://www.youtube.com/watch?v=JHO61_wDC30',
    'https://www.youtube.com/watch?v=meuYC7FP7HU',
    'https://www.youtube.com/watch?v=Xf_wuAQ-t44',
    'https://www.youtube.com/watch?v=oVxFk_IIB2o',
    'https://www.youtube.com/watch?v=VaPMUACYWww',
    'https://www.youtube.com/watch?v=VfaNCw2bF48',
    'https://www.youtube.com/watch?v=gxm5SwfkwcI',
    'https://www.youtube.com/watch?v=zvf9efaaL80',
    'https://www.youtube.com/watch?v=szqNmefKXxc',
    'https://www.youtube.com/watch?v=036ItQLi-sQ',
    'https://www.youtube.com/watch?v=YSDAAh6Lps4',
    'https://www.youtube.com/watch?v=n-YCN4NpGS4',
    'https://www.youtube.com/watch?v=9K4-jllrPrE',
    'https://www.youtube.com/watch?v=l3Gl7uHREmw',
    'https://www.youtube.com/watch?v=gfj6gXGj7DU'
];

/* info message */
console.log('info', 'wednesday_bot - ', 'Started!');


/**
 * Handle chatting
 */
bot.on('message', async (data) => {
    const user = await getUserInfo(data.chat.id, data.from.id);

    const chatId = data.chat.id;
    const isPrivateType = data.chat.type === 'private';
    let sendAnswer = false;
    let talkedWithBot = false;
    let answer;
    let command;

    if (!data.from.is_bot) {
        if(isPrivateType) {
            command = data.text.replace('/', '');
            talkedWithBot = true;
        } else {
            if (data) {
                if (data.text) {
                    if (data.text.includes(bot_username)) {
                        command = data.text.replace('/', '').replace(bot_username, '');
                        talkedWithBot = true;
                    }
                }
            }
        }

        /* bot command handlers */
        if(botCommands[command] !== undefined) {
            if (botCommands['start'] === '/' + command) {
                handleStart(chatId);
            } else if (botCommands['help'] === '/' + command) {
                handleHelp(chatId);
            } else if (botCommands['register'] === '/' + command) {
                handleRegister(chatId);
            } else if (botCommands['stop'] === '/' + command) {
                sendAnswer = true;
                if ((user.status === 'creator' || user.status === 'administrator') || isPrivateType) {
                    handleStop(chatId);
                    answer = successMessage;
                } else {
                    answer = notAdminMessage;
                }
            } else if (botCommands['play'] === '/' + command) {
                handlePlay(chatId);
            }
        } else {
            /* send answ if talked with bot */
            if (talkedWithBot) {
                sendAnswer = true;
                answer = annoyingAnswer + ' @' + data.from.username;
            }
        }

        if(sendAnswer) {
            sendMessage(chatId, answer);
        }
    }
});

/**
 * Handle /start
 */
function handleStart(chatId) {
    startSendingWednesdayMessage(chatId, DEFAULT_TIME_INTERVAL);
    bot.sendMessage(chatId,
        `
            Welcome at <b>WednesdayBot</b>, thank you for using  me!

        `, {
            parse_mode: 'HTML',
        }
    );
}

/**
 * Handle /register
 */
function handleRegister(chatId) {
  users.push(chatId);
  bot
    .sendMessage(chatId, successMessage)
    .catch((error) => {
        console.log(errMessage);
        console.log(error.code);
        console.log(error.response.body);
  });
}

/**
 * Handle /play
 */
function handlePlay(chatId) {
    bot.sendDice(chatId);
}

/**
 * Handle /help
 */
function handleHelp(chatId) {
    bot.sendMessage(chatId,
        helpMessage, {
            parse_mode: 'HTML',
        }
    );
}

function handleStop(chatId) {
    stopMessageSending(chatId);
}

function startSendingWednesdayMessage(chatId, timeInterval) {
    let startInterval = setInterval(sendWednesdayMessage, timeInterval, chatId);
    startedIntervalsByChatIds.set(chatId, startInterval);
}

function stopMessageSending(chatId) {
    clearInterval(startedIntervalsByChatIds.get(chatId));
}

function sendWednesdayMessage(chatId) {
    if (checkDay(DAY, TIME)) {
        /* default time period used first time and after should be recalculated */
        if (startedIntervalsByChatIds.get(chatId)._idleTimeout === DEFAULT_TIME_INTERVAL) {
            recalculateInterval(chatId);
        }
        sendMessage(chatId, annoyingQuestion + URLs[getRandomInt(URLs.length)]);
    }
}

function checkDay(day, time) {
    let date = new Date();
    if (date.getDay() === day && date.getHours() === time) {
        return true;
    } else {
        return false;
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getUserInfo(chatId, userId) {
    const user = bot.getChatMember(chatId, userId);
    return user;
}

function sendMessage(chatId, message) {
    bot
        .sendMessage(chatId, message)
        .catch((error) => {
            console.log(errMessage);
            console.log(error.code);
            console.log(error.response.body);
        });
}

/* recalculate default timeout. Set period once per week */
function recalculateInterval(chatId) {
    stopMessageSending(chatId);
    startSendingWednesdayMessage(chatId, WEEK_INTERVAL);
}

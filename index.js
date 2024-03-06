const sequelize = require('./db');
const UserModel = require('./models');
const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const token = '7073142836:AAFFAOI5xi4nvED2JRLZOSTBA_GLSmq4FfU'

const bot = new TelegramApi(token, {polling: true})
//аналог бд
const bd = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Сейчас я загадаю цифру от 0 до 9, а ты должен ее угадать!`);
    const randomNumber = Math.floor(Math.random() * 10)
    bd[chatId] = randomNumber;
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions);
}

const start = async () => {

    try {
        await sequelize.authenticate()
        //синхронизация моделей в коде с таблицами в БД
        await sequelize.sync()
    } catch (e) {
        console.log("Подключение к БД сломалось ", e)
    }

    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Получить информацию о пользователе'},
        {command: '/game', description: 'Игра угадай цифру'},
    ])

    //вешаем слушатель событий на обработку полученных сообщений
    bot.on("message", async (msg) => {
        console.log(msg)
        const text = msg.text
        const chatId = msg.chat.id

        try {
            if (text === "/start") {
                //создаеи запись в бд с рпользователем как только он зашел
                await UserModel.create({chatId})
                await bot.sendSticker(chatId, "https://tlgrm.eu/_/stickers/3d2/135/3d213551-8cac-45b4-bdf3-e24a81b50526/7.webp")
                return bot.sendMessage(chatId, "Добро подаловать в бот Виолетты")
            }
            if (text === "/info") {
                //находим запись в бд достаем нужные поля
                const user = await UserModel.findOne({chatId})
                return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}, 
                    в игре у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`);
            }
            if (text === "/game") {
                return startGame(chatId)
            } 
            return bot.sendMessage(chatId, "я тебя  не понимаю, попробуй еще раз!")
        } catch (e) {
            return bot.sendMessage(chatId, 'Произошла какая то ошибочка!)');
        }  

    }) 
    bot.on("callback_query", async msg => {
        const data = msg.data
        const chatId = msg.message.chat.id
        if (data === "/again") {
            return startGame(chatId)
        }

        const user = await UserModel.findOne({chatId})
        
        if (data == bd[chatId]) {
            user.right += 1;
            return await bot.sendMessage(chatId, "Угадал!", againOptions)
        } else {
            user.wrong += 1;
            bot.sendMessage(chatId, `Не угадал!(( бот загадал цифру ${bd[chatId]}`, againOptions)
        }

    })
}


start()
const TelegramBot = require('node-telegram-bot-api')
const cron = require('node-cron')
const request = require('request')

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_API

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true})

const users = {}

// Fetches GENM stock
const url = `https://query.yahooapis.com/v1/public/yql?q=select * from yahoo.finance.quotes where symbol in ('4715.kl')&format=json&env=store://datatables.org/alltableswithkeys&callback=`

// Runs every weekday (Monday through Friday) at 09:15:00 AM.
// It does not run on Saturday or Sunday
// 15 9 * * 1-5

var isRunning = true
const job = cron.schedule('0 15 9,17 * * 1-5', function () {
  Object.keys(users).map((user) => {
    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const json = JSON.parse(body)
        const lastTradePriceOnly = json.query.results.quote.LastTradePriceOnly
        const lastTradeTime = json.query.results.quote.LastTradeTime
        bot.sendMessage(user, `This is GENM last price: ${lastTradePriceOnly}. Last updated ${lastTradeTime}`)
      } else {
        bot.sendMessage(user, 'Unable to get the quote you want :(')
      }
    })
  })
}, true)
// , 'Asia/Kuala_Lumpur'

// Matches "/start"
// Start the cron job
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  if (!isRunning) {
    // Already running
    job.start()
    isRunning = true
  }
  users[chatId] = true
  bot.sendMessage(chatId, "We'll update you at 9:15 AM and 5:15 PM daily! :)")
})

// Matches "/stop"
// Start the cron job
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id
  if (isRunning) {
    job.stop()
    isRunning = false
  }
  delete users[chatId]
  bot.sendMessage(chatId, "We'll stop notifying you. Type /start if you want notifications")
})

// Matches "/status"
// Tells if a job is running
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, isRunning ? "We'll notify you when there's something new" : 'Notification is off. To turn on notifications, type /start')
})


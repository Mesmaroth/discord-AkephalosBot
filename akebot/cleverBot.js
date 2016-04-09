var cleverbot = require('cleverbot.io');
var clBot = new cleverbot("YOUR_API_USER", "YOUR_API_KEY"); 


module.exports.askBot = function (bot, message, channelID){
    clBot.setNick("AkeSession");
    var message = message.slice(5);    
    clBot.create(function (err, session){
        clBot.ask(message, function (error, response){
            bot.sendMessage({
                to: channelID,
                message: response
            });
        });
    });
}
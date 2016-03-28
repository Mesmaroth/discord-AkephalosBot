var cleverbot = require('cleverbot.io');
var clBot = new cleverbot("HE3vJbjtX7eH55pz", "ApPtaxIECdDOz3ZHH9wvCkRg5DHasXqE");


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
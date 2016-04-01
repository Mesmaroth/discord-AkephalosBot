var twitchClient = require('node-twitchtv');
var account = require('./account.json')
var client = new twitchClient(account);
var fs = require('fs');


module.exports.checkTwitchUser = function (searchUser, channelID, bot){
    client.streams({channel: searchUser}, function (error, user) {
        if(error) throw error;
        if(user.stream !== null){
            bot.sendMessage({
                to: channelID,
                message: "**Twitch**\n**User**: "+ user.stream.channel.name + "\n**Status**: `Online`\n**Game**: "+ user.stream.game+"\n**Url**: "+user.stream.channel.url
            });
        }
        else if(user.stream === null) {
            bot.sendMessage({
                to: channelID,
                message: "**Twitch**\n**User**: "+ searchUser + "\n**Status**: `Offline`"
            });
        }
    });
}

function getStreamers (username, callback) {
    client.streams({channel: username}, function (error, user){
        if(error) throw error;
        if(user.stream != null){
            callback(user.stream.channel.name, user.stream.game, user.stream.channel.url);
        }
    })
}

module.exports.searchTwitch = function (bot, channelID){
    var streamers = fs.readFileSync('./twitch/twitchUserList.txt', 'utf8').split('\n');
    bot.sendMessage({
        to: channelID,
        message: "**Twitch Status - BETA**"
    });
    var tick = 0;
    for(var i = 0; i < streamers.length; i++){
        getStreamers(streamers[i], function(tName, tGame, tUrl){
            bot.sendMessage({
                to: channelID,
                message: "**Twitch**\n**User**: "+ tName + "\n**Status**: `Online`\n**Game**: "+ tGame+"\n**Url**: <" + tUrl+">"
            })
        });
    }
    
}
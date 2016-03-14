var twitchClient = require('node-twitchtv');
var account = require('./account.json')
var client = new twitchClient(account);
var fs = require('fs');



module.exports.checkTwitchUser = function (searchUser, channelID, bot){
    client.streams({channel: searchUser}, function (err, user) {
        if(user.stream !== null){
            bot.sendMessage({
                to: channelID,
                message: "User **" + searchUser + "** is `Online`\n" + user.stream.channel.url
            });
        }
        else if(user.stream === null) {
            bot.sendMessage({
                to: channelID,
                message: "User is offline"
            });
        }
    });
}

module.exports.searchTwitch = function (bot){
    var arr = fs.readFileSync('./twitch-test/twitch-userList.txt', 'utf8').split('\n');
    var channelID = "128707001986449409";
    var userName = "";
    bot.sendMessage({
        to: channelID,
        message: "**Still working on this!**"
    });

    for(var i = 0; i < arr.length; i++){
        userName = arr[i];
        console.log(i);
        console.log(userName);       
        client.streams({channel: userName}, function (err, user) {
            if(user.stream !== null){
                bot.sendMessage({
                    to: channelID,
                    message: "User **" + userName + "** is `Online`\n" + user.stream.channel.url
                });
            }
            /*else if (user.stream === null){
                bot.sendMessage({
                    to: channelID,
                    message: "User **" + userName + "** is not streaming"
                });
            }*/

            if(err){
                bot.sendMessage({
                    to: channelID,
                    message: err
                });
            }
        });

    }
}
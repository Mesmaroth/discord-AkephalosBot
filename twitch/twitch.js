var twitchClient = require('node-twitchtv');
var client = new twitchClient('{"client_id" : "CLIENT_ID"}'); // Not required leave as is, it should still work


module.exports.checkStream = function (searchUser, callback){     // Checks to see if the stream is live
    client.streams({channel: searchUser}, function (error, userStream) {
        if(error) return console.log(error);
        if(userStream.stream !== null){
            callback(true, userStream.stream.channel.name, userStream.stream.game, userStream.stream.channel.url);
        }
        else if(userStream.stream === null){
            callback(false);
        }
    });
}
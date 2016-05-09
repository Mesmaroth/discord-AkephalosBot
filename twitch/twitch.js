var twitchClient = require('node-twitchtv');
var client = new twitchClient('{"client_id" : "CLIENT_ID"}'); // Not required leave as is, it should still work


module.exports.checkStream = function (searchUser, callback){     // Checks to see if the stream is live
    client.streams({channel: searchUser}, function (error, user) {
        if(error) return console.log(error);
        callback(user);
    });
}
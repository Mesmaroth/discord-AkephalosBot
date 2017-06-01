var request = require('request');
var twitchClientID = require('../config/botlogin.js').twitchClientID;

module.exports.getTwitchStream = function(user, callback){
    request('https://api.twitch.tv/kraken/streams/' + user + "?client_id=" + twitchClientID, function(error, response, body){    	
		if(error || response.statusCode !== 200){
			if(!error) var error = response.statusCode;
			return callback(error);
		}
		body = JSON.parse(body);
		if(body.stream != null){
			return callback(null, true, body.stream.game, body.stream.channel.url, body.stream.channel.logo);
		} else{
			return callback(null, false);
		}
	});
}
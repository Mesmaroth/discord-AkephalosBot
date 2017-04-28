var request = require('request');
var twitchClientID = require('../config/botlogin.js').twitchClientID;

function getHitBoxStatus(user, callback){
	request('https://api.hitbox.tv/user/' + user, function(error, response, body){		
		if(error || response.statusCode !== 200){
			return callback(error);
		}
		body = JSON.parse(body);
		if(body.is_live == 1){
			return callback(null, true, 'http://edge.sf.hitbox.tv/' + body.user_logo);
		}
		else{
			return callback(null, false);
		}
	});
}

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

module.exports.getHitboxStream = function(user, callback){
	getHitBoxStatus(user, function(error, status, user_logo){
		if(error) return callback(error);
    	if(status){
    		request('https://api.hitbox.tv/media/live/' + user, function(error, response, body){    			
				if(error || response.statusCode !== 200){
					return callback(error);
				}
				body = JSON.parse(body);
				return callback(null, true, body.livestream[0].category_name, "http://www.hitbox.tv/" + user, user_logo);				
			});
    	} else {
    		return callback(null, false);
    	}    		    	
    });
}
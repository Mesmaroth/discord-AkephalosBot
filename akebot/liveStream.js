var request = require('request');

// Check if Hitbox user is live
function getHitBoxStatus(user, callback){
	request('https://api.hitbox.tv/user/' + user, function(error, response, body){		
		if(error || response.statusCode !== 200){
			return callback(error);
		}
		body = JSON.parse(body);
		if(body.is_live == 1){
			return callback(null, true);
		}
		else{
			return callback(null, false);
		}
	});
}

module.exports.getTwitchStream = function(user, callback){     // Checks to see if the stream is live
    request('https://api.twitch.tv/kraken/streams/' + user, function(error, response, body){		
		if(error || response.statusCode !== 200){
			return callback(error);			
		}
		body = JSON.parse(body);
		if(body.stream != null){
			return callback(null, true, body.stream.game, body.stream.channel.url);				
		} else{
			return callback(null, false);
		}
	});
}

module.exports.getHitboxStream = function(user, callback){
	getHitBoxStatus(user, function(error, status){
		if(error) return callback(error);
    	if(status){
    		request('https://api.hitbox.tv/media/live/' + user, function(error, response, body){    			
				if(error || response.statusCode !== 200){
					return callback(error);
				}
				body = JSON.parse(body);
				return callback(null, true, body.livestream[0].category_name, "http://www.hitbox.tv/" + user);				
			});
    	} else {
    		return callback(null, false);
    	}    		    	
    });
}
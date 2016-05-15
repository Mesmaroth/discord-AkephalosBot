var request = require('request');

// Check if Hitbox user is live
function getHitBoxStream(searchUser, callback){
	request('https://api.hitbox.tv/user/' + searchUser, function(error, response, body){
		body = JSON.parse(body);
		if(!error && response.statusCode == 200){
			if(body.is_live == 1){
				callback(true);
			}
			else{
				callback(false);
			}
		}
	});
}

module.exports.getStreamStatus = function (searchUser, callback){     // Checks to see if the stream is live
    request('https://api.twitch.tv/kraken/streams/'+searchUser, function(error, response, body){
		body = JSON.parse(body);
		if(!error && response.statusCode == 200){
			if(body.stream != null){
				callback(true, "Twitch", body.stream.channel.name, body.stream.game, body.stream.channel.url);
				return;
			}
			else{
				callback(false)
			};
		}
	});

    getHitBoxStream(searchUser, function(status){
    	if(status){
    		// Get Live Info
    		request('https://api.hitbox.tv/media/live/' + searchUser, function(error, response, body){
    			body = JSON.parse(body);
				if(!error && response.statusCode == 200){
					callback(true, "HitBox", body.livestream[0].media_user_name, body.livestream[0].category_name, "http://www.hitbox.tv/"+searchUser);
					return;
				}
				else{
					callback(false);
				}
			});
    	}	    	
    });

    
}
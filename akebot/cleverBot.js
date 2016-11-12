module.exports = function (input, callback){
	var cleverbot = require('cleverbot.io');
	var botLogin = require("./botLogin.js");
	var cBot = new cleverbot(botLogin.cleverBot_API_User, botLogin.cleverBot_API_Key);
	
	cBot.create(function (error){
	    if(error) return callback(error);
	    cBot.ask(input, function (error, response){
		    if(error) return callback(error);
		    return callback(null, response);
	    });
	});
}
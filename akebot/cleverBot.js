var cleverbot = require('cleverbot.io');
var botLogin = require("./botLogin.js");
var cBot = new cleverbot(botLogin.cleverBot_API_User, botLogin.cleverBot_API_Key, "AkeSession");

module.exports = function (request, callback){	
	cBot.create(function (error, session){
	    if(error) return callback(error);
	    cBot.ask(request, function (error, response){
		    if(error) return callback(error);
		    return callback(null, response);
	    });
	});
}
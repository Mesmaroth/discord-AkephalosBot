const Discord = require('discord.js');
const botLogin = require('./config/botlogin.js');
const bot = new Discord.Client();
bot.login(botLogin.token);

const adminRole = "admin";
const defaultStatus = botVersion + " | " + CMDINT + "help";

var botVersion = "?#";
var CMDINT = "?";

try{
	botVersion = require('./package.json').version;
} catch(error){
	if(error) {
		console.log("------- ERROR --------");
		console.log(error);
		console.log("----------------------");
	}
}

// Checks if the message is a command input from the user
function isCommand(message, command){
	var init = message.slice(0, 1);
	var cmd = (message.indexOf(' ') !== -1) ? message.slice(1, message.indexOf(' ')) : message.slice(1);

	if(init === CMDINT && cmd.toLowerCase() === command.toLowerCase())
		return true
	else 
		return false;
}

// Checks for a specific role the user is in to run admin commands
function isDev(message){
	var roles = message.member.roles.array();
	for(var role = 0; role < roles.length; role++){
		if(roles[role].name.toLowerCase() === adminRole)			
			return true;
	}
	message.channel.sendMessage("You aren't admin for this command.");
	return false;
}

// Sets the game the bot is "playing"
function setGame(game){
	bot.user.setGame(game);
}

bot.on('ready', () => {
	console.log("AkeBot v" + botVersion);

	setGame(defaultStatus);
});

bot.on('message', message => {
	var content = message.content;

	if(isCommand(content, 'exit') && isDev(message)){
		bot.destroy();
	}

  	if(isCommand(content, 'help')){
  		message.channel.sendMessage("**In progress!**");
  	}

});

bot.on('disconnect', message =>{
	process.exit(0);
});


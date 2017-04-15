const Discord = require('discord.js');
const botLogin = require('./config/botlogin.js');
const bot = new Discord.Client();
bot.login(botLogin.token);

const adminRole = "admin";

var botVersion = "?#";
try{
	botVersion = require('./package.json').version;
} catch(error){
	if(error) {
		console.log("------- ERROR --------");
		console.log(error);
		console.log("----------------------");
	}
}
var CMDINT = "?";
var defaultStatus = botVersion + " | " + CMDINT + "help";



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
function isAdmin(message){
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

function getChannelByName(guild, channelName){
	return guild.channels.filterArray( channel => {
		if(channel.name === channelName)
			return channel;
	})[0];
}

function botLog(message){
	console.log("DISCORD: " + message);
}

function sendError(title, error, channel){
	console.log("-----"  + "ERROR"+ "------");
	console.log(error);
	console.log("----------");
	channel.sendMessage("**" + title + " Error**\n```" + error.message +"```");
}

function displayServers(){
	var guilds = bot.guilds.array();
	var servers = [];

	for(var i = 0; i < guilds.length; i++){
		servers.push(guilds[i].name);
	}

	return "Servers:\n " + servers.join(", ") + "\n";
}	

bot.on('ready', () => {
	console.log("AkeBot v" + botVersion);
	console.log(displayServers());

	setGame(defaultStatus);
});

bot.on('disconnect', event =>{
	console.log("Exited with code: " + event.code);
	if(event.message)
		console.log("Message: " + event.message);

	process.exit(0);
});

bot.on('guildMemberAdd', guildMember =>{
	var generalChannel = getChannelByName(guildMember.guild, 'general');

	generalChannel.sendMessage(guildMember.user.username +" Welcome to " + guildMember.guild.name);	
	botLog(guildMember.guild.name + " welcomes " + guildMember.user.username + " to their server.");
});

bot.on('message', message => {
	const msgContent = message.content;
	const msgChannel = message.channel;

	// Admin commands

	if(isCommand(msgContent, 'exit') && isAdmin(message)){
		bot.destroy();
	}

	// GENERAL commands

  	if(isCommand(msgContent, 'help')){
  		message.channel.sendMessage("**In progress!**");
  	}

});
const Discord = require('discord.js');
const botLogin = require('./config/botlogin.js');
const liveStream = require('./modules/livestream.js');
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
var CMDINT = "!";
var defaultStatus = "v"+botVersion + " | " + CMDINT + "help";

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

	return "Servers:\n " + servers.join("\n") + "\n";
}

//	Credit: https://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript#1303650
function isNumber(obj) {	
	return !isNaN(parseFloat(obj))
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

bot.on('presenceUpdate', (oldGuildMember, newGuildMember) =>{
	var generalChannel = getChannelByName(newGuildMember.guild, 'general');
	if(newGuildMember.presence.game !== null){
		if(newGuildMember.presence.game.streaming){
			generalChannel.sendMessage("**LIVE**\n" +
				newGuildMember.user.username + " is now streaming!\n**Title:** " + newGuildMember.presence.game.name +
				"\n**URL:** " + newGuildMember.presence.game.url);
		}
	}		
});

bot.on('message', message => {
	const mContent = message.content;
	const mChannel = message.channel;

	// Admin commands

	if(isCommand(mContent, 'exit') && isAdmin(message)){
		bot.destroy();
	}

	if(isCommand(mContent, 'setgame') && isAdmin(message)){
		if(mContent.indexOf('') !== -1){
			var game = mContent.slice(mContent.indexOf(' ') + 1);
			setGame(game);
			botLog("Game set to: " + game);
		}
	}

	// GENERAL commands

  	if(isCommand(mContent, 'help')){
  		message.channel.sendMessage("**Help**\nIn progress!");
  	}

  	if(isCommand(mContent, 'about')){
  		var content = "**About**\n" + "**Bot Version:** Akephalos Bot v" + botVersion +
  			"\n**Bot Username:** " + bot.user.username +
  			"\n**Servers Connected:** `" + bot.guilds.array().length + "`" +
  			"\n**Author:** Mesmaroth" +
  			"\n**Library:** Discord.js" +  			
  			"\n**Source:** <https://github.com/Mesmaroth/discord-AkephalosBot>"

  		message.channel.sendFile( bot.user.displayAvatarURL, 'botAvatar.jpg', content);
  	}

  	if(isCommand(message.content, 'source')){
  		message.channel.sendMessage("**Source:** https://github.com/Mesmaroth/discord-AkephalosBot");
  	}

  	if(isCommand(mContent, 'invite')){
  		bot.generateInvite().then( link =>{
  			mChannel.sendMessage("**Invite:** " + link);
  		});
  	}

  	if(isCommand(mContent, 'uptime')){
  		var uptimeSeconds = 0, uptimeMinutes = 0, uptimeHours = 0;

  		uptimeSeconds = Math.floor(bot.uptime/1000);
		
		if(uptimeSeconds > 60){
			uptimeMinutes = Math.floor(uptimeSeconds/60);
			uptimeSeconds = Math.floor(uptimeSeconds % 60);
		}

		if(uptimeMinutes > 60){
			uptimeHours = Math.floor(uptimeMinutes / 60);
			uptimeMinutes = Math.floor(uptimeMinutes % 60);
		}

  		mChannel.sendMessage("**Uptime:** " + uptimeHours + " hour(s) : " + uptimeMinutes + " minute(s) : " + uptimeSeconds +" second(s)");
  	}

  	if(isCommand(mContent, 'twitch')){
  		if(mContent.indexOf(' ') !== -1){
  			var name = mContent.split(' ')[1];

  			liveStream.getTwitchStream(name, (error, status, gameTitle, streamURL)=> {
  				if(error) return sendError("Getting Twitch Stream Data", error, mChannel);
  				if(status){
  					mChannel.sendMessage(
  					"**Twitch**\n**Name:** " + name +
  					"\n**Status:** `Online`\n**Game:** " + gameTitle +
  					"\n**URL:** " + streamURL);  	
  				} else{
  					mChannel.sendMessage(
  						"**Twitch**\n**Name:** " + name +
  						"\n**Status:** `Offline`");
  				}		
  			});
  		}
  	}

  	if(isCommand(mContent, 'hitbox')){
  		if(mContent.indexOf(' ')!== -1){
  			var name = mContent.split(' ')[1];

  			liveStream.getHitboxStream(name, (error, status, gameTitle, streamURL) =>{
  				if(error) return sendError("Getting HitBox Stream Data", error, mChannel);
  				if(status){
  					mChannel.sendMessage(
  					"**HitBox**\n**Name:**" + name +
  					"\n**Status:** `Online`\n**Game:** " + gameTitle +
  					"\n**URL:** " + streamURL);
  				} else{
  					mChannel.sendMessage(
  					"**HitBox**\n**Name:**" + name +
  					"\n**Status:** `Offline`");
  				}
  			});
  		}
  	}
});
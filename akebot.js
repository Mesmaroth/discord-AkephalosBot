const Discord = require('discord.js');
const botLogin = require('./config/botlogin.js');
const liveStream = require('./modules/livestream.js');
const fs = require('fs');
const request = require('request');
const bot = new Discord.Client();
bot.login(botLogin.token);

const adminRole = "admin";

var botVersion = "?#";
try{
	botVersion = require('./package.json').version;

	var notifyChannel = {}
	if((fs.existsSync('./config/notifychannels.json'))){
		notifyChannel = fs.readFileSync('./config/notifychannels.json');
		notifyChannel = JSON.parse(notifyChannel);
		
	}else{
		fs.writeFileSync('./config/notifychannels.json', "{}");
		notifyChannel = fs.readFileSync('./config/notifychannels.json');
		notifyChannel = JSON.parse(notifyChannel);
	}
	
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
	var channel = guild.channels.filterArray( channel => {
		if(channel.name === channelName)
			return channel;
	})[0];

	if(channel)
		return channel
	else
		return null;
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

	return "Servers:\n" + servers.join("\n") + "\n";
}

function fileExist(path, data){
	if(!(fs.existsSync(path))){
		fs.writeFileSync(path, data);
		console.log("Config file: " + path + " created.");
	}
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

	generalChannel.sendMessage(guildMember.user.username +", welcome to " + guildMember.guild.name);	
	botLog(guildMember.guild.name + " welcomes " + guildMember.user.username + " to their server.");
});

bot.on('presenceUpdate', (oldGuildMember, newGuildMember) =>{
	if(newGuildMember.presence.game !== null){
		var defaultChannel = "general";
		var textChannel = getChannelByName(newGuildMember.guild, defaultChannel);			

		if(!(notifyChannel.hasOwnProperty(newGuildMember.guild.id))){
			notifyChannel[newGuildMember.guild.id] = {
				channel: defaultChannel,
				notify: true
			}			
		}
		
		textChannel = getChannelByName(newGuildMember.guild, notifyChannel[newGuildMember.guild.id].channel);
		if(textChannel === null){
			textChannel = getChannelByName(newGuildMember.guild, defaultChannel);
		}

		if(newGuildMember.presence.game.streaming){
			if(notifyChannel[newGuildMember.guild.id].notify){
				textChannel.sendMessage("**LIVE**\n" +
				newGuildMember.user.username + " is now streaming!\n**Title:** " + newGuildMember.presence.game.name +
				"\n**URL:** " + newGuildMember.presence.game.url);
			}
		}
	}		
});

bot.on('message', message => {
	const mContent = message.content;
	const mChannel = message.channel;
	const mGuild = message.guild;
	const mMember = message.member;

	if(mMember.user.bot) return;

	// Admin commands

	if(isCommand(mContent, 'exit') && isAdmin(message)){
		bot.destroy();
		return;
	}

	if(isCommand(mContent, 'setgame') && isAdmin(message)){
		if(mContent.indexOf('') !== -1){
			var game = mContent.slice(mContent.indexOf(' ') + 1);
			setGame(game);
			botLog("Game set to: " + game);
		}
		return;
	}

	// Sets the preferred channel for live streaming notifications
	if(isCommand(mContent, 'setchannel') && isAdmin(message)){
		var file = './config/notifychannels.json';
		if(mContent.indexOf(' ') !== -1){
			var channel = mContent.split(' ')[1];
			fs.readFile(file, (error, notifyChannel) =>{
				if(error) return sendError("Reading Notify Channels File", error, mChannel);
				try{
					notifyChannel = JSON.parse(notifyChannel);
				}catch(error){
					if(error) return sendError("Parsing Notify Channels File");
				}
				if(getChannelByName(message.guild, channel) !== null){
					if(!(notifyChannel.hasOwnProperty(message.member.guild.id))){
						notifyChannel[message.member.guild.id] = {
							channel: channel,
							notify: true
						}
					} else{
						notifyChannel[message.member.guild.id].channel = channel;
					}


					fs.writeFile(file, JSON.stringify(notifyChannel, null, '\t'), error =>{
						if(error) return sendError("Writing Notify Channels File", error, mChannel);

						mChannel.sendMessage("Channel `" + channel + "` set as default notifications channel");
					});
				}else{
					mChannel.sendMessage("No channel found with that name");
				}
			});
		}
		return;
	}

	// Enables or disables streaming notifcations on a server
	if(isCommand(mContent, 'notify') && isAdmin(message)){
		var file = './config/notifychannels.json';
		fs.readFile(file, (error, notifyChannel) =>{
			if(error) return sendError("Reading Notify Channels File", error, mChannel);
			try{
				notifyChannel = JSON.parse(notifyChannel);
			}catch(error){
				if(error) return sendError("Parsing Notify Channels File", error, mChannel);
			}

			if(!(notifyChannel.hasOwnProperty(message.member.guild.id))){
				notifyChannel[message.member.guild.id] = {
					channel: "general",
					notify: true
				}
			} else{
				if(notifyChannel[message.member.guild.id].notify){
					notifyChannel[message.member.guild.id].notify = false;
				} else{
					notifyChannel[message.member.guild.id].notify = true;
				}
			}

			if(notifyChannel[message.member.guild.id].notify){
				mChannel.sendMessage("Notifications for this server set to `true`");
			} else{
				mChannel.sendMessage("Notifications for this server set to `false`");
			}

			fs.writeFile(file, JSON.stringify(notifyChannel, null, '\t'), error =>{
				if(error) return sendError("Reading Stream Black List File", error, mChannel);			
			});
		});
		return;
	}

	// Deleting messages
	if(isCommand(mContent, 'purge') && isAdmin(message)){
		if(mContent.indexOf(' ') !== -1){
			var param = mContent.split(' ')[1].toLowerCase();
			var param2 = (mContent.split(' ')[2]) ? mContent.split(' ')[2].toLowerCase() : null;

			// If nothing is specified the default is 100
			if(param2){
				if(isNumber(param2))
					param2 = Number(param2) + 1;
			} else{
				param2 = 100;
			}

			if(param === "me")
				param = mMember.user.username.toLowerCase();

			if(param === "bot")
				param = bot.user.username.toLowerCase();

			if(isNumber(param)){
				param = Number(param);
				if(param == 0){
					mChannel.sendMessage("o_O ??");
					return;
				}				

				if(param > 100)
					param = 100;

				// Incase the user decides to delete just one message.
				// It will delete the message that called this and their 1 message
				if(param === 1){
					param = 2;
				}

				mChannel.fetchMessages({limit: param})
				 .then( messages =>{
				 	if(messages.length > 2){
				 		mChannel.bulkDelete(messages)
				 	 .catch(error=>{
				 	 	if(error) return sendError('Deleting Messages', error, mChannel);
				 	 });
				 	}else{
				 		messages = messages.array();
				 		for(var i = 0; i < messages.length; i++){
				 			messages[i].delete()
				 			 .catch(error =>{
				 			 	if(error) return sendError('Deleting Message', error, mChannel);
				 			 });
				 		}

				 	}
				 })
				 .catch(error =>{
				 	if(error) return sendError('Getting Messages', error, mChannel);
				 });
			} else{
				if(param2 <= 0){
					mChannel.sendMessage("o_O ??");
					return;
				}				

				if(param2 > 100)
					param2 = 100;

				if(param2 === 1){
					param2 = 2;
				}
				mChannel.fetchMessages({limit: param2})
				 .then( messages =>{
				 	messages = messages.filter( message =>{
				 		return message.author.username.toLowerCase() === param
				 	})
				 	
				 	if(!messages.size){
				 		mChannel.sendMessage("No messages found to delete");
				 		return;
				 	}

				 	if(param2 > 2){
				 		mChannel.bulkDelete(messages)
				 	 	.catch(error=>{
				 	 		if(error) return sendError('Deleting Messages', error, mChannel);
				 		});
				 	 } else{
				 	 	messages = messages.array();
				 	 	for(var i = 0; i < messages.length; i++){
				 			messages[i].delete()
				 			 .catch(error =>{
				 			 	if(error) return sendError('Deleting Message', error, mChannel);
				 			 });
				 		}
				 	 }
				 })
				 .catch(error =>{
				 	if(error) return sendError('Getting Messages', error, mChannel);
				 });
			}
		} else{
			mChannel.fetchMessages({limit: 100})
			.then(messages =>{
				mChannel.bulkDelete(messages)
		 	 	.catch(error=>{
		 	 		if(error) return sendError('Deleting Messages', error, mChannel);
		 		});
			})
			.catch(error =>{
			 	if(error) return sendError('Getting Messages', error, mChannel);
			 });
		}
		return;
	}

	// Deleting custom commands
	if(isCommand(mContent, 'delcmd') && isAdmin(message)){
  		if(mContent.indexOf(' ') !== -1){
  			var input = mContent.split(' ')[1];

  			var file = './config/botCommands.json';

  			fs.readFile(file, (error, commands) =>{
  				if(error) return sendError("Reading Bot Commands File", error, mChannel);
  				try{
  					commands = JSON.parse(commands);
  				}catch(error){
  					if(error) return sendError("Parsing Bot Commands File", error, mChannel);  					
  				}

  				if(commands.hasOwnProperty(mGuild.id)){
  					for(var i = 0; i < commands[mGuild.id].length; i++){
  						if(commands[mGuild.id][i].command === input.toLowerCase()){
  							var commandName = commands[mGuild.id][i].command;

  							if(commands[mGuild.id][i].type === 'image'){
  								if(fs.existsSync('./' + commands[mGuild.id][i].file)){
  									fs.unlinkSync("./" + commands[mGuild.id][i].file);
  								}
  							}

  							commands[mGuild.id].splice(i, 1);

  							fs.writeFile(file, JSON.stringify(commands, null, '\t'), error =>{
  								if(error) return sendError("Writng to Bot Commands File", error, mChannel);
  								mChannel.sendMessage("Command `" + commandName + "` removed");
  							});
  							return;					
  						}
  					}
  					mChannel.sendMessage("Command not found");
  				}
  			});
  		}
  		return;
  	}

  	if(isCommand(mContent, `addcmd`) && isAdmin(message)){
  		if(mContent.indexOf(' ') !== -1){
  			var file = './config/botCommands.json';
  			var messageArr = mContent.split(' ');
  			var newCommand = messageArr[1];
  			var commandType = messageArr[2];
  			var commandMessage = messageArr[3];
  			var image = message.attachments.first();

  			if(image && !commandType)
  				commandType = 'image';

  			if(!commandType){
  				mChannel.sendMessage("Making a text command with no message? o_O ?");
  				return;
  			}

  			if(commandType.toLowerCase() !== 'text'  && commandType.toLowerCase() !== 'image'){
  				messageArr.splice(0,2);
  				if(image)
  					commandType = 'image';
  				else
  					commandType = 'text';

  				commandMessage = messageArr.join(' ');
  			}else{
  				messageArr.splice(0,3);
  				commandMessage = messageArr.join(' ');	
  			}

  			if(commandMessage.length === 0)
  				commandMessage = null;

  			fs.readFile(file, (error, commands) =>{
  				if(error) return sendError("Reading Bot Commands File", error, mChannel);
  				try{
  					commands = JSON.parse(commands);
  				}catch(error){
  					if(error) return sendError("Parsing Bot Commands File", error, mChannel);
  				}

  				if(!commands.hasOwnProperty(mGuild.id))
  					commands[mGuild.id] = [];
  				
				for(var i = 0; i < commands[mGuild.id].length; i++){
					if(commands[mGuild.id][i].command === newCommand.toLowerCase()){
						mChannel.sendMessage("This command has already been added");
						return;
					}
				}

				if(commandType.toLowerCase() === 'text'){
					commands[mGuild.id].push({
						command: newCommand,
						type: commandType.toLowerCase(),
						message: commandMessage,
						editable: true
					});

					
				} else if(commandType.toLowerCase() === 'image'){
					if(image){
						var fileName = newCommand.replace(/[&\/\\#,+()$~%'":*?<>{}|_-]/g,'') + '.' + image.filename.split('.')[1];
						var filePath = './pictures/' + fileName;
						request
						 .get(image.url)
						 .on('error', error =>{
						 	if(error) return sendError("Getting Image File", error, mChannel);						 	
						 })
						 .pipe(fs.createWriteStream(filePath));

						 if(fs.existsSync(filePath)){
						 	if(commandMessage){
								commands[mGuild.id].push({
									command: newCommand,
									type: commandType.toLowerCase(),
									message: commandMessage,
									file: filePath,
									filename: fileName,
									editable: true
								});
							} else{
								commands[mGuild.id].push({
									command: newCommand,
									type: commandType.toLowerCase(),
									file: filePath,
									filename: fileName,
									editable: true
								});
							}
						 }
					}else{
						mChannel.sendMessage("You must attach an image with your command as the text input");
						return;
					}
				}

				fs.writeFile(file, JSON.stringify(commands, null, '\t'), error =>{
					if(error) return sendError("Writing to Bot Commands File", error, mChannel);

					mChannel.sendMessage("Command `" + newCommand + "` added");
				});
  				 				
  			});


  		}
  		return;
  	}

	// GENERAL commands

  	if(isCommand(mContent, 'help')){
  		generalCommands = [
  			'about', 'help',
  			'commands',
  			'invite', 'uptime',
  			'source', 'twitch',
  			'hitbox'];

  		adminCommands = [
  			'setgame', 'delcmd',
  			'addcmd', 'purge',
  			'notify', 'setchannel',
  			'exit'];

  		function re(command){
  			for(var i = 0; i < command.length; i++){
  				command[i] = "**" + (i+1) + ".**  " + CMDINT + command[i];
  			}
  			return command;
  		}

  		adminCommands = re(adminCommands);
  		generalCommands = re(generalCommands);

  		mChannel.sendMessage("**Help**", {
  			embed: {
  				color: 10181046,
  				fields: [{
  					name: "Admin Commands",
  					value: adminCommands.join('\n'),
  					inline: true
  				},{
  					name: "General Commands",
  					value: generalCommands.join('\n'),
  					inline: true
  				}]
  			}
  		})
  		 .catch(console.error);
  		return;
  	}

  	if(isCommand(mContent, 'about')){

  		mChannel.sendMessage("**About**", {
	  		embed:{
	  			color: 10181046,
	  			thumbnail: {
	  				url: bot.user.displayAvatarURL
	  			},
	  			fields:[{
	  				name: "Bot Version",
	  				value: "Akephalos Bot v" + botVersion,
	  				inline: true
	  			}, {
	  				name: "Servers",
	  				value: bot.guilds.array().length,
	  				inline: true
	  			}, {
	  				name: "Author",
	  				value: "Mesmaroth",
	  				inline: true
	  			}, {
	  				name: "Library",
	  				value: "Discord.js",
	  				inline: true
	  			}, {
	  				name: "Source",
	  				value: "https://github.com/Mesmaroth/discord-AkephalosBot",
	  				inline: false
	  			}]
	  		}
  		});
  		return;
  	}

  	if(isCommand(message.content, 'source')){
  		mChannel.sendMessage("**Source:** https://github.com/Mesmaroth/discord-AkephalosBot");
  		return;
  	}

  	if(isCommand(mContent, 'invite')){
  		bot.generateInvite().then( link =>{
  			mChannel.sendMessage("**Invite:** " + link);
  		});
  		return;
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
  		return;
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
  		return;
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
  		return;
  	}

  	// Display commands
  	if(isCommand(mContent, 'commands') || isCommand(mContent, 'c')){
  		var botCommandsFile = './config/botCommands.json';
  		if(mContent.indexOf(' ') !== -1){
  			var param = mContent.split(' ')[1];

  			if(param.toLowerCase() === "global" || param.toLowerCase() === 'g'){
  				fs.readFile(botCommandsFile, (error, commands)=>{
	  				if(error) return sendError("Reading Bot Commands Config File", error, mChannel);

					try{
						commands = JSON.parse(commands);  			
					}catch(error){
						if(error) return sendError("Parsing Bot Commands Config File", error, mChannel);
					}

					if(commands.hasOwnProperty("GLOBAL")){
						var globalCommands = commands["GLOBAL"];
						var cmds = [];
						var sets = [];
						var fields = [];

						for(var i = 0; i < globalCommands.length; i++){
							cmds.push("**"+(i+1) + ".**  " + globalCommands[i].command);
						}
						
						while(cmds.length > 0){
							sets.push(cmds.splice(0,5));
						}
						
						for(var i = 0; i < sets.length; i++){
							fields.push({
								name: "** **",
								value: sets[i].join('\n'),
								inline: true
							});
						}

						if(fields.length > 0)
							mChannel.sendMessage("**Global Commands**", {
								embed: {
									color: 15105570,
									fields: fields
								}
							});
						else
							mChannel.sendMessage("No commands found on this server");
					}else{
						mChannel.sendMessage("No Global commands found on this server");
					}
	  			});
  			}
  		}else{
  			fs.readFile(botCommandsFile, (error, commands)=>{
  				if(error) return sendError("Reading Bot Commands Config File", error, mChannel);

				try{
					commands = JSON.parse(commands);  			
				}catch(error){
					if(error) return sendError("Parsing Bot Commands Config File", error, mChannel);
				}

				if(commands.hasOwnProperty(mGuild.id)){
					var serverCommands = commands[mGuild.id];
					var cmds = [];
					var sets = [];
					var fields = [];

					if(commands[mGuild.id].length === 0){
						mChannel.sendMessage("No Commands found on this server");
						delete commands[mGuild.id];
						fs.writeFile(botCommandsFile, JSON.stringify(commands, null, '\t'), error =>{
							if(error) return sendError('Writing to Bot Commands File', error, mChannel);
						});
						return;
					}

					for(var i = 0; i < serverCommands.length; i++){
						cmds.push("**"+(i+1) + ".**  " + serverCommands[i].command);
					}
					
					while(cmds.length > 0){
						sets.push(cmds.splice(0,5));
					}
					
					for(var i = 0; i < sets.length; i++){
						fields.push({
							name: "** **",
							value: sets[i].join('\n'),
							inline: true
						});
					}					

					mChannel.sendMessage("**Commands**\n", {
						embed: {
							color: 3447003,
							fields: fields
						}
					});
				}else{
					mChannel.sendMessage("No commands found on this server");
				}
  			});
  		}
  		return;
  	}

  	// Custom commands
	fs.readFile('./config/botCommands.json', (error, commands) =>{
		if(error) return sendError("Reading Bot Commands Config File", error, mChannel);

		try{
			commands = JSON.parse(commands);  			
		}catch(error){
			if(error) return sendError("Parsing Bot Commands Config File", error, mChannel);
		}

		// Check each word in a string and see if the command has been called
		function commandInString(string, word){
			string = string.split(' ');
			for(var i = 0; i < string.length; i++){
				if(string[i].toLowerCase() === word){
					return true;
				}
			}
			return false;
		}

		if(commands.hasOwnProperty('GLOBAL')){
			var globalCommands = commands['GLOBAL'];
			for(var i = 0; i < globalCommands.length; i++){
				var inString = commandInString(mContent, globalCommands[i].command);
				if(mContent.toLowerCase() === globalCommands[i].command || inString){
					if(globalCommands[i].type === 'text'){
						mChannel.sendMessage(globalCommands[i].message);
					}else if(globalCommands[i].type === 'image'){
						if(!fs.existsSync(globalCommands[i].file)){
							return sendError("Reading Custom Commands File", {name: "No file found: " + serverCommands[i].file, message: "File not found."}, mChannel);
						}
						if(globalCommands[i].hasOwnProperty('message')){
							mChannel.sendFile(globalCommands[i].file, globalCommands[i].filename, globalCommands[i].message);
						}else{
							mChannel.sendFile(globalCommands[i].file, globalCommands[i].filename);
						}
					}
					return;
				}
			}
		}

		if(commands.hasOwnProperty(mGuild.id)){
			var serverCommands = commands[mGuild.id];			
			for(var i = 0; i < serverCommands.length; i++){
				var inString = commandInString(mContent, serverCommands[i].command)
				if(mContent.toLowerCase() === serverCommands[i].command || inString){
					if(serverCommands[i].type === 'text'){
						mChannel.sendMessage(serverCommands[i].message);
					}else if(serverCommands[i].type === 'image'){
						if(!fs.existsSync(serverCommands[i].file)){
							return sendError("Reading Custom Commands File", {name: "No file found: " + serverCommands[i].file, message: "File not found"}, mChannel);
						}
						if(serverCommands[i].hasOwnProperty('message')){
							mChannel.sendFile(serverCommands[i].file, serverCommands[i].filename, serverCommands[i].message);
						}else{
							mChannel.sendFile(serverCommands[i].file, serverCommands[i].filename);
						}
					}
					return;
				}
			}			
		}
	});

});
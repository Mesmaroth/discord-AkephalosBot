const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const request = require('request');
const botLogin = require(path.resolve(__dirname, 'config/botlogin.js'));
const liveStream = require(path.resolve(__dirname, 'modules/livestream.js'));
const bot = new Discord.Client();
bot.login(botLogin.token);


const notifyChannelFile = path.resolve(__dirname, 'config/notifychannels.json');
const botCommandsFile = path.resolve(__dirname, 'config/botCommands.json');
const botPreferenceFile = path.resolve(__dirname, 'config/preference.json');
const logsPath = path.resolve(__dirname, 'logs');
const picturePath = path.resolve(__dirname, 'pictures');
const soundsPath = path.resolve(__dirname, 'sounds');
const bannedCommands = [
	'exit', 'setgame',
	'setavatar', 'setname',
	'setchannel', 'notify',
	'purge', 'delcmd',
	'addcmd', 'help',
	'about', 'source',
	'invite', 'uptime',
	'twitch', 'commands',
	'sounds', 'setadminrole', 'setinit'];

var adminGroups = ["admin"];
var notifyChannel = {}
var botVersion = "?#";
var CMDINT = "!";

try{
	botVersion = require(path.resolve(__dirname, 'package.json')).version;
	
	if((fs.existsSync(notifyChannelFile))){
		notifyChannel = fs.readFileSync(notifyChannelFile);
		notifyChannel = JSON.parse(notifyChannel);
		
	}else{
		fs.writeFileSync(notifyChannelFile, "{}");
		notifyChannel = fs.readFileSync(notifyChannelFile);
		notifyChannel = JSON.parse(notifyChannel);
		console.log("NOTIFY CHANNEL CONFIG FILE CREATED AT: " + botCommandsFile);
		console.log();
	}

	if(!fs.existsSync(botCommandsFile)){
		var globalKey = {
			GLOBAL: [{
				command: "ping",
				message: "pong",
				type: "text",
				editable: false,
				comment: "Test command"
			}]
		}
		notifyChannel = fs.writeFileSync(botCommandsFile, JSON.stringify(globalKey, null, '\t'));
		console.log("COMMANDS FILE CREATED AT: " + botCommandsFile);
		console.log();	
	}

	if(fs.existsSync(botPreference)){ 
		var file = fs.readFileSync(botPreference);		
		file = JSON.parse(file);
		CMDINT = file.initcmd;
		adminGroups = file.adminGroups;
	}	
} catch(error){
	if(error) {
		console.log("------- ERROR --------");
		console.log(error);
		console.log("----------------------");
	}
}

var defaultStatus = "v" + botVersion + " | " + CMDINT + "help";

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
	var memberRoles = message.member.roles.array();
	for(var role = 0; role < memberRoles.length; role++){
		for(var group = 0; group < adminGroups.length; group++){
			if(memberRoles[role].name.toLowerCase() === adminGroups[group])
				return true;
		}
	}
	message.channel.send("You aren't admin for this command.");
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
	channel.send("**" + title + " Error**\n```" + error.message +"```");
}

function displayServers(){
	var guilds = bot.guilds.array();
	var servers = [];

	for(var i = 0; i < guilds.length; i++){
		servers.push(guilds[i].name);
	}

	if(servers.length === 0){
		return console.log("Servers: NONE");
	} else
		return console.log("Servers:\n" + servers.join("\n") + "\n");
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

function sentMessageError(error, mChannel){
	var guild = mChannel.guild;
	var channel = getChannelByName(guild, "general");
	sendError("Sending message", error, channel);
}	

bot.on('ready', () => {
	console.log("Akephalos Bot v" + botVersion);
	console.log(bot.user.username + " - (" + bot.user.id + ")");
	bot.generateInvite().then( link =>{
		console.log("\nInvite: " + link);
	});
	console.log();
	displayServers();
	setGame(defaultStatus);
});

bot.on('disconnect', event =>{
	console.log("Exited with code: " + event.code);
	if(event.message)
		console.log("Message: " + event.message);
	console.log();
	process.exit(0);
});

bot.on('guildMemberAdd', guildMember =>{
	var generalChannel = getChannelByName(guildMember.guild, 'general');

	generalChannel.send(guildMember.user.username +", welcome to **" + guildMember.guild.name + "**");	
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
				var user = newGuildMember.presence.game.url.slice(newGuildMember.presence.game.url.indexOf('/', newGuildMember.presence.game.url.indexOf('www.twitch.tv')) + 1);

				liveStream.getTwitchStream(user, (error, status, gameTitle, streamURL, thumbnailURL) =>{
					if(gameTitle === '' || gameTitle === null){
						gameTitle = "None"
					}
					
					textChannel.send("**LIVE**", {
						embed: {
							color: 10181046,
							title: newGuildMember.user.username + " is now streaming!",
							thumbnail: {
								url: thumbnailURL
							},
							description: "**Title:** " + newGuildMember.presence.game.name + "\n**Game:** " + gameTitle + "\n" + newGuildMember.presence.game.url
						}
					}).catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
				});
			}
		}
	}		
});

bot.on('message', message => {
	const mContent = message.content;
	const mChannel = message.channel;
	const mGuild = message.guild;
	const mMember = message.member;

	if(mMember){
		if(mMember.user.bot) return;
	}

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
			mChannel.send("Game set to: " + game);
		}
		return;
	}

	if(isCommand(mContent, 'setavatar') && isAdmin(message)){
		if(mContent.indexOf(' ') !== -1){
			var url = message.content.split(' ')[1];
			bot.user.setAvatar(url);
			console.log("DISCORD: Avatar changed");
		}
	}

	if(isCommand(mContent, 'setname') && isAdmin(message)){
		if(mContent.indexOf(' ') !== -1){
			var username = mContent.split(' ')[1];
			bot.user.setUsername(username);
			console.log("DISCORD: Username set to " + username);
		}
	}

	if(isCommand(mContent, 'setinit') && isAdmin(message)){
		if(mContent.indexOf(' ') !== -1){
			var init  = mContent.split(' ')[1];

			CMDINT = init;

			fs.readFile(botPreference, (error, file) =>{
				if(error) return sendError("Reading preference config file", error, mChannel);

				try{
					file = JSON.parse(file);
				}catch(error){
					if(error) return sendError("Parsing prefernce config file", error, mChannel);
				}

				file.initcmd = init;

				fs.writeFile(botPreference, JSON.stringify(file, null, '\t'), error =>{
					if(error) return sendError("Writing to preference config file", error, mChannel);

					mChannel.send("Command initializer set as `" + init + "`");
				});
			});

		}
		return;
	}

	// Adds a role to the admin group list
	if(isCommand(mContent, 'addadminrole') && isAdmin(message)){
		if(mContent.indexOf(' ') !== -1){
			var param = mContent.split(' ')[1].toLowerCase();

			adminGroups.push(param);

			fs.readFile(botPreference, (error, file) =>{
				if(error) return sendError("Reading Preference File", error, mChannel);

				try{
					file = JSON.parse(file);
				}catch(error){
					if(error) return sendError("Parsing Preference File", error, mChannel);
				}

				file.adminGroups.push(param);

				fs.writeFile(botPreference, JSON.stringify(file, null, '\t'), error =>{
					if(error) return sendError("Writing Preference File", error, mChannel);

					mChannel.send("Role `" + param + "` has been added to admin group list");
				});
			});
		}
		return;
	}

	// Sets the preferred channel for live streaming notifications
	if(isCommand(mContent, 'setchannel') && isAdmin(message)){
		if(mContent.indexOf(' ') !== -1){
			var channel = mContent.split(' ')[1];
			fs.readFile(notifyChannelFile, (error, notifyChannel) =>{
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


					fs.writeFile(notifyChannelFile, JSON.stringify(notifyChannel, null, '\t'), error =>{
						if(error) return sendError("Writing Notify Channels File", error, mChannel);

						mChannel.send("Channel `" + channel + "` set as default notifications channel").catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
					});
				}else{
					mChannel.send("No channel found with that name").catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
				}
			});
		}
		return;
	}

	// Enables or disables streaming notifcations on a server
	if(isCommand(mContent, 'notify') && isAdmin(message)){
		fs.readFile(notifyChannelFile, (error, notifyChannel) =>{
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
				mChannel.send("Notifications for this server set to `true`").catch(error =>{
	  		 	if(error) sentMessageError(error, mChannel);
	  		});
			} else{
				mChannel.send("Notifications for this server set to `false`").catch(error =>{
		  		 	if(error) sentMessageError(error, mChannel);
		  		});
			}

			fs.writeFile(notifyChannelFile, JSON.stringify(notifyChannel, null, '\t'), error =>{
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
					param2 = Number(param2);
			} else{
				param2 = 100;
			}

			if(param === "me")
				param = mMember.user.username.toLowerCase();

			if(param === "bot")
				param = bot.user.username.toLowerCase();

			if(message.mentions.members.array().length > 0){
				param = message.mentions.members.array()[0].user.username.toLowerCase();
			}

			if(isNumber(param)){
				param = Number(param);
				if(param <= 0){
					mChannel.send("o_O ??");
					return;
				}

				// Add an extra count to exlucde couting the command message
				// that called this
				param+=1; 				

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
					mChannel.send("o_O ??");
					return;
				}

				param2+=1;				

				if(param2 > 100)
					param2 = 100;

				if(param2 === 1){
					param2 = 2;
				}
				
				mChannel.fetchMessages({limit: param2})
				 .then( messages =>{
				 	messages = messages.filter( message =>{
				 		return message.author.username.toLowerCase() === param
				 	});
				 	
				 	if(!messages.size){
				 		mChannel.send("No messages found to delete").catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
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

  			fs.readFile(botCommandsFile, (error, commands) =>{
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
  								var fileClear = true;
  								for(var x = 0; x < commands[mGuild.id].length; x++){
  									if(commands[mGuild.id][x].file === commands[mGuild.id][i].file && commands[mGuild.id][x].command !== commands[mGuild.id][i].command) 
  										fileClear = false;
  								}

  								if(fs.existsSync(commands[mGuild.id][i].file)){
  									if(fileClear)
  										fs.unlinkSync(commands[mGuild.id][i].file);
  								}
  							}

  							commands[mGuild.id].splice(i, 1);

  							fs.writeFile(botCommandsFile, JSON.stringify(commands, null, '\t'), error =>{
  								if(error) return sendError("Writng to Bot Commands File", error, mChannel);
  								mChannel.send("Command `" + commandName + "` removed").catch(error =>{
						  		 	if(error) sentMessageError(error, mChannel);
						  		});
  							});
  							return;					
  						}
  					}
  					mChannel.send("Command not found").catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
  				}
  			});
  		}
  		return;
  	}

  	if(isCommand(mContent, `addcmd`) && isAdmin(message)){
  		if(mContent.indexOf(' ') !== -1){
  			var messageArr = mContent.split(' ');
  			var newCommand = messageArr[1];
  			var commandType = messageArr[2];
  			var commandMessage = messageArr[3];
  			var image = message.attachments.first();

  			if(image && !commandType)
  				commandType = 'image';

  			if(!commandType){
  				mChannel.send("Making a text command with no message? o_O ?").catch(error =>{
		  		 	if(error) sentMessageError(error, mChannel);
		  		});
  				return;
  			}

  			for(var i = 0; i < bannedCommands.length; i++){
  				if(CMDINT + bannedCommands[i] === newCommand){
  					mChannel.send("This command has already been taken.");
  					return;
  				}
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

  			fs.readFile(botCommandsFile, (error, commands) =>{
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
						mChannel.send("This command has already been added").catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
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
						var filePath = path.resolve(picturePath, fileName)
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
						mChannel.send("You must attach an image with your command as the text input").catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
						return;
					}
				}

				fs.writeFile(botCommandsFile, JSON.stringify(commands, null, '\t'), error =>{
					if(error) return sendError("Writing to Bot Commands File", error, mChannel);
					mChannel.send("Command `" + newCommand + "` added").catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
				});
  				 				
  			});


  		}
  		return;
  	}

	// GENERAL commands

  	if(isCommand(mContent, 'help')){
  		var generalCommands = [
  			'about', 'help',
  			'commands',
  			'invite', 'uptime',
  			'source', 'twitch'];

  		var adminCommands = [
  			'setgame', 'delcmd',
  			'addcmd', 'purge',
  			'setinit', 'setadminrole',
  			'notify', 'setchannel',
  			'setavatar', 'setname',
  			'exit'];

  		var customCommands = [
  			'cmd', 'addcmd*',
  			'editcmd*', 'delcmd*'
  		]

  		var sounds = [
  			'sounds', 'addsound*',
  			'delsound*', 'editsound*'
  		]

  		function reList(command){
  			for(var i = 0; i < command.length; i++){
  				command[i] = "**" + (i+1) + ".**  " + CMDINT + command[i];
  			}
  			return command;
  		}

  		adminCommands = reList(adminCommands);
  		generalCommands = reList(generalCommands);
  		customCommands = reList(customCommands);
  		sounds = reList(sounds);

  		mChannel.send("**Help**", {
  			embed: {
  				color: 10181046,
  				fields: [{
  					name: "Admin Commands*",
  					value: adminCommands.join('\n'),
  					inline: true
  				}, {
  					name: "General Commands",
  					value: generalCommands.join('\n'),
  					inline: true
  				}, {
  					name: "Custom Commands",
  					value: customCommands.join('\n'),
  					inline: true
  				}, {
  					name: "Sounds",
  					value: sounds.join('\n'),
  					inline: true
  				}],
  				footer: {
	  				text: "*Needs to be in role \"Admin\""
	  			}
  			}
  		}).catch(error =>{
  		 	if(error) sentMessageError(error, mChannel);
  		});
  		return;
  	}

  	if(isCommand(mContent, 'about')){

  		mChannel.send("**About**", {
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
  		}).catch(error =>{
  		 	if(error) sentMessageError(error, mChannel);
  		});;
  		return;
  	}

  	if(isCommand(message.content, 'source')){
  		mChannel.send("**Source:** https://github.com/Mesmaroth/discord-AkephalosBot").catch(error =>{
  		 	if(error) sentMessageError(error, mChannel);
  		});;
  		return;
  	}

  	if(isCommand(mContent, 'invite')){
  		bot.generateInvite().then( link =>{
  			mChannel.send("**Invite:** " + link);
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

  		mChannel.send("**Uptime:** " + uptimeHours + " hour(s) : " + uptimeMinutes + " minute(s) : " + uptimeSeconds +" second(s)").catch(error =>{
  		 	if(error) sentMessageError(error, mChannel);
  		});;
  		return;
  	}

  	if(isCommand(mContent, 'twitch')){
  		if(mContent.indexOf(' ') !== -1){
  			var name = mContent.split(' ')[1];

  			liveStream.getTwitchStream(name, (error, status, gameTitle, streamURL, thumbnailURL)=> {
  				if(error) return sendError("Getting Twitch Stream Data", error, mChannel);
  				if(status){
  					mChannel.send("**Twitch**\n", {
  						embed: {
  							color: 10181046,
  							title: "LIVE",
  							thumbnail:{
  								url: thumbnailURL
  							},
  							description: "**Name:** " + name +
  							"\n**Status:** `Online`\n**Game:** " + gameTitle+
  							"\n" + streamURL
  						}
  					}).catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});  	
  				} else{
  					mChannel.send("**Twitch**", {
  							embed: {
  								color: 10181046,
  								title: "OFFLINE",
  								thumbnail: {
  									url: "https://pbs.twimg.com/profile_images/509073338191183872/fYdty6yd.png"
  								},
  								description: "**Name:** " + name +
  								"\n**Status:** `Offline`"

  							}
  						}).catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
  				}		
  			});
  		}
  		return;
  	}

  	// Display commands
  	if(isCommand(mContent, 'commands') || isCommand(mContent, 'c')){
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
							mChannel.send("**Global Commands**", {
								embed: {
									color: 15105570,
									fields: fields
								}
							}).catch(error =>{
					  		 	if(error) sentMessageError(error, mChannel);
					  		});
						else
							mChannel.send("No commands found on this server").catch(error =>{
					  		 	if(error) sentMessageError(error, mChannel);
					  		});
					}else{
						mChannel.send("No Global commands found on this server").catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
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
						mChannel.send("No Commands found on this server").catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
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

					mChannel.send("**Commands**\n", {
						embed: {
							color: 3447003,
							fields: fields
						}
					}).catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
				}else{
					mChannel.send("No commands found on this server").catch(error =>{
			  		 	if(error) sentMessageError(error, mChannel);
			  		});
				}
  			});
  		}
  		return;
  	}

  	if(isCommand(mContent, 'sounds')){
  		fs.readdir(soundsPath, (error, files)=>{
  			if(error) return sendError("Reading Sounds Directory", error, mChannel);

  			var sounds = [];
  			var sets = [];
  			var fields = [];

  			for(var i = 0; i < files.length; i++){
  				sounds.push("**" + (i+1) + ".** " + CMDINT + files[i].split('.')[0]);
  			}

  			while(sounds.length !== 0){
  				sets.push(sounds.splice(0,5));
  			}

  			for(var i = 0; i < sets.length; i++){
  				fields.push({
					name: "** **",
					value: sets[i].join('\n'),
					inline: true
				});
  			}

  			if(fields.length > 0){
  				mChannel.send("**Sounds**",{
	  				embed: {
	  					color: 15105570,
	  					fields: fields,
	  					footer: {
	  						text: "Need to be in a voice channel"
	  					}
	  				}
	  			});
  			}else
  				mChannel.send("No sounds found. Be sure you added some");
  		});
  		return;
  	}

  	if(isCommand(mContent, 'addsound') && isAdmin(message)){
  		var file = message.attachments.first();
		if(file){
			if(file.filename.split('.')[1] !== 'mp3'){
				mChannel.send("This file isn't a mp3 file");
				return;
			}

			var fileName = file.filename.split('.')[0].replace(/[&\/\\#,+()$~%'":*?<>{}|_-]/g,'') + '.' + file.filename.split('.')[1];
			var filePath = path.resolve(soundsPath, fileName);

			request
			 .get(file.url)
			 .on('error', error =>{
			 	if(error) return sendError("Getting Sound File", error, mChannel);						 	
			 })
			 .pipe(fs.createWriteStream(filePath));

			if(fs.existsSync(filePath)){
			 	mChannel.send("Added `" + file.filename.split('.')[0] + "` to sounds");
			 } else{
			 	mChannel.send("Something went wrong, check the logs");
			 }
			} else{
				mChannel.send("You need to attach a mp3 file.")
		}
  		return;
  	}

  	if(isCommand(mContent, 'delsound') && isAdmin(message)){
  		if(mContent.indexOf(' ') !== -1){
  			param = mContent.split(' ')[1];

  			if(isNumber(param)){
  				param = Number(param);

  				fs.readdir(soundsPath, (error, files) =>{
  					if(error) return sendError("Reading sounds folder", error, mChannel);

  					for(var i = 0; i < files.length; i++){
  						if(param === (i+1)){
  							fs.unlinkSync(path.join(soundsPath, files[i]));
  							mChannel.send("Sound `" + files[i].split('.')[0] + '` deleted.')
  							return;
  						}
  					}

  					mChannel.send("Could not find a sound with that index.");
  				});
  			}
  		}
  	}

  	// Playing Sounds
  	if(mContent[0] === CMDINT && mContent.length > 1){
  		var input = mContent.slice(1).toLowerCase();
  		fs.readdir(soundsPath, (error, files) =>{
	  		if(error) return sendError("Reading Sounds Path", error, mChannel);

	  		if(files === '') return;
	  		if(mMember) 
	  			if(!mMember.voiceChannel) return;

	  		// Get the voice channel from the server
	  		var botVoiceConnection = bot.voiceConnections.find( voiceConnection =>{
	  			return voiceConnection.channel.guild.id === mMember.guild.id;
	  		});

	  		// If the bot is in voice channel in your guild then return
	  		// then don't join or play anything
	  		if(botVoiceConnection){
	  			if(botVoiceConnection.channel.guild.id === mGuild.id) return;
	  		}  		

	  		for(var i = 0; i < files.length; i++){
	  			if(files[i].split('.')[0].toLowerCase() === input){
	  				var file = path.resolve(soundsPath, files[i]);

	  				mMember.voiceChannel.join().then(connection =>{
	  					DISPATCHER = connection.playFile(file);

	  					DISPATCHER.on('end', ()=>{
	  						connection.disconnect();
	  					});

	  					DISPATCHER.on('error', (error)=>{
	  						console.log(error);
	  					});
	  				});		  				
	  			}
	  		}
	  	});
  	}

  	// Reading Custom Commands
	fs.readFile(botCommandsFile, (error, commands) =>{
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
						mChannel.send(globalCommands[i].message).catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
					}else if(globalCommands[i].type === 'image'){
						if(!fs.existsSync(globalCommands[i].file)){
							return sendError("Reading Custom Commands File", {name: "No file found: " + serverCommands[i].file, message: "File not found."}, mChannel);
						}
						if(globalCommands[i].hasOwnProperty('message')){
							mChannel.send(globalCommands[i].message, {
								file: {
									attachment: globalCommands[i].file,
									name: globalCommands[i].filename
								}
							})
						}else{
							mChannel.send({
								file: {
									attachment: globalCommands[i].file,
									name: globalCommands[i].filename
								}
							});
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
						mChannel.send(serverCommands[i].message).catch(error =>{
				  		 	if(error) sentMessageError(error, mChannel);
				  		});
					}else if(serverCommands[i].type === 'image'){
						if(!fs.existsSync(serverCommands[i].file)){
							return sendError("Reading Custom Commands File", {name: "No file found: " + serverCommands[i].file, message: "File not found"}, mChannel);
						}
						if(serverCommands[i].hasOwnProperty('message')){
							mChannel.send(serverCommands[i].message, {
								file: {
									attachment: serverCommands[i].file,
									name: serverCommands[i].filename
								}
							})
						}else{
							mChannel.send({
								file: {
									attachment: serverCommands[i].file,
									name: serverCommands[i].filename
								}
							});
						}
					}
					return;
				}
			}			
		}
	});

});
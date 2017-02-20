var Discord = require('discord.io'),
	fs = require('fs'),
	request = require('request'),
	uptimer = require('uptimer'),
	botLogin = require('./akebot/botLogin.js'),
	liveStream = require('./akebot/liveStream.js'),
	cleverBot = require('./akebot/cleverBot.js');
	
var bot = new Discord.Client({
	token: botLogin.token, // Or add botLogin.email, botLogin.password
	autorun: true,
	messageCacheLimit: 100
});

var delayMessage = true,
	botVersion = "#?",
	CMD_path = "./akebot/botCommands.json"

// List of keywords that are reserved for the bot when users try to add commands or sounds with these keywords.
var reservedCMDS = [
	'commands', 'help', 'time', 'date', 'purge', 'servers',
	'twitch', 'hitbox', 'uptime', 'help', 'addcmd', 'delcmd','editcmd',
	'cmd', 'appcmd', 'sounds', 'addsound', 'editsound', 'delsound', 'say', 'reverse',
	'about', 'ban', 'kick' ]

// command initializer to start executing bot commands
const CMD_INIT = "!";
const SUDO_INIT = "~";	// Admin initializer

try {
	botVersion = require('./package.json')["version"];
} catch(error) {	
	console.log(error);
};

// Sudo will be granted to the owner of the first server this bot is connected to. Be sure it's you
// Otherwise you can edit it at the akebot/sudo.json file
// Sudo grants privledge to using dev commands
function sudoCheck(){
	try{
		sudo = JSON.parse(fs.readFileSync('./akebot/sudo.json', 'utf8'))
	} catch(error) {
		var sudo = {"id":"","username": "", "checked": false}
	};
	if(sudo.checked === true) return;
	var id = "";
	var username = "";
	for(var serverID in bot.servers){
		id = bot.servers[serverID].owner_id;
		username = bot.servers[serverID].members[id].username;
		break;
	}
	sudo.id = id;
	sudo.username = username;
	sudo.checked = true;
	fs.writeFileSync('./akebot/sudo.json', JSON.stringify(sudo, null, '\t'));
	return console.log("Bot dev is set to " + sudo.username + " If this isn't you please correct it in the 'sudo.json' file");
}

// month-day-year time used for logging	
function printDateTime(options){
	if(options === "date"){
		var d = new Date();
   		return d.toDateString();
	}

	if(options === "time"){
		var d = new Date();
    	var dHours = d.getHours().toString();
    	var dMinutes = (d.getMinutes()<10) ? "0"+d.getMinutes().toString() : d.getMinutes().toString();
    	if(dHours < 12)
        	return dHours + ":" + dMinutes + " AM";
    	else if (dHours > 12)
        	return (dHours-12) + ":" + dMinutes + " PM";
	}

	// If no options specified then both date and time will be returned
	var d = new Date();
    var dHours = (d.getHours() < 12) ? d.getHours().toString() : (d.getHours()-12).toString();
    var dMinutes = (d.getMinutes()<10) ? "0"+d.getMinutes().toString()+ "AM" : d.getMinutes().toString()+ "PM";
    return d.toDateString()+" at "+dHours+":"+dMinutes;    
}

function setGame(gameName){
    bot.setPresence({
    	game: {
    		name: gameName,
    		type: 0,
    		url: "http://twitch.com/SomeProfile"
    	}
    });
}

function botUptime(){
	var upSeconds = Math.floor(uptimer.getAppUptime());
    var upMinutes = 0;
    var upHours = 0;
	if(upSeconds > 60){
		upMinutes = Math.floor(upSeconds / 60);
		upSeconds = Math.floor(upSeconds % 60);
	}

	if(upMinutes > 60){
		upHours = Math.floor(upMinutes / 60);
		upMinutes = Math.floor(upMinutes % 60);
	}
	return "**Uptime:** *"+upHours+" hour(s) : "+upMinutes+" minute(s) : "+upSeconds+" second(s)*";
}

// Checks if the User is Admin
function isAdmin (userID, channelID){
    var adminRoleID = null;
    var serverID = bot.channels[channelID].guild_id;
    for(var i in bot.servers[serverID].roles){
        if(bot.servers[serverID].roles[i].name.toLowerCase() === "admin"){
            adminRoleID = bot.servers[serverID].roles[i].id;
            break;
        }
    }

    for(var i in bot.servers[serverID].members[userID].roles){                      
        if(bot.servers[serverID].members[userID].roles[i] === adminRoleID)
            return true
    }
    return false;
}

// Checks if the user is server owner.
function isGuildOwner(userID, channelID){
	var serverID = bot.channels[channelID].guild_id;
	if(bot.servers[serverID].owner_id === userID){
		return true;
	}
	return false;
}

// This checks if the user is the bot owner
function isDev(userID){
	try{
		var devID = JSON.parse(fs.readFileSync('./akebot/sudo.json', 'utf8')).id
	} catch(error) {if(error) return console.log(error)};
	if(userID === devID) return true;
	else return false;
}

function serversConnected(){
    var count = 0;
    for(var i in bot.servers){
        count++;
    }
    return count;
}

function folderCheck(folderPath){
	try{
		fs.accessSync(folderPath); 
	} catch(error){
		if(error){
			fs.mkdirSync(folderPath);			
		}
	}
}

bot.on('guildMemberAdd', member => {
	var serverName = bot.servers[member.guild_id].name;
	for(var channel in bot.servers[member.guild_id].channels){
		if(bot.servers[member.guild_id].channels[channel].name === "general"){			
			bot.sendMessage({
				to: bot.servers[member.guild_id].channels[channel].id,
				message: "Welcome to " + serverName + " server <@" + member.id +">!"
			});
			return;	
		}
	}

	// If no general channel is present then welcome the user on the first channel there is.
	for(var channel in bot.servers[member.guild_id].channels){
		bot.sendMessage({
			to: bot.servers[member.guild_id].channels[channel].id,
			message: "Welcome to " + serverName + " server <@" + member.id +">!"
		});
		return;
	}	
});

bot.on('ready', rawEvent => {
    console.log("\nAkeBot v" + botVersion);
    console.log("Discord.io - Version: " + bot.internals.version);
    console.log("Username: " + bot.username + " - (" + bot.id + ")");

    // Display connected Servers
    console.log("\nServers connected:");
    for(var i in bot.servers){
       console.log(bot.servers[i].name + " ID: (" + bot.servers[i].id + ")");
    }

    // Set a default game title
    if(process.argv[2]){
    	setGame(process.argv[2] + " v" + botVersion);
    } else{
    	setGame("v"+botVersion);	
    }
        
    sudoCheck();
    folderCheck('./sounds');
    folderCheck('./pictures');
    folderCheck('./akebot');
});

bot.on('disconnect', (errMsg, code) => {
    if(errMsg) console.error(errMsg);	
	setTimeout(() =>{
		console.log("\nExited with code " + code);
		process.exit();
	}, 1000);
});

bot.on('message', (user, userID, channelID, message, rawEvent) => {
	// Block all DMs
	if(channelID in bot.directMessages){
		if(rawEvent.d.author.username !== bot.username){
			bot.sendMessage({
				to: userID,
				message: "Direct messages for this bot are disabled."
			});
			setTimeout(bot.deleteChannel, 200, channelID);
		}		
	}
	else{
	    if(rawEvent.d.author.username !== bot.username){
	    	// SUDO commands
	        if(message === SUDO_INIT + "writeout" && isDev(userID)){
	            fs.writeFile('bot.json', "Updated at: "+ printDateTime() + "\n\n" + JSON.stringify(bot, null, '\t'), function(error){
	                if(error) throw error;
	                console.log("Succesfully written bot properties");
	                bot.sendMessage({
	                    to: channelID,
	                    message: "*Succesfully written bot properties*"
	                });
	            });
	            return;
	        }

	        if(message === SUDO_INIT + "disconnect" || message === SUDO_INIT + "exit"){
	            bot.disconnect();	            
	            return;
	        }

	        // Send a message to all servers.
	        if(message.indexOf(SUDO_INIT + "announce")=== 0 && isDev(userID)){
	        	message = message.slice(10);
				for(var serverID in bot.servers){
					for(var channelID in bot.servers[serverID].channels){
						if(bot.servers[serverID].channels[channelID].name === "general" && bot.servers[serverID].channels[channelID].type === "text"){
							bot.sendMessage({
								to: bot.servers[serverID].channels[channelID].id,
								message: message
							})
							break;
						} else continue;
					}
				}
	        	return;
	        }

	        if(message.toLowerCase().indexOf(SUDO_INIT + "setgame") === 0 && isDev(userID)){
	            var message = message.slice(9);
	            setGame(message);
	            if(message === ''){
			  		console.log("Game Presence set to: None");
			  	} else console.log("Game Presence set to: " + message);
	            return;
	        }

	        //-----------------------------

	        if(message.toLowerCase() === CMD_INIT + "uptime"){
	            bot.sendMessage({
	                to: channelID,
	                message: botUptime()
	            });
	            return;
	        }

	        if(message.toLowerCase() === CMD_INIT + "servers"){
	            bot.sendMessage({
	                to: channelID,
	                message: ("*Akephalos is connected to `" + serversConnected() +"` servers*")
	            });
	            return;
	        }

	        if(message.toLowerCase().indexOf(CMD_INIT + "ask") === 0){ 
	        	var input = message.slice(5);
	        	cleverBot(input, (error, response) => {
	        		if(error) return console.error(error);
	        		bot.sendMessage({
	        			to: channelID,
	        			message: response
	        		});
	        	});
	        	return;
	        }

	        if(message.toLowerCase() === CMD_INIT + "invite"){
	        	bot.sendMessage({
	        		to: channelID, 
	        		message: "**Invite link:**\n"+bot.inviteURL
	        	});
	        	return;
	        }

	        if(message.search(CMD_INIT + "reverse") === 0){
	            var userString = message.slice(8);
	            userString = bot.fixMessage(userString);
	            bot.sendMessage({
	                to: channelID,
	                message: userString.split("").reverse().join("")
	            });
	            return;
	        }

	        if(message.toLowerCase() === CMD_INIT + "about"){
	        	var devName = "Undefined";
	        	var botAvatarURL = "https://cdn.discordapp.com/avatars/" + bot.id + "/" + bot.avatar + ".jpg";

	        	try{
	        		devName = JSON.parse(fs.readFileSync('akebot/sudo.json','utf8')).username
	        	}
	        	catch(error){
	        		if(error) console.log(error);
	        	};

	            bot.sendMessage({
	                to: channelID,
	                message: "__**About**__\n**Bot Username:** "+bot.username+"\n**Bot Owner:** "+devName+"\n**Servers Connected:** "+serversConnected()+"\n"+
	                botUptime()+"\n**Version:** Akebot v" + botVersion + "\n**Author:** Mesmaroth\n**Written in:** Node.js\n"+
	                "**Library:** Discord.io\n**Library Version:** "+bot.internals["version"]+"\n**Avatar:** " +botAvatarURL+"\n**Thanks to:** izy521, negativereview, yukine."
	            });
	            return;
	        }

	        if(message.toLowerCase().indexOf(CMD_INIT + "twitch") === 0 ){
	        	if(message.search(" ") !== -1){
	        		message = message.split(" ");
	        		var user = message[1];

	        		liveStream.getTwitchStream(user, (error, twitchStatus, twitchGame, twitchUrl) => {
		            	if(error) return console.error(error);
		            	if(twitchStatus){
		            		bot.sendMessage({
		            			to: channelID,
		            			message: "**Twitch**\n**User:** " + user + "\n**Status:** `Online`\n**Game:** " + twitchGame + "\n**Url:** " + twitchUrl
		            		});
		            	} else {
		            		bot.sendMessage({
		            			to: channelID,
		            			message: "**Twitch**\n**User:** " + user + "\n**Status:** `Offline`"
		            		});
		            	}
		            });
	        	}
	        	return;
	        }

	        if(message.toLowerCase().indexOf(CMD_INIT + "hitbox") === 0){
	        	if(message.search(" ") !== -1){
	        		message = message.split(" ");
	        		var user = message[1];

	        		liveStream.getHitboxStream(user, (error, hitboxStatus, hitboxGame, hitboxUrl) => {
		            	if(error) return console.error(error);
		            	if(hitboxStatus){
		            		bot.sendMessage({
		            			to: channelID,
		            			message: "**Hitbox**\n**User:** " + user + "\n**Status:** `Online`\n**Game:** " + hitboxGame + "\n**Url:** " + hitboxUrl
		            		});
		            	} else {
		            		bot.sendMessage({
		            			to: channelID,
		            			message: "**Hitbox**\n**User:** " + user + "\n**Status:** `Offline`"
		            		});
		            	}		            		
		            });
	        	}
	        	return;
	        }

	        // List sounds in sounds directory
	        if(message.toLowerCase() === CMD_INIT + "sounds"){
	            fs.readdir('./sounds/', (error, songList) => {
	            	if(error) return console.error(error);
	            	for(var i = 0; i < songList.length; i++){
		            	songList[i] = songList[i].split('.');
		            	songList[i] = "`!"+songList[i][0]+"`";
		            }
		            if(songList.length >=1){
		            	bot.sendMessage({
			                to: channelID,
			                message: "\n**Sounds**\n"+songList.join("  ")
			            });
		            } else {
		            	bot.sendMessage({
		            		to: channelID,
		            		message: "No sounds added. Upload a sound by using `!addsound` with your sound file attached."
		            	});
		            }			            
	            });
	            return;
	        }

	        if(message.indexOf(CMD_INIT + "help") === 0) {
	        	if(message !== "!help"){
	        		message = message.split(" ");
	        		var type = message[1];
	        		if(type === "general"){
	        			bot.sendMessage ({
	        				to: channelID,
	        				message: "**General**\n"+
							"• `!about`: About this bot\n"+
							"• `!help`: Displays this\n"+
							"• `!source`: Source code for this bot\n"+
							"• `!invite`: If you wish to invite this bot to your server\n"+
							"• `!upTime`: Bot up time\n"+
							"• `!date`: Display the date\n"+
							"• `!time`: Display the time\n"+							
							"• `!twitch [username]`: Checks if the user is live on Twitch\n"+
							"• `!hitbox [username]`: Checks if the user is live on HitBox\n"+
							"• `!ask [Question]`: Ask the bot anything\n"
	        			});
	        		}

	        		if(type === "admins" || type === "admin"){
	        			bot.sendMessage({
	        				to: channelID, 
	        				message: "**Admins** *Must be admin*\n"+
							"• `!say [message]`: Re-sends your message from any channel in general channel\n"+
							"• `!purge all [Amount]`: Purges up to 100 messages. Add a number to specify\n"+
							"• `!purge me [Amount]`: Purges up to 100 messages. Add a number to specify\n"+
							"• `!purge bot [Amount]`: Purges up to 100 messages. Add a number to specify\n"+
							"• `!purge username [Amount]`: Purges up to 100 messages. Add a number to specify\n"+
							"• `!purge [Amount]`: Deletes a specified amount of messages to be deleted\n"+							
							"• `!ban [@user] [days]`: Ban the mentioned user for X number of days\n"+
							"• `!kick [@user]`: Kick the mentioned user from server\n"
	        			});
	        		}

	        		if(type === "commands" || type === "command"){
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "**Commands**\n"+
	        				"• `!commands`: Show a list of all commands that have been added to your server\n"+
	        				"• `!commands global`: Show a list of all commands that are global across servers\n"+
	        				"• `!cmd [command]`: Check a command's details. E.G author, type, message\n"+
							"• `!addcmd [command] [type] [message]`: Create a command \n"+
							"• `!appcmd [command] [2nd command]`: To add a second command to your command\n"+
							"• `!delcmd [command]`: Deletes your command if it is editable\n"+
							"• `!editcmd [command] [new command] [type] [message]`: Edit existing commands if it's editable\n"
	        			});
	        		}

	        		if(type === "sounds" || type === "sound"){
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "**Sounds**\n"+
	        				"• `!sounds`: Displays a list of all sounds\n"+
							"• `!addsound`: Attach a mp3 file with this command to add your sound\n"+
							"• `!editsound [old name] [new name]`: Rename the sound file\n"+
							"• `!delsound [sound name]`: Delete a sound. Do not include the '!' prefix\n"
	        			});
	        		}
	        	} else{
	        		bot.sendMessage({
	        			to: channelID,
	        			message: "**Help**\n"+
	        			"• `!help general`: For general commands\n"+
	        			"• `!help admins`: For admin Commands\n"+
	        			"• `!help commands`: For custom commands\n"+
	        			"• `!help sounds`: For sound commands"
	        		});
	        	}
		        		        
	            return;
	        }

	        // Outputs your message to the general channel from any channel.
	        if(message.toLowerCase().indexOf(CMD_INIT + "say") === 0 && isAdmin(userID, channelID)){
	            var newMsg = message.slice(5);
	            var generalChannel = "";
	            var serverID = bot.channels[channelID].guild_id;
	            for(var i in bot.servers[serverID].channels){
	                if(bot.servers[serverID].channels[i].type === "text" && bot.servers[serverID].channels[i].name.toLowerCase() === "general"){
	                    bot.sendMessage({
	                        to: bot.servers[serverID].channels[i].id,
	                        message: newMsg
	                    }, error => {
	                        if(error){
	                            bot.sendMessage({
	                                to: channelID,
	                                message: newMsg
	                            });
	                        }
	                    });
	                }
	            }
	            return;
	        }

	        // Delete messages
	        if(message.toLowerCase().indexOf(CMD_INIT + "purge") === 0 && isAdmin(userID, channelID)){
	        	if(message.indexOf(' ') !== -1) {
	        		var amount = 100;	        		
	        		message = message.split(' ');
	        		message.splice(0,1);
	        		var name = message[0];
	        		if(message[1]){
	        			amount = Math.ceil(Number(message[1]));
	        		}
	        		if(amount < 1) amount = 1;

	        		function deleteMessages (channelID, list){
        				if(list.length > 2){
        					bot.deleteMessages({
        						channelID: channelID,
        						messageIDs: list
        					});
        				} else {
        					for(var i  = 0; i < list.length; i++){
        						bot.deleteMessage({
        							channelID: channelID,
        							messageID: list[i]
        						});
        					}
        				}
	        		}

	        		if(!isNaN(name)) {
	        			name = Number(name);      			
	        			amount = (name === 100) ? name : name +1;
	        			bot.getMessages({
	        				channelID: channelID,
	        				limit: amount
	        			}, (error, messageArry) => {
	        				if(error) return console.error(error);
	        				var ids = [];
	        				for(var i  = 0; i < messageArry.length; i++){
	        					ids.push(messageArry[i].id);
	        				}
	        				deleteMessages(channelID, ids);
	        			});	        				        			
	        		} else {
	        			if(name === "all"){
	        				bot.getMessages({
	        					channelID: channelID,
	        					limit: amount
	        				}, (error, messageArray) => {
	        					if(error) return console.error(error);
	        					var ids = []
	        					for(var i = 0; i < messageArray.length; i++){
	        						ids.push(messageArray[i].id)
	        					}
	        					deleteMessages(channelID, ids);
	        				});
	        			} else if(name === "me"){
	        				bot.getMessages({
	        					channelID: channelID,
	        					limit: 100
	        				}, (error, messageArry) => {
	        					if(error) return console.error(error);
	        					var ids = [];	        					
		        				for(var i  = 0; i < messageArry.length; i++){
		        					if(user === messageArry[i].author.username ){	
		        						if(ids.length < (amount + 1)){		// Adding one to include the command message that called it.
		        							ids.push(messageArry[i].id);
		        						}		        						
		        					}
		        				}

		        				if(ids.length > 0){
		        					deleteMessages(channelID, ids);	 
		        				}       					
	        				});
	        			} else if(name === "bot"){
	        				bot.getMessages({
	        					channelID: channelID,
	        					limit: 100
	        				}, (error, messageArry) => {
	        					if(error) return console.error(error);
	        					var ids = [];	        					
		        				for(var i  = 0; i < messageArry.length; i++){
		        					if(bot.username === messageArry[i].author.username ){	
		        						if(ids.length < amount ){
		        							ids.push(messageArry[i].id);
		        						}		        						
		        					}
		        				}

		        				if(ids.length > 0){
		        					deleteMessages(channelID, ids);	 
		        				}        					
	        				});
	        			} else {
	        				// If the user specified a username to purge
	        				bot.getMessages({
	        					channelID: channelID,
	        					limit: 100
	        				}, (error, messageArry) => {
	        					if(error) return console.error(error);
	        					var ids = [];	        					
		        				for(var i  = 0; i < messageArry.length; i++){
		        					if(name.toLowerCase() === messageArry[i].author.username.toLowerCase()){	
		        						if(ids.length < amount){
		        							ids.push(messageArry[i].id);
		        						}		        						
		        					}
		        				}

		        				if(ids.length > 0){
		        					deleteMessages(channelID, ids);	 
		        				}        					
	        				});
	        			}

	        		}

	        	}
	        	else {
	        		bot.sendMessage({
	        			to: channelID,
	        			message: "Nothing was specified."
	        		});
	        	}
	        	return;		        	
	        }

	        if(message.toLowerCase().indexOf(CMD_INIT + "kick") === 0 && isAdmin(userID, channelID)){
	        	if(message.search(" ") !== -1){
	        		message = message.split(" ");       		
	        		// Check for mentions
	        		if(rawEvent.d.mentions.length > 0){
	        			var targetID = rawEvent.d.mentions[0].id;
	        			var targetName = rawEvent.d.mentions[0].username;

	        			bot.kick({
	        				channel: channelID,
	        				target: targetID
	        			}, (error) => {
	        				if(error) return console.log(error);
	        				bot.sendMessage({
		        				to: channelID,
		        				message: targetName + " has been kicked."
	        				});
	        			});
	        			
	        		} else{
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "No user was mentioned."
	        			});
	        		}
	        	}
	        	return;
	        }

	        if(message.toLowerCase().indexOf(CMD_INIT + "ban") === 0 && isAdmin(userID, channelID)){
	        	if(message.search(" ") !== -1){
	        		message = message.split(" ");
	        		if(message.length !== 3){
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "No amount of days specified."
	        			});
	        			return;
	        		}

	        		if(rawEvent.d.mentions.length > 0){
	        			var targetID = rawEvent.d.mentions[0].id;
	        			var targetName = rawEvent.d.mentions[0].username;
	        			bot.ban({
	        				channel: channelID,
	        				target: targetID,
	        				lastDays: Number(message[2])
	        			}, (error) => {
	        				if(error) return console.log(error);
	        				bot.sendMessage({
		        				to: channelID,
		        				message: targetName + " has been banned for `" + message[2] + "` days."
		        			});
	        			});
		        			
	        		} else{
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "No user was mentioned."
	        			});
	        		}
	        	}
	        	return;
	        }

	        if(message.toLowerCase() === CMD_INIT + "date"){
	            bot.sendMessage({
	                to: channelID,
	                message: printDateTime("date")
	            });
	            return;
	        }

	        if(message.toLowerCase() === CMD_INIT + "time"){
	            bot.sendMessage({
	                to: channelID,
	                message: printDateTime("time")
	            });
	            return;
	        }

	        if(message.toLowerCase().indexOf(CMD_INIT + "commands") === 0) {
	        	var serverID = bot.channels[channelID].guild_id;
	        	var commands = [];
	        	var itemsPerMessage = 30;

	        	try {
	        		var file = fs.readFileSync(CMD_path);
					file = JSON.parse(file);
				} catch(error){
					if(error){
						bot.sendMessage({
							to: channelID,
							message: "Something is causing an error in your commands file. Please revise...\n**Error:**\n```js" + error +"\n```"
						});
						return;
					}
				}

	   			if(message === CMD_INIT + "commands global"){
	   				file = file["GLOBAL"];
	   				if(!file) {
	   					bot.sendMessage({
		   					to: channelID,
		   					message: "There seems to be no global commands added. Speak to the bot owner for commands."
		   				});
		   				return;
	   				}

	   				for(var i = 0; i < file.length; i++){
   						commands.push("**"+(i+1)+".** `"+file[i].command+"`					*" + file[i].comment+"*");
   					}

   					if(commands.length > 0){
		   				bot.sendMessage({
		   					to: channelID,
		   					message: "**Global Commands**\n" + commands.join('\n')
		   				});
		   			}
	   			}

	   			if(message === CMD_INIT + "commands"){
	   				file = file[serverID];
	   				if(!file || file.length === 0){ 
	   					bot.sendMessage({
		   					to: channelID,
		   					message: "There are currently no commands for this server. Maybe you should add one! Enter `!help commands` for help."
		   				});
		   				return;
	   				}

	   				for(var i = 0; i < file.length; i++){
	   					commands.push("**"+(i+1) + ".** `" + file[i].command + "`   by *" + (file[i].author ? file[i].author : "Server") +"*");  						
   					}

   					if(commands.length > 0){
		   				bot.sendMessage({
		   					to: channelID,
		   					message: "**Server Commands**\n" + commands.splice(0, 30).join("\n")
		   				}, (error) => {
		   					function loop(){
		   						if(commands.length > 0){
		   							bot.sendMessage({
					   					to: channelID,
					   					message: "**More commands...**\n" + commands.splice(0, 30).join("\n")
					   				}, error => {
					   					loop();
					   				});
		   						}
		   					}
		   					loop();
		   				});
		   			}	   			
	   			}
	   			
	   			return;
	   		}

	   		// Add a command
	   		if(message.toLowerCase().indexOf(CMD_INIT + "addcmd") === 0){
	   			var cmd = "";
	   			var type = "";
	   			var output = [];
	   			var serverID = bot.channels[channelID].guild_id;	   			
	   			message = message.slice(8);

				fs.readFile(CMD_path, 'utf8', (error, file) => {
					if(error) return console.error(error);
					try {
		   				var commands = JSON.parse(file);
		   			} catch(error){
		   				if(error){
		   					bot.sendMessage({
								to:channelID, 
								message:"**Error:** Something is causing an error in your botCommands.json file. Please revise!\n```\n"+error+"\n```"
			   				});
			   				return;
		   				}
		   			}

					if(!commands[serverID]) commands[serverID] = [];
					if(commands[serverID].length > 99){
						bot.sendMessage({
							to: channelID,
							message: "Adding commands limit reached. Max Limit: 100"
						});
						return;
					}

					// Check if user forgot to put anything after the command is called.
		   			if(message.search(" ") !== -1){
		   				message = message.split(" ");
		   				cmd = message[0].toLowerCase();		   				

		   				// Specify a type if not then text will be default
		   				if(message[1] === 'text' || message[1] === 'image'){
		   					type = message[1];
		   					for(var i = 2; i < message.length; i++){
		   						output.push(message[i]);
		   					}
		   				} else{
		   					type = "text";
		   					for(var i = 1; i < message.length; i++){
		   						output.push(message[i]);
		   					}
		   				}
		   				output = output.join(" ");

		   				// All tilde commands or future commmands are reserved for global dev commands
		   				if(cmd.search("~") === 0){					
		   					bot.sendMessage({
		   							to: channelID,
		   							message: "*Tilde commands are not allowed and is reserved.*"
		   						});
		   					return;
		   				}

		   				// Check if any of the command equals any of the reserved commands 
		   				for(var i = 0; i < reservedCMDS.length; i++){		   					
		   					if('!'+reservedCMDS[i] === cmd){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "*This command name `" + cmd +"` is reserved for the bot.*"
		   						});
		   						return;
		   					}
		   				}

		   				// Check if the command is of text type command
		   				if(type.toLowerCase() === 'text'){
		   					// Check if the commands already exist
			   				for(var i = 0; i < commands[serverID].length; i++){ 	
			   					if((commands[serverID][i].command === cmd || commands[serverID][i].command2 === cmd) && commands[serverID][i].editable === true){
			   						bot.sendMessage({
			   							to: channelID,
			   							message: "**Error:** This command already exist but is editable. Use `!editcmd` instead.`\n```\n"+JSON.stringify(commands[serverID][i], null, '\t')+"\n```"
			   						});
			   						return;
			   					}

			   					if((commands[serverID][i].command === cmd || commands[serverID][i].command2 === cmd)  && commands[serverID][i].editable === false){
			   						bot.sendMessage({
			   							to: channelID,
			   							message: "**Error:** This command already exist and isn't editable.\n```\n"+JSON.stringify(commands[serverID][i], null, '\t')+"\n```"
			   						});
			   						return;
			   					}
			   				}			   				

			   				// Check if there was any message at all.		   				
			   				if (output === ""){
			   					bot.sendMessage({
			   						to: channelID,
			   						message: "*No message was entered. Please try again.*"
			   					});
			   					return;
			   				}

			   				// Add command and push changes to file after check passes
			   				commands[serverID].push({
			   					command: cmd.toLowerCase(),
			   					type: type,
			   					author: user.toLowerCase(),
			   					message: output,
			   					editable: true		   					
			   				});
			   				fs.writeFileSync(CMD_path, JSON.stringify(commands,null,'\t'));
			   				bot.sendMessage({
			   					to: channelID,
			   					message: "\n**Command Added**\n```\nCommand: <"+bot.fixMessage(cmd)+">\nType: " + type +"\nBy: <"+ user +">\nMessage: " + bot.fixMessage(output)+ "```"
			   				});
			   				return;
		   				}

		   				if(type.toLowerCase() === 'image'){ // Check for Image type

		   					// Check if the command already exist
			   				for(var i = 0; i < commands[serverID].length; i++){
			   					if((commands[serverID][i].command === cmd || commands[serverID][i].command2 === cmd) && commands[serverID][i].editable === true){
			   						bot.sendMessage({
			   							to: channelID,
			   							message: "**Error:** This command already exist but is **editable**. Use `!editcmd` instead.\n```\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
			   						});
			   						return;
			   					}

			   					if((commands[serverID][i].command === cmd || commands[serverID][i].command2 === cmd)  && commands[serverID][i].editable === false){
			   						bot.sendMessage({
			   							to: channelID,
			   							message: "**Error:** This command already exist.\n```\n"+JSON.stringify(commands[serverID][i], null, '\t')+"\n```"
			   						});
			   						return;
			   					}
			   				}

		   					var url = "";
		   					var fileName = "";
		   					var location = "pictures/";
		   					// Get image and save from discord
		   					if(rawEvent.d.attachments.length > 0){
		   						url = rawEvent.d.attachments[0].url;
		   						fileName = rawEvent.d.attachments[0].filename;
		   						request(url).pipe(fs.createWriteStream(location+fileName));
		   					} else{
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "*No image was uploaded.*"
		   						});
		   						return;
		   					}			

			   				// Check whether the command will also contain a message.
			   				var noMsg = false;
			   				if(output === ""){
			   					noMsg = true;
			   				}

			   				// Add and push new command to file
			   				commands[serverID].push({
			   					command: cmd.toLowerCase(),
			   					type: type,
			   					author: user.toLowerCase(),
			   					file: location+fileName,
			   					filename: fileName ,
			   					message: output,
			   					editable: true	
			   				});
			   				fs.writeFileSync(CMD_path, JSON.stringify(commands,null,'\t'));

			   				// Display feedback whether command has a message or not.
			   				if(noMsg) {
			   					delete commands[serverID][commands[serverID].length - 1].message;
			   					bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command Added**\n```\nCommand: <"+bot.fixMessage(cmd)+">\nType: " + type +"\nBy: <"+ user + ">\nPath: " + location+fileName+
			   						"\nFilename: " + fileName + "```"
			   					});
			   				} else {
			   					bot.sendMessage({
				   					to: channelID,
				   					message: "\n**Command Added**\n```\nCommand: <"+bot.fixMessage(cmd)+">\nType: " + type +"\nBy: <"+ user + ">\nPath: "+ location+fileName+
				   					"\nFilename: " + fileName + "\nMessage: " + bot.fixMessage(output)+ "```"
			   					});
			   				}		   					   				
			   				return;
			   			}
		   			} else{
		   				bot.sendMessage({
		   					to: channelID,
		   					message: "Looks like your missing your message or did not specify a `type` for your command."
		   				});
		   			}
				});					
	   			return; 
	   		}

	   		if(message.toLowerCase().indexOf(CMD_INIT + "delcmd") === 0 && isAdmin(userID, channelID)){	   			
	   			fs.readFile(CMD_path, 'utf8', (error, file) => {
	   				if(error) return console.error(error);
	   				message = message.slice(8);
	   				try {
		   				var commands = JSON.parse(file);
		   			} catch(error){
		   				if(error){
		   					bot.sendMessage({
								to:channelID, 
								message:"**Error:** Something is causing an error in your botCommands.json file. Please revise!\n```\n"+error+"\n```"
			   				});
			   				return;
		   				}
		   			}
	   				var serverID = bot.channels[channelID].guild_id;
	   				if(!commands[serverID] || commands[serverID].length === 0){
	   					bot.sendMessage({
	   						to: channelID,
	   						message: "No custom commands were found for this server."
	   					});
	   					return;
	   				}

	   				for(var i = 0; i < commands[serverID].length; i++){
		   				if(commands[serverID][i].command === message || commands[serverID][i].command2 === message){
		   					if(commands[serverID][i].editable === true){
		   						if(commands[serverID][i].hasOwnProperty('file')){
		   							var location = commands[serverID][i].file;
		   							fs.unlink(location, (error) => {
		   								if(error) console.error(error);
		   							});
		   						}
		   						if(commands[serverID][i].type === "image"){
		   							commands[serverID].splice(i,1);
		   							fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'));
		   							bot.sendMessage({
			   							to: channelID,
			   							message: "*Command `" + bot.fixMessage(message) + "` has been deleted.*"
			   						});
			   						return;
		   						}

		   						if(commands[serverID][i].type === "text"){
		   							commands[serverID].splice(i,1);
			   						fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'));
			   						bot.sendMessage({
			   							to: channelID,
			   							message: "*Command `" + bot.fixMessage(message) + "` has been deleted.*"
			   						});
			   						return;
		   						}
		   					} else if(commands[serverID][i].editable === false){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "\n**Error**: *This command is not deletable.*"
		   						});
		   						return;
		   					}
		   				}
		   			}
		   			// If there is no match
		   			bot.sendMessage({
		   				to: channelID,
		   				message: "No command `" + message + "` found."
		   			});	   				   				   			
	   			});
	   			return;		   			
	   		}

	   		// Edit a command
	   		if(message.indexOf(CMD_INIT + "editcmd") === 0 && isAdmin(userID, channelID)){
	   			if(message.search(' ') != -1){	   				
	   				message = message.split(" ");
	   				if(message.length < 3) return;
	   				var cmd = message[1].toLowerCase();
	   				var newCmd = message[2].toLowerCase();
	   				if(message.length > 3) var type = message[3].toLowerCase();
	   				var msg = [];
	   				var keepMessage = false;

	   				if(message.length === 3){
	   					keepMessage = true;
	   				} else{
	   					if(type === 'image' || type === 'text'){
		   					for(var i = 4; i < message.length; i++){
		   						msg.push(message[i]);
		   					}
		   				} else{
		   					type = "text";
		   					for(var i = 3; i < message.length; i++){
		   						msg.push(message[i]);
		   					}
		   				}
		   				msg = msg.join(" ");
	   				}

	   				// Check for errors and read botComamnds list
	   				fs.readFile(CMD_path, 'utf8', (error, file) => {
	   					if(error) return console.error(error);
	   					try {
		   					var commands = JSON.parse(file);
			   			} catch(error){
			   				if(error){
			   					bot.sendMessage({
									to:channelID, 
									message:"**Error:** Something is causing an error in your botCommands.json file. Please revise!\n```\n"+error+"\n```"
				   				});
				   				return;
			   				}
			   			}
	   					var serverID = bot.channels[channelID].guild_id;

	   					if(!commands[serverID] || commands[serverID].length === 0) {
	   						bot.sendMessage({
	   							to: channelID,
	   							message: "No custom commands were found for this server."
	   						});
	   						return;
	   					}

	   					for(var i = 0; i < commands[serverID].length; i++){
		   					if(commands[serverID][i].command === cmd){
		   						if(commands[serverID][i].editable || isDev(userID)){
		   							var author = user.toLowerCase();
		   							if(isDev(userID)) author = null;

		   							// Editing just the command name
		   							if(keepMessage){
		   								var oldCMD = commands[serverID][i].command;
		   								var author = commands[serverID][i].author;

		   								if(oldCMD === newCmd){
		   									bot.sendMessage({
		   										to: channelID,
		   										message: "**Error:** Same command that you're trying to change!"
		   									});
		   									return;
		   								}

		   								msg = commands[serverID][i].message;
		   								type = commands[serverID][i].type;
		   								commands[serverID][i].command = newCmd;

		   								if(commands[serverID][i].message != ""){
		   									bot.sendMessage({
			   									to:channelID,
			   									message: "**Command Edited**\n```Command: <" + newCmd + ">\nOld Command: <" + oldCMD + ">\nType: " + type + "\nAuthor: " + author + "\nMessage: <" + commands[serverID][i].message+">```"
			   								});
		   								} else{
		   									bot.sendMessage({
			   									to:channelID,
			   									message: "**Command Edited**\n```Command: <" + newCmd + ">\nOld Command: <" + oldCMD + ">\nType: " + type + "\nAuthor: " + author +"```"
			   								});
		   								}

		   								fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'), 'utf8');
		   								return;
		   							}

		   							// Editing text commands
			   						if(type === "text"){
			   							// check if theres any text
			   							if(msg === ''){
			   								bot.sendMessage({
			   									to: channelID,
			   									message: "No message was entered."
			   								});
			   								return;
			   							}

			   							var oldCMD = commands[serverID][i].command;
			   							var oldMsg = "None";

			   							if(commands[serverID][i].hasOwnProperty("message")) oldMsg = commands[serverID][i].message;
			   							if(msg === null){		   								
			   								bot.sendMessage({
				   								to: channelID,
				   								message: "**Error:** No message was added."
			   								});
			   								return;
			   							}

			   							// If the command was an image type, the image is then removed
			   							if(commands[serverID][i].type === "image"){
			   								fs.unlink(commands[serverID][i].file, (error) => {
			   									if(error) console.log(error);
			   								});
			   								delete commands[serverID][i].file;
			   								delete commands[serverID][i].filename;		   								
			   							}
			   							
			   							commands[serverID][i].command = newCmd;
			   							commands[serverID][i].type = type;
			   							commands[serverID][i].message = msg;
			   							if(author !== null) commands[serverID][i].author = author;

			   							bot.sendMessage({
			   								to: channelID,
			   								message: "\n**Command Edited**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) +">\nType: " + commands[serverID][i].type +
			   								"\nBy: <"+user+ ">\nMessage: <" + bot.fixMessage(commands[serverID][i].message) + ">\nOld Message: <" + bot.fixMessage(oldMsg) + ">\n```"
			   							});

			   							fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'), 'utf8');
			   							return;
			   						}

			   						// Editing image commands
			   						if(type === "image"){
			   							var oldCMD = commands[serverID][i].command;
			   							var oldMsg = "None";		   							
			   							var location = "pictures/"

			   							if(commands[serverID][i].hasOwnProperty('message')) oldMsg = commands[serverID][i].message;
			   							if(msg === null){
			   								if(commands[serverID][i].hasOwnProperty('message')){
			   									delete commands[serverID][i].message;
			   								}
			   								msg = "None";
			   							} else{
			   								commands[serverID][i].message = msg;
			   							}
			   							
			   							/*	If no image is uploaded when this command is executed then it assumes
			   							/	you are editing the command or adding/removing the message. Keeping the
			   							/	image intact and will still be uploaded when the new command is executed.
			   							*/
			   							if(rawEvent.d.attachments.length === 0){
			   								if(commands[serverID][i].type === "text"){
				   								bot.sendMessage({
				   									to: channelID,
				   									message: "**Error:** `" + cmd+ "` isn't an image type command. Upload an image with this command to convert it to image."
				   								});
				   								return;
			   								}
			   								commands[serverID][i].command = newCmd;
			   								commands[serverID][i].type = type;
			   								commands[serverID][i].author = user.toLowerCase();
			   								

			   								bot.sendMessage({
				   								to: channelID,
				   								message: "\n**Command Edited**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) + ">\nType: " + commands[serverID][i].type +
				   								"\nBy: " + user + "\nPath: " + commands[serverID][i].file + "\nFile Name: " + commands[serverID][i].filename+
				   								"\nMessage: <" + bot.fixMessage(msg) +">\nOld Message: <" + bot.fixMessage(oldMsg) + ">\n```"
			   								});
			   								fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'), 'utf8');
			   								return;
			   							}

			   							/*	If an image is uploaded when this command is executed
			   							/	the old image will be removed and the new image with the new
			   							/	command or message can then be executed.
			   							*/
			   							if(rawEvent.d.attachments.length > 0){		   								
			   								var url = rawEvent.d.attachments[0].url;
			   								var fileName = rawEvent.d.attachments[0].filename;
			   								var file = location + fileName;
			   								// If the old command is type text and doesn't have any image properties
			   								var isText = false;

			   								if(commands[serverID][i].hasOwnProperty('file') && commands[serverID][i].hasOwnProperty('filename')){
			   									var oldFileName = commands[serverID][i].filename;		   							
			   									var oldFile = commands[serverID][i].file;
			   									fs.unlink(oldFile, error => {
			   										if(error) console.log(error);
			   									});
			   									isText = false;
			   								} else isText = true; 								
			   								
			   								
			   								request(url).pipe(fs.createWriteStream(file));		   								

			   								commands[serverID][i].command = newCmd;
			   								commands[serverID][i].type = type;
			   								commands[serverID][i].author = user.toLowerCase();
			   								commands[serverID][i].filename = fileName;
			   								commands[serverID][i].file = file;

			   								if(isText){
			   									bot.sendMessage({
			   										to: channelID,
			   										message: "\n**Command Edited**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) + ">\nType: " + commands[serverID][i].type +
			   												 "\nBy: " + user +"\nFile Name: " + commands[serverID][i].filename+"\nPath: " + commands[serverID][i].file+ 
			   												 "\nMessage: <" + bot.fixMessage(msg) + ">\nOld Message: <" +  + ">\n```"
			   									})
			   								} else{
			   									bot.sendMessage({
					   								to: channelID,
					   								message: "\n**Command Edited**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) + ">\nType: " + commands[serverID][i].type +
				   											 "\nBy: " + user +"\nFile Name: " + commands[serverID][i].filename + "\nOld File Name: " + oldFileName + "\nPath: " + commands[serverID][i].file + "\nOld Path: " + oldFile + 
				   											 "\nMessage: <" + bot.fixMessage(msg) +">\nOld Message: <"+bot.fixMessage(oldMsg) +">\n```"		   								
				   								});
			   								}
				   								
			   								fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'), 'utf8');
			   							}
			   							return;
			   						}
		   						} else{
		   							bot.sendMessage({
		   								to: channelID,
		   								message: "**Error:** This command isn't editable."
		   							});
		   							return;
		   						}
		   					}
		   				}

		   				bot.sendMessage({
		   					to: channelID,
		   					message: "**Error:** No command found."
		   				});		   				
	   				});
	   			}
	   			return;		   				
	   		}

	   		// Append a second command to a command.
	   		if(message.toLowerCase().indexOf(CMD_INIT + "appcmd") === 0 && isAdmin(userID, channelID)){	   			
	   			if(message.search(" ") !== -1){
	   				message = message.split(" ");
	   				var cmd = message[1].toLowerCase();
	   				var serverID = bot.channels[channelID].guild_id;
	   				if(message.length > 2) var cmd2 = message[2].toLowerCase();
		   			fs.readFile(CMD_path, 'utf8', (error, file) => {
		   				if(error) return console.error(error);
		   				try {
		   					var commands = JSON.parse(file);
			   			} catch(error){
			   				if(error){
			   					bot.sendMessage({
									to:channelID, 
									message:"**Error:** Something is causing an error in your botCommands.json file. Please revise!\n```\n"+error+"\n```"
				   				});
				   				return;
			   				}
			   			}

		   				if(!commands[serverID] || commands[serverID].length === 0){
		   					bot.sendMessage({
	   							to: channelID,
	   							message: "No custom commands were found for this server."
	   						});
	   						return;
		   				}

		   				// Remove the second command from command if no command is entered.
		   				if(message.length === 2){
		   					for(var i = 0 ; i < commands[serverID].length; i++){
		   						if(cmd === commands[serverID][i].command || cmd === commands[serverID][i].command2){
			   						if(commands[serverID][i].editable){
			   							var author = "Server";
			   							if(commands[serverID][i].hasOwnProperty("author")) author = commands[serverID][i].author;

			   							if(commands[serverID][i].hasOwnProperty("command2")){
			   								delete commands[serverID][i].command2;

				   							if(commands[serverID][i].type === "text"){
					   							bot.sendMessage({
					   								to: channelID,
					   								message: "**Second Command Removed**\n```\nCommand: <" + commands[serverID][i].command + ">\nType: " + commands[serverID][i].type + "\nBy: <" + author + ">\nMessage: <" + commands[serverID][i].message + ">\n```"
					   							});
				   							}

				   							if(commands[serverID][i].type === "image"){
					   							if(commands[serverID][i].hasOwnProperty("message")){
					   								bot.sendMessage({
						   								to: channelID,
						   								message: "**Second Command Removed**\n```\nCommand: <" + commands[serverID][i].command + ">\nType: " + commands[serverID][i].type + 
						   								"\nPath: " + commands[serverID][i].file +"\nFile Name: " + commands[serverID][i].filename + "\nBy: <" + author + ">\nMessage: <" + commands[serverID][i].message  + ">\n```"
						   							});
					   							} else{
					   								bot.sendMessage({
						   								to: channelID,
						   								message: "**Second Command Removed**\n```\nCommand: <" + commands[serverID][i].command + ">\nType: " + commands[serverID][i].type +
						   								"\nPath: " + commands[serverID][i].file +"\nFile Name: " + commands[serverID][i].filename + "\nBy: <" + author + ">\n```"
						   							});
					   							}	   							
					   						}

					   						fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'));
					   						return;			   						   								
			   							}
			   						}
		   						}
		   					}
		   					bot.sendMessage({
		   						to: channelID,
		   						message: "`" + cmd + "` doesn't have a second command."
		   					});
		   					return;
		   				}

		   				// Add second command
		   				for(var i = 0; i < commands[serverID].length; i++){
		   					if(cmd === commands[serverID][i].command || cmd === commands[serverID][i].command2){
		   						if(commands[serverID][i].editable){
		   							var author = "Server";
		   							if(commands[serverID][i].hasOwnProperty("author")) author = commands[serverID][i].author;

		   							commands[serverID][i].command2 = cmd2;

			   						if(commands[serverID][i].type === "text"){
			   							bot.sendMessage({
			   								to: channelID,
			   								message: "**Command Appended**\n```\nCommand: <" + commands[serverID][i].command + ">\nCommand 2: <" + commands[serverID][i].command2 + ">\nType: " + commands[serverID][i].type +
			   								"\nBy: " + author + "\nMessage: " + commands[serverID][i].message + "\n```"
			   							});
			   						}

			   						if(commands[serverID][i].type === "image"){
			   							if(commands[serverID][i].hasOwnProperty("message")){
			   								bot.sendMessage({
				   								to: channelID,
				   								message: "**Command Appended**\n```\nCommand: <" + commands[serverID][i].command + ">\nCommand 2: <" + commands[serverID][i].command2 + ">\nType: " + commands[serverID][i].type +
				   								"Path: " + commands[serverID][i].file +"\nFile Name: " +commands[serverID][i].filename + "\nBy: <" + author + ">\nMessage: <" + commands[serverID][i].message  + ">\n```"
				   							});
			   							} else{
			   								bot.sendMessage({
				   								to: channelID,
				   								message: "**Command Appended**\n```\nCommand: <" + commands[serverID][i].command + ">\nCommand 2: <" + commands[serverID][i].command2 + ">\nType: " + commands[serverID][i].type +
				   								"Path: " + commands[serverID][i].file +"\nFile Name: " +commands[serverID][i].filename + "\nBy: <" + author + ">\n```"
				   							});
			   							}	   							
			   						}
			   						fs.writeFileSync(CMD_path, JSON.stringify(commands, null, '\t'));
			   						return;	
		   						}
		   					}
		   				}

		   				bot.sendMessage({
		   					to: channelID, 
		   					message: "`"+cmd+"` isn't editable."
		   				});
		   			});
	   			}
	   			return;
	   		}

	   		// Displays details of the command
	   		if(message.toLowerCase().indexOf(CMD_INIT + "cmd") === 0){
	   			var serverID = bot.channels[channelID].guild_id;
	   			var author = "Server";
	   			message = message.split(" ");
	   			if(message[1]) message = message[1];

		   		try {
		   			var file = fs.readFileSync(CMD_path);
		   			var commands = JSON.parse(file);
		   		} catch(error){
		   			if(error){
		   				bot.sendMessage({
							to:channelID, 
							message:"**Error:** Something is causing an error in your botCommands.json file. Please revise!\n```\n"+error+"\n```"
			   			});
			   			return;
		   			}
		   		}

		   		if(!commands[serverID] || commands[serverID].length === 0){
		   			bot.sendMessage({
	   					to: channelID,
	   					message: "No custom commands were found for this server."
	   				});
	   				return;		   				
		   		}

		   			
		   		for(var i = 0; i < commands[serverID].length; i++){		   			
		   			if(commands[serverID][i].command === message || commands[serverID][i].command2 === message){
		   				if(commands[serverID][i].hasOwnProperty("author")){
		   					author = commands[serverID][i].author;
		   				}

		   				if(commands[serverID][i].type === 'text'){	   					
			   				if(commands[serverID][i].hasOwnProperty("command2")){
			   					bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nCommand 2: <"+ bot.fixMessage(commands[serverID][i].command2)+ ">\nType: " + commands[serverID][i].type +"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(commands[serverID][i].message) + "```"
			   					});
			   					return;
			   				}
			   				
			   				bot.sendMessage({
			   					to: channelID,
			   					message: "\n**Command**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nType: " + commands[serverID][i].type +"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(commands[serverID][i].message) + "```"
			   				});
			   				return;
		   				}

		   				if(commands[serverID][i].type === 'image'){
		   					var message = "None";
		   					if(commands[serverID][i].message !== ""){
		   						message = commands[serverID][i].message;
		   					}

		   					if( commands[serverID][i].hasOwnProperty('message') && commands[serverID][i].hasOwnProperty("command2")){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nCommand 2: <"+ bot.fixMessage(commands[serverID][i].command2) + ">\nType: " + commands[serverID][i].type +"\nPath: "+commands[serverID][i].file+
			   						"\nFile Name: "+ commands[serverID][i].filename+"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(message) + "```"
			   					});
			   					return;
		   					}
		   					if( commands[serverID][i].hasOwnProperty('message') && !(commands[serverID][i].hasOwnProperty("command2")) ){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) +">\nType: " + commands[serverID][i].type +"\nPath: "+commands[serverID][i].file+
			   						"\nFile Name: "+ commands[serverID][i].filename+"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(message) + "```"
			   					});
		   						return;
		   					}

		   					if( !(commands[serverID][i].hasOwnProperty('message')) && commands[serverID][i].hasOwnProperty("command2")){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nCommand 2: <" + bot.fixMessage(commands[serverID][i].command2) + ">\nType: " + commands[serverID][i].type +"\nPath: "+commands[serverID][i].file+
			   						"\nFile Name: "+ commands[serverID][i].filename+"\nBy: <"+ author +">\n```"
			   					});
		   						return;
		   					}

		   					if( !(commands[serverID][i].hasOwnProperty('message')) && !(commands[serverID][i].hasOwnProperty("command2")) ){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```\nCommand: <" + bot.fixMessage(commands[serverID][i].command) + ">\nType: " + commands[serverID][i].type +"\nPath: "+commands[serverID][i].file+
			   						"\nFile Name: "+ commands[serverID][i].filename+"\nBy: <"+ author +">\n```"
			   					});
		   						return;
		   					}
		   				}
		   				return;
		   			}		   			
		   		}
		   		bot.sendMessage({
		   			to: channelID,
		   			message: "No command found with that name."
		   		});		   			
		   		return;		   		
	   		}

	   		// Add sounds to play
	   		if(message.toLowerCase() === CMD_INIT + "addsound" && isAdmin(userID, channelID)){
	   			if(rawEvent.d.attachments.length > 0){
	   				var url = rawEvent.d.attachments[0].url;
	   				var fileName = rawEvent.d.attachments[0].filename.toLowerCase();
	   				var songName = fileName.split(".")[0];
	   				var extension = fileName.split(".")[1];
		   			fs.readdir('./sounds/', function(error, sounds){
		   				if(error) return console.error(error);
		   				if(extension !== "mp3"){
		   					bot.sendMessage({
		   						to: channelID,
		   						message: "**Error:** This file is not a `.mp3` file."
		   					});
		   					return;
		   				}

		   				// Check if the name is not taken from the reserved command names
		   				for(var i = 0; i < reservedCMDS.length; i++){
		   					if(fileName.indexOf(reservedCMDS[i]) !== -1){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "This sound name is reserved for the bot. Please rename this file."
		   						});
		   						return;
		   					}
		   				}
		   				
		   				// check if the file is already added
		   				for(var i = 0; i < sounds.length; i++){
		   					if(fileName === sounds[i]){
		   						bot.sendMessage({
		   							to: channelID, 
		   							message: "`" + fileName + "` is already added."
		   						});
		   						return;
		   					}
		   				}

		   				request({url: url, encoding: null}, function (error, response, data){
		   					if(!error && response.statusCode === 200){
		   						fs.writeFile('./sounds/'+fileName, data, error => {
		   							if(error) return console.log(error);
		   							bot.sendMessage({
					   					to: channelID,
					   					message: "**Sound Added**\nUse `!" + songName + "` to play." 
					   				});
		   						});
		   					}
		   				});
		   			});
		   			return;
	   			}

	   			bot.sendMessage({
	   				to: channelID,
	   				message: "**Error:**\nNo sound attached to upload."
	   			});
	   			return;
	   		}

	   		// Delete sounds that are in the sounds folder.
	   		if(message.toLowerCase().indexOf(CMD_INIT + "delsound") === 0 && isAdmin(userID, channelID)){
	   			if(message.search(" ") !== -1){
	   				message = message.split(" ");	   				
	   				var sound = message[1].split(".")[0];

	   				// Check if prefix has been added
	   				if(sound.search("!") === 0){
	   					bot.sendMessage({
	   						to: channelID,
	   						message: "Do not include the `!` prefix when deleting sounds."
	   					});
	   					return;
	   				}
	   				fs.readdir('./sounds/', (error, soundList) => {
	   					if(error) return console.error(error);
	   					for(var i = 0; i < soundList.length; i++){
		   					if(sound === soundList[i].split(".")[0]){
		   						fs.unlink('./sounds/'+soundList[i], error => {
		   							if(error) {
		   								console.error(error);
		   								if(error.code === 'EBUSY'){
		   									bot.sendMessage({
			   									to: channelID,
			   									message: "**Error:** Please make sure the sound isn't playing first."
			   								});
		   								}
		   								return;
		   							}
		   							bot.sendMessage({
			   							to:channelID,
			   							message: "**Sound Deleted**\n`" + sound + "` has been deleted."
		   							});
		   						});
		   						return;	   							   						
		   					}
		   				}
		   				bot.sendMessage({
		   					to: channelID,
		   					message: "No sound `" + sound + ".mp3` found."
		   				});	
	   				});	   				
	   			}	   			
	   			return;
	   		}

	   		if(message.toLowerCase().indexOf(CMD_INIT + "editsound") === 0 && isAdmin(userID, channelID)){
	   			if(message.indexOf(" ") !== -1){
	   				message = message.toLowerCase().split(" ");
	   				if(message.length !== 3){
	   					bot.sendMessage({
	   						to: channelID,
	   						message: "**Error**: Missing values, please follow the format:\n`!editsound [old name] [new name]`"
	   					});
	   					return;
	   				}
	   				var oldName = message[1];
	   				var newName = message[2];
	   				var oldPath = './sounds/'+oldName+'.mp3';
	   				var newPath = './sounds/'+newName+'.mp3';

	   				if(oldName === newName){
	   					bot.sendMessage({
	   						to: channelID,
	   						message: "**Error**: Trying to rename the file the same name ehh?"
	   					});
	   					return;
	   				}

	   				fs.readdir('./sounds/', (error, files) =>{
	   					if(error) return console.error(error);
	   					for(var i = 0; i < files.length; i++){
	   						var sound = files[i].split(".")[0];

		   					if(sound === oldName){
		   						fs.rename(oldPath, newPath, () => {
				   					console.log("Sound file edited: ("+oldPath+") to ("+newPath+")");
				   					bot.sendMessage({
				   						to: channelID,
				   						message: "**Sound Edited**\n`!"+oldName+"` has been renamed to `!"+newName+"`"
				   					});
			   					});
			   					return;
		   					}
	   					}

	   					bot.sendMessage({
	   						to: channelID,
	   						message: "**Error**: `!"+oldName+"` was not found."
	   					});
	   					return;
	   				});
	   			} else{
	   				bot.sendMessage({
		   				to: channelID,
		   				message: "**Error**: Missing values, please follow the format:\n`!editsound [old name] [new name]`"
		   			});
	   			}	   			
	   			return;
	   		}

	   		// ----- Special Commands -----





	   		// Play Sound
	        if(message.toLowerCase().indexOf(CMD_INIT) === 0) {	        	
	        	var serverID = bot.channels[channelID].guild_id;
	        	var voiceID = bot.servers[serverID].members[userID].voice_channel_id;
	        	var location = './sounds/';
	        	if(!bot._vChannels[voiceID]){
	        		if(voiceID){
	        			var sound = message.slice(1).toLowerCase() + '.mp3';
		        		fs.readdir(location, (error, soundsList) => {
		        			if(error) return console.error(error);
		        			if(soundsList.indexOf(sound) !== -1){
		        				bot.joinVoiceChannel(voiceID, () => {
		        					bot.getAudioContext(voiceID, (error, stream) => {
		        						if(error) return console.error(error);
		        						stream.playAudioFile(location + sound);
		        						stream.once('fileEnd', () => {
		        							bot.leaveVoiceChannel(voiceID);		        							
		        						});
		        					});
		        				});
		        			}
		        		});
	        		}
	        	}
	        	
			}			

	        // Check message to see if it triggers any commands in botCommands.json
	        // The command can be anywhere within a setence

	   		fs.readFile(CMD_path, 'utf8', (error, file) => {
	   			if(error){
	   				console.error(error);
	   				if(delayMessage){
		   				bot.sendMessage({
			   				to:channelID, 
			   				message:"**Error:** Please check your botCommands.json file\n```\n"+error+"\n```"
		   				});
		   				delayMessage = false;
		   				setTimeout( () => { delayMessage = true;}, 60000);
		   			}	   			
		   			return;
	   			}
	   			// Check any errors when parsing file
	   			try{
	   				var cmd = JSON.parse(file)
	   			} catch(error) {
	   				if(error){
	   					console.error(error);
		   				if(delayMessage){
			   				bot.sendMessage({
				   				to:channelID, 
				   				message:"**Error:** Something is causing an error in your botCommands.json file. Please revise!\n```\n"+error+"\n```"
			   				});
			   				delayMessage = false;
			   				setTimeout( () => { delayMessage = true;}, 60000);
			   			}
		   			}
		   			return;
	   			}
	   			
	   			var serverID = bot.channels[channelID].guild_id;	   			
		   		var keyword = null;	   		
		   		message = message.toLowerCase().split(" ");
		   				   		
		   		// Check for server commands
		   		var serverCMD = cmd[serverID];
		   		for(var i in serverCMD){
		   			if(message.indexOf(serverCMD[i].command) !== -1){
		   				keyword = serverCMD[i].command;
		   				cmd = serverCMD;
		   				break;
		   			}

		   			if(message.indexOf(serverCMD[i].command2) !== -1){
		   				keyword = serverCMD[i].command;
		   				cmd = serverCMD;
		   				break;
		   			}		   			
		   		}
		   		// Check for global commands
		   		if(!keyword){
		   			var globalCMD = cmd["GLOBAL"];
		   			for(var i in globalCMD){
			   			if(message.indexOf(globalCMD[i].command) !== -1){
			   				keyword = globalCMD[i].command;
			   				cmd = globalCMD;
			   				break;
			   			}

			   			if(message.indexOf(globalCMD[i].command2) !== -1){
			   				keyword = globalCMD[i].command;
			   				cmd = globalCMD;
			   				break;
		   				}	   			
		   			}
		   		}

		   		if(keyword) {
		   			for(var i in cmd){
			   			if(keyword === cmd[i].command || keyword === cmd[i].command2){
			   				// Check if theres type property
			   				if(!(cmd[i].hasOwnProperty('type'))){
			   					bot.sendMessage({
				   					to: channelID,
				   					message: "**Error** CMDS\n**Message**: No `\"type\"` property specified. Please check that your command properties are written correctly."
				   				});
				   				return;
			   				}
			   				// Check if typing is not a boolean
			   				if(cmd[i].hasOwnProperty('typing')){					
			   					if(typeof cmd[i].typing != 'boolean'){
			   						cmd[i].typing = false;
			   						bot.sendMessage({
			   							to: channelID, 
			   							message: "**Warning** CMDS\n**Message**: The property `\"typing\"` is not a boolean. Please make sure it is either `true` or `false` without quotes. Property set to `false`"
			   						});
			   					}
			   				}
			   				// Check if tts is not a boolean
			   				if(cmd[i].hasOwnProperty('tts')){					
			   					if(typeof cmd[i].tts != 'boolean'){
			   						cmd[i].typing = false;
			   						bot.sendMessage({
			   							to: channelID, 
			   							message: "**Warning** CMDS\n**Message**: The property `\"tts\"` is not a boolean. Please make sure it is either `true` or `false` without quotes. Property set to `false`"
			   						});
			   					}
			   				}

			   				if(cmd[i].type === "text"){
			   					if(!(cmd[i].hasOwnProperty('message'))){
				   					bot.sendMessage({
				   						to: channelID,
				   						message: "**Error** CMDS\n**Message**: No `\"message\"` property specified. Please check that your command properties are written correctly."
				   					});
				   					return;
			   					}

			   					if(cmd[i].hasOwnProperty('delay')){
			   						setTimeout( () => {			   							
			   							bot.sendMessage({
			   								to:channelID,
			   								message: String(cmd[i].message),
			   								typing: false,		// Until typing is fixed from the lib
			   								tts: cmd[i].tts
			   							});
			   						},cmd[i].delay);
			   						return;
			   					} else {
			   						bot.sendMessage({
			   							to:channelID,
			   							message: cmd[i].message,
			   							typing: false,
			   							tts: cmd[i].tts
			   						});
			   						return;
			   					}
			   				}

			   				if(cmd[i].type === "image"){
			   					if(!(cmd[i].hasOwnProperty('filename')) || !(cmd[i].hasOwnProperty('file'))){
			   						bot.sendMessage({
			   							to: channelID,
			   							message: "**Error** CMDS\n**Message**: No `\"filename\"` or `\"file\"` property specified. Please check that your command properties are written correctly."
			   						});
			   						return;
			   					}
			   					bot.uploadFile({
						            to: channelID,
						            file: cmd[i].file,
						            filename: cmd[i].filename,
						            message: cmd[i].message
						        }, (error,response) => {
						            if(error){
						                bot.sendMessage({
						                    to: channelID,
						                    message: "**Error**\n**Message**: "+error.message
						                });
						            }
						        });
						        return;
			   				}
			   				return;
			   			}
			   		}
		   		}
	   		});
	    }
	}
});
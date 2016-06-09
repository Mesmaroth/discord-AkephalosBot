var DiscordClient = require('discord.io');
var fs = require('fs');
var request = require('request');
var uptimer = require('uptimer');
var botLogin = require('./akebot/botLogin.js');
var cleverBot = require('./akebot/cleverBot.js');
var liveStream = require('./akebot/liveStream.js');
var bot = new DiscordClient({token: botLogin.token, autorun: true});	// Or add bot.email, bot.password
var reboot = false;
var delayMessage = true;			// Display error every minute
try {var botVersion = require('./package.json')["version"]}
catch(error) {console.log(error)};


// Sudo will be granted to the owner of the first server this bot is connected to. Be sure it's you. Otherwise you can edit it at the akebot/sudo.json file
function sudoCheck(){
	try {sudo = JSON.parse(fs.readFileSync('./akebot/sudo.json', 'utf8'))}
	catch(e) {var sudo = {"id":"","username": "", "checked": false}};
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

function setPresence(gameName){
    bot.setPresence({game: gameName});
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
    var adminRoleID = "";
    for(var i in bot.servers[bot.serverFromChannel(channelID)].roles){
        if(bot.servers[bot.serverFromChannel(channelID)].roles[i].name.toLowerCase() === "admin"){
            adminRoleID = bot.servers[bot.serverFromChannel(channelID)].roles[i].id;
            break;
        }
    }

    for(var i in bot.servers[bot.serverFromChannel(channelID)].members[userID].roles){                      
        if(bot.servers[bot.serverFromChannel(channelID)].members[userID].roles[i] === adminRoleID)
            return true
    }
    return false;
}

// Checks if the user is server owner.
function isGuildOwner(userID, channelID){
	if(bot.servers[bot.serverFromChannel(channelID)].owner_id === userID){
		return true;
	}
	return false;
}

// This checks if the user is the bot owner
function isDev(userID){
	try{var devID = JSON.parse(fs.readFileSync('./akebot/sudo.json', 'utf8')).id}
	catch(error) {if(error) return console.log(error)};
	if(userID === devID){
		return true;
	}
	return false;
}

function serversConnected(){
    var count = 0;
    for(var i in bot.servers){
        count++;
    }
    return count;
}

// bot.on('guildDelete', function (server){
// 	console.log(server)
// 	fs.writeFileSync("Guild_Delete.log",JSON.stringify(server,null,'\t'));
// });

bot.on('ready', function (rawEvent) {
    console.log("\nAkeBot v" + botVersion);
    console.log("Discord.io - Version: " + bot.internals.version);
    console.log("Username: " + bot.username + " - (" + bot.id + ")");
    setPresence("AkeBot v" + botVersion);    
    var serverList = [];    
    for(var i in bot.servers){
      serverList.push(bot.servers[i].name + ": (" + bot.servers[i].id + ")");
    }
    console.log("Servers: \n" + serverList.join('\n')+"\n");
    sudoCheck();
	
});

bot.on('disconnected', function(){
	if(reboot === true){
		reboot = false;			
		setTimeout( function () {
			console.log("Connecting...");
			bot.connect();
		}, 3000);
		return;
	}
    process.exit();
});

bot.on('message', function (user, userID, channelID, message, rawEvent) {
	if(channelID in bot.directMessages){
		if(rawEvent.d.author.username !== bot.username){
			bot.sendMessage({
				to: userID,
				message: "Direct messages for this bot are disabled."
			});
			setTimeout(bot.deleteChannel, 300, channelID);
		}		
	}
	else{			 // Else if Message is not a direct message
	    if(rawEvent.d.author.username !== bot.username){                 // Does not check for bot's own messages.        
	    	// ------ GlOBAL COMMANDS ---------
	        if(message === "~writeout" && isDev(userID)){
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

	        if((message === "~disconnect" || message === "~exit") && isDev(userID)){
	        	console.log("User disconnect")
	            bot.sendMessage({
	                to: channelID,
	                message: "*Exiting...*"
	            });

	            console.log("[DISCONNECTED]");
	            bot.disconnect();	            
	            return;
	        }

	        if(message === "~reboot" && (isAdmin(userID, channelID) || isDev(userID)) ){
	        	bot.sendMessage({
	                to: channelID,
	                message: "*Rebooting...*"
	            });
	            console.log("[REBOOTING]");
	           bot.disconnect();
	            reboot = true;
	            return;
	        }	        

	        if(message.search("~announce") === 0 && isDev(userID)){
	        	message = message.slice(10);
				for(var serverID in bot.servers){
					for(var channelID in bot.servers[serverID].channels){
						if(bot.servers[serverID].channels[channelID].name === "announcements" && bot.servers[serverID].channels[channelID].type === "text"){
							bot.sendMessage({
								to: bot.servers[serverID].channels[channelID].id,
								message: message
							})
							break;
						}
						else continue;
					}
				}
	        	return;
	        }

	        if(message.toLowerCase().search("~setgame") === 0 && isDev(userID)){
	            var message = message.slice(9);
	            setPresence(message);
	            if(message === ''){
			  		console.log("Game Presence set to: None");
			  	}
			  	else console.log("Game Presence set to: " + message);
	            return;
	        }

	        // ------------END of Global Commands------------

	        if(message.toLowerCase() === "!uptime"){
	            bot.sendMessage({
	                to: channelID,
	                message: botUptime()
	            });
	            return;
	        }

	        if(message.toLowerCase() === "!servers"){
	            bot.sendMessage({
	                to: channelID,
	                message: ("*Akephalos is connected to `" + serversConnected() +"` servers*")
	            });
	            return;
	        }

	        if(message.toLowerCase().search("!ask") === 0){ 
	        	cleverBot.askBot(bot, message, channelID);
	        	return;
	        }

	        if((message.toLowerCase() === "!invite")){
	        	bot.sendMessage({
	        		to: channelID, 
	        		message: "**Invite link:**\n"+bot.inviteURL
	        	});
	        	return;
	        }

	        if(message.search("!reverse") === 0){
	            var userString = message.slice(8);
	            userString = bot.fixMessage(userString);
	            var newWord = [];
	            for(var i = userString.length; i>0;i--){
	                newWord.push(userString[i-1]);
	            }
	            bot.sendMessage({
	                to: channelID,
	                message: newWord.join("")
	            });
	            return;
	        }

	         if(message.toLowerCase().search("no invite") >= 0) {
	            bot.sendMessage({
	                to: channelID,
	                message:"That's cold.",
	                typing: true
	            });
	        }

	        if(message.toLowerCase() === "!about"){
	        	var devName = "Undefined";
	        	try{devName = JSON.parse(fs.readFileSync('akebot/sudo.json','utf8')).username}
	        	catch(e) {if(error) console.log(error)};
	            bot.sendMessage({
	                to: channelID,
	                message: "\n**Bot Username:** "+bot.username+"\n**Bot Owner:** "+devName+"\n**Servers Connected:** "+serversConnected()+"\n"+
	                botUptime()+"\n**Version:** Akebot v" + botVersion + "\n**Author:** Mesmaroth\n**Written in:** Node.js\n"+
	                "**Library:** Discord.io\n**Library Version:** "+bot.internals["version"]+"\n**Avatar:** https://goo.gl/kp8L7m\n**Thanks to:** izy521, negativereview, yukine."
	            });
	            return;
	        }	        

	        if(message.toLowerCase().search("!stream") === 0){						// Check if user is streaming
	            var searchUser = message.slice(8);
	          	liveStream.getTwitchStream(searchUser, function(tiwtchStatus, twitchName, twitchGame, twitchUrl){
	          		if(tiwtchStatus){
	          			bot.sendMessage({
	          				to: channelID,
	          				message: "**Twitch**\n**User:** " + twitchName + "\n**Status:** `Online`\n**Game:** "+ twitchGame + "\n**Url:** " + twitchUrl
	          			});
	          			return;
	          		}
	          	});

	          	liveStream.getHitBoxStream(searchUser, function(hitboxStatus, hitboxName, hitboxGame, hitboxUrl){
	          		if(hitboxStatus){
	          			bot.sendMessage({
	          				to: channelID,
	          				message: "**HitBox**\n**User:** " + hitboxName + "\n**Status:** `Online`\n**Game:** "+ hitboxGame + "\n**Url:** " + hitboxUrl
	          			});
	          			return;
	          		}
	          	});	            
	        }

	        // List sounds in sounds directory
	        if(message.toLowerCase() === '!sounds'){				
	            var songList = fs.readdirSync('sounds');
	            for(var i = 0; i < songList.length; i++){
	            	songList[i] = songList[i].split('.');
	            	songList[i] = "`!"+songList[i][0]+"`";
	            }
	            bot.sendMessage({
	                to: channelID,
	                message: "\n**Sounds**\n"+songList.join("  ")
	            })
	            return;
	        }


	        if(message.search(/[!]help/i) === 0) {	        	
	        	if(message.search(" ") !== -1){
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
							"• `!stream [username]`: Checks if the user is live on Twitch or Hitbox or both\n"+
							"• `!ask [Question]`: Ask the bot anything\n"
	        			});
	        		}

	        		if(type === "admins" || type === "admin"){
	        			bot.sendMessage({
	        				to: channelID, 
	        				message: "**Admins** *Must be admin*\n"+
							"• `!say [message]`: Re-sends your message from any channel general channel\n"+
							"• `!purge all`: Deletes up to fifteen messages at a time. [Optional] Add a number to specifiy an amount up to 100\n"+
							"• `!purge me`: Deletes up to fifteen of your messages at a time. [Optional] Add a number to specifiy an amount up to 100\n"+
							"• `!purge bot`: Deletes up to fifteen of the bot's messages at a time. [Optional] Add a number to specifiy an amount up to 100.\n"+
							"• `!purge [Number]`: Deletes a specified amount of messages to be deleted\n"+							
							"• `!ban [@user] [days]`: Ban the mentioned user for X number of days.\n"+
							"• `!kick [@user]`: Kick the mentioned user from server.\n"
	        			});
	        		}

	        		if(type === "commands" || type === "command"){
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "**Commands**\n"+
	        				"• `!commands`: Show a list of all commands that are added\n"+
	        				"• `!cmd [command]`: Check a command's details. E.G author, type, message\n"+
							"• `!addcmd [command] [type] [message]`: Create a command \n"+
							"• `!appcmd [command] [2nd command]`: To add a second command to your command"+
							"• `!delcmd [command]`: Deletes your command if editable is true\n"+
							"• `!editcmd [command] [new command] [type] [message]`: Edit existing commands\n"
	        			});
	        		}

	        		if(type === "sounds" || type === "sound"){
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "**Sounds**\n"+
	        				"• `!sounds`: Displays a list of all sounds\n"+
							"• `!addsound`: Attach a mp3 file with this message to add a sound\n"+
							"• `!delsound [sound name]`: Delete a sound. Do not include the '!' prefix\n"
	        			});
	        		}
	        	}
	        	else{
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
	        if(message.toLowerCase().search("!say") === 0 && isAdmin(userID, channelID)){
	            var newMsg = message.slice(5);
	            var generalChannel = "";
	            for(var i in bot.servers[bot.serverFromChannel(channelID)].channels){
	                if(bot.servers[bot.serverFromChannel(channelID)].channels[i].type === "text" && bot.servers[bot.serverFromChannel(channelID)].channels[i].name.toLowerCase() === "general"){
	                    bot.sendMessage({
	                        to: bot.servers[bot.serverFromChannel(channelID)].channels[i].id,
	                        message: newMsg
	                    }, function (error){
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
	        if(message.toLowerCase().search("!purge") === 0 && isAdmin(userID, channelID)){
	        	var name = "";
	        	var max = 100;
	        	var amount = max;
	        	// Array of messageIDs to delete
	        	var msgArrIDs = [];				
	        	message = message.slice(7);
	        	if(message === "") return;
	        	if(message.search(' ') !== -1){
	        		message = message.split(' ');
	        		name = message[0].toLowerCase();
	        		amount = Number(message[1]) + 1;

	        		if(name === "me") {
	        			name = user.toLowerCase();
	        			amount+=1;
	        		}
	        		if(name === "bot") name = bot.username.toLowerCase();
	        	}
	        	// Else if the user wants to either purge messages with a specific amount or purging all messages of a user
	        	else{
	        		name = message;
	        		if(!(isNaN(message))){
		        		name = Number(message);
		        		amount = name + 1;
		        	}
		        	if(name === "me") {
	        			name = user.toLowerCase();
	        			amount+=1;
	        		}
		        	if(name === "bot") name = bot.username.toLowerCase();
	        	}

		        if(name === "all"){	        		
	        		bot.getMessages({
	        			channel: channelID,
	        			limit: amount
	        		}, function(error, messageArr){	        				        			
	        			for(var i = 0; i < messageArr.length; i++){
	        				msgArrIDs.push(messageArr[i].id);	        				
	        			}
	        			bot.deleteMessages({channelID: channelID,messageIDs: msgArrIDs});
	        		})
	        		return;
	        	}

	        	if(typeof name === 'number'){     		
	        		bot.getMessages({
	        			channel: channelID,
	        			limit: amount
	        		}, function(error, messageArr){
	        			for(var i = 0; i < messageArr.length; i++){
	        				msgArrIDs.push(messageArr[i].id);
	        			}
	        			bot.deleteMessages({channelID: channelID,messageIDs: msgArrIDs});
	        		})
	        		return;
	        	}
	        	
	        	if(typeof name === 'string'){
		        	var targeMsgs = [];	        	
		        	bot.getMessages({
		        		channel: channelID,
		        		limit: max
		        	}, function(error, messageArr){
		        		// Push only the username specified to the target list
		        		for(var i = 0; i < messageArr.length; i++){
		        			if(messageArr[i].author.username.toLowerCase() === name){		        				
		        				targeMsgs.push(messageArr[i]);
		        			}
		        		}
		        		if(targeMsgs.length <= 0){
		        			bot.sendMessage({to: channelID, message: "*No messages found.*"});
		        			return;
		        		}

		        		// Pushing the amount specified to list of IDs to delete. If no amount specified then it will default to max amount of messages
		        		for(var i = 0; i < targeMsgs.length; i++){
		        			if(i === amount-1) break;
		        			msgArrIDs.push(targeMsgs[i].id);		        			
		        		}

		        		// If the list of messages to be deleted is greater than 2 then use bot.deletemessages to mass delete
		        		if(msgArrIDs.length < 3 && msgArrIDs.length > 0){
		        			for(var i = 0; i < msgArrIDs.length; i++){
		        				bot.deleteMessage({
		        					channel: channelID,
		        					messageID: msgArrIDs[i]
		        				});
		        			}
		        		}
		        		else{
		        			bot.deleteMessages({channelID: channelID,messageIDs: msgArrIDs}, function(error, response){
			        			if(error) console.log(error);
			        		});
		        		}
			        		
		        	});	        	
		        	return;
	        	}		        	
	        }

	        if(message.toLowerCase().search("!kick") === 0 && isAdmin(userID, channelID)){
	        	if(message.search(" ") !== -1){
	        		message = message.split(" ");       		
	        		// Check for mentions
	        		if(rawEvent.d.mentions.length > 0){
	        			var targetID = rawEvent.d.mentions[0].id;
	        			var targetName = rawEvent.d.mentions[0].username;

	        			bot.kick({
	        				channel: channelID,
	        				target: targetID
	        			}, function(error){
	        				if(error) return console.log(error);
	        				bot.sendMessage({
		        				to: channelID,
		        				message: targetName + " has been kicked."
	        				});
	        			});
	        			
	        		}
	        		else{
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "No user was mentioned."
	        			});
	        		}
	        	}
	        	return;
	        }

	        if(message.toLowerCase().search("!ban") === 0 && isAdmin(userID, channelID)){
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
	        			}, function(error) {
	        				if(error) return console.log(error);
	        				bot.sendMessage({
		        				to: channelID,
		        				message: targetName + " has been banned for `" + message[2] + "` days."
		        			});
	        			});
		        			
	        		}
	        		else{
	        			bot.sendMessage({
	        				to: channelID,
	        				message: "No user was mentioned."
	        			});
	        		}
	        	}
	        	return;
	        }

	        if(message.toLowerCase() === "!date"){
	            bot.sendMessage({
	                to: channelID,
	                message: printDateTime("date")
	            });
	            return;
	        }

	        if(message.toLowerCase() === "!time"){
	            bot.sendMessage({
	                to: channelID,
	                message: printDateTime("time")
	            });
	            return;
	        }

	        if(message === "!commands") {
	   			try{
	   				var file = fs.readFileSync('akebot/botCommands.json', 'utf8');
	   				file = JSON.parse(file);
	   			}
	   			catch(error) {if(error) return console.log(error)};

	   			var commands = [];
	   			for(var i = 0 ; i < file.length; i++){
	   				if(file[i].editable === true){
	   					commands.push((i+1)+". " + bot.fixMessage(file[i].command) + "         Editable: " + file[i].editable);
	   				}
	   				else commands.push((i+1)+". " + bot.fixMessage(file[i].command));
	   			}
	   			
	   			bot.sendMessage({
	   				to: channelID,
	   				message: "\n**Commands**\n```javascript\n" + commands.join('\n') + "\n```"
	   			});
	   			return;
	   		}

	   		// Add a command
	   		if(message.toLowerCase().search("!addcmd") === 0){
	   			var cmd = "";
	   			var type = "";
	   			var output = [];
	   			var reservedCMDS = ['!commands', '!time', '!date', '!purge', '!servers', '!stream',
	   			'!streamwatch', '!uptime', '!help', '!addcmd', '!delcmd','!editcmd',
	   			'!cmd', '!appcmd', '!sounds', '!addsound', '!delsound', '!say', '!reverse', '!about', '!ban', '!kick' ]
	   			message = message.slice(8);

	   			// Catch any errors reading botCommands
	   			try{
				   	var commands = fs.readFileSync('./akebot/botCommands.json', 'utf8')
				   	commands = JSON.parse(commands);
				}
				catch(error) {
					bot.sendMessage({
						to: channelID,
						message: "**Error:**\n```javascript\n" + error + "\n```"
					})
					if(error) return console.log(error);
				}
				// Check if user forgot to put anything after the command is called.
	   			if(message.search(" ") !== -1){
	   				message = message.split(" ");
	   				cmd = message[0].toLowerCase();
	   				type = message[1];

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
	   					if(reservedCMDS[i] === cmd){
	   						bot.sendMessage({
	   							to: channelID,
	   							message: "*This command `" + cmd +"` is reserved for the bot.*"
	   						});
	   						return;
	   					}
	   				}

				   	// Adds everything after the second index which is 'type'
	   				for(var i = 2; i < message.length; i++){		
	   					output.push(message[i]);
		   			}
		   			output = output.join(" ");	

	   				// Text type
	   				if(type.toLowerCase() === "text"){

	   					// Check if the commands already exist
		   				for(var i = 0; i < commands.length; i++){ 	
		   					if((commands[i].command === cmd || commands[i].command2 === cmd) && commands[i].editable === true){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Error:** This command already exist but is editable. Use `!editcmd` instead.`\n```javascript\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
		   						});
		   						return;
		   					}

		   					if((commands[i].command === cmd || commands[i].command2 === cmd)  && commands[i].editable === false){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Error:** This command already exist and isn't editable.\n```javascript\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
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
		   				commands.push({
		   					command: cmd.toLowerCase(),
		   					type: type,
		   					author: user.toLowerCase(),
		   					message: output,
		   					editable: true		   					
		   				});
		   				fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands,null,'\t'));
		   				bot.sendMessage({
		   					to: channelID,
		   					message: "\n**Command Added**\n```javascript\nCommand: <"+bot.fixMessage(cmd)+">\nType: " + type +"\nBy: <"+ user +">\nMessage: " + bot.fixMessage(output)+ "```"
		   				});
		   				return;
	   				}

	   				// Image type
	   				if(type.toLowerCase() === 'image'){

	   					// Check if the command already exist
		   				for(var i = 0; i < commands.length; i++){
		   					if((commands[i].command === cmd || commands[i].command2 === cmd) && commands[i].editable === true){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Error:** This command already exist but is **editable**. Use `!editcmd` instead.\n```javascript\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
		   						});
		   						return;
		   					}

		   					if((commands[i].command === cmd || commands[i].command2 === cmd)  && commands[i].editable === false){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Error:** This command already exist.\n```javascript\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
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
	   					}
	   					else{
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
		   				commands.push({
		   					command: cmd.toLowerCase(),
		   					type: type,
		   					author: user.toLowerCase(),
		   					file: location+fileName,
		   					filename: fileName ,
		   					message: output,
		   					editable: true	
		   				});
		   				fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands,null,'\t'));

		   				// Display feedback whether command has a message or not.
		   				if(noMsg) {
		   					delete commands[commands.length - 1].message;
		   					bot.sendMessage({
		   						to: channelID,
		   						message: "\n**Command Added**\n```javascript\nCommand: <"+bot.fixMessage(cmd)+">\nType: " + type +"\nBy: <"+ user + ">\nPath: " + location+fileName+
		   						"\nFilename: " + fileName + "```"
		   					});
		   				}
		   				else {
		   					bot.sendMessage({
			   					to: channelID,
			   					message: "\n**Command Added**\n```javascript\nCommand: <"+bot.fixMessage(cmd)+">\nType: " + type +"\nBy: <"+ user + ">\nPath: "+ location+fileName+
			   					"\nFilename: " + fileName + "\nMessage: " + bot.fixMessage(output)+ "```"
		   					});
		   				}		   					   				
		   				return;
	   				}

	   				bot.sendMessage({
	   					to: channelID, 
	   					message: "**Error:** No `type` found. Use `text` or `image` and be sure you are following this format:`!addcmd [COMMAND] [TYPE] [MESSAGE]`"
	   				});

	   			}
	   			return; 
	   		}

	   		if(message.toLowerCase().search('!delcmd') === 0 && isAdmin(userID, channelID)){
	   			message = message.slice(8);
	   			try{ 
	   				var commands = JSON.parse(fs.readFileSync('./akebot/botCommands.json', 'utf8'));
	   			}
	   			catch(error) {
	   				if(error) {
	   					console.log(error)
	   					bot.sendMessage({
	   						to: channelID,
	   						message: "**Error:** Please check your *botCommands.json* file.\n```javascript\n" + error + "\n```"
	   					});
	   					return;
	   				}
	   			};

	   			for(var i = 0; i < commands.length; i++){
	   				if(commands[i].command === message || commands[i].command2 === message){
	   					if(commands[i].editable === true){
	   						if(commands[i].hasOwnProperty('file')){
	   							var location = commands[i].file;
	   							fs.unlink(location, function(error){
	   								if(error) console.log(error);
	   							});
	   						}
	   						if(commands[i].type === "image"){
	   							commands.splice(i,1);
	   							fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'));
	   							bot.sendMessage({
		   							to: channelID,
		   							message: "*Command `" + bot.fixMessage(message) + "` has been deleted.*"
		   						});
		   						return;
	   						}

	   						if(commands[i].type === "text"){
	   							commands.splice(i,1);
		   						fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'));
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "*Command `" + bot.fixMessage(message) + "` has been deleted.*"
		   						});
		   						return;
	   						}
	   					}
	   					else if(commands[i].editable === false){
	   						bot.sendMessage({
	   							to: channelID,
	   							message: "\n**Error**: *This command is not deletable.*"
	   						});
	   						return;
	   					}
	   				}
	   			}
	   			bot.sendMessage({
	   				to: channelID,
	   				message: "\n**Error:** *No Command found.*"
	   			});
	   			return;
	   		}

	   		// Edit a command
	   		if(message.search('!editcmd') === 0){
	   			if(message.search(' ') != -1){
	   				message = message.split(" ");
	   				if(message.length < 4) return;   				
	   				var cmd = message[1].toLowerCase();
	   				var newCmd = message[2].toLowerCase();
	   				var type = message[3].toLowerCase();
	   				var msg = [];	   				

	   				// Push everything after the 4th index as a message
	   				for(var i = 4; i < message.length; i++){
	   					msg.push(message[i]);
	   				}
	   				msg = msg.join(" ");
	   				if(msg === '') msg = null;

	   				// Check for errors and read botComamnds list
	   				try{
	   					var commands = JSON.parse(fs.readFileSync('./akebot/botCommands.json'));
	   				}
	   				catch(error) {
	   					if(error) {
		   					console.log(error)
		   					bot.sendMessage({
		   						to: channelID,
		   						message: "**Error:** Please check your *botCommands.json* file.\n```javascript\n" + error + "\n```"
		   					});
		   					return;
	   					}
	   				};

	   				for(var i = 0; i < commands.length; i++){
	   					if(commands[i].command === cmd){
	   						if(commands[i].editable || isDev(userID)){
	   							var author = user.toLowerCase();
	   							if(isDev(userID)) author = null;

	   							// Editing text commands
		   						if(type === "text"){
		   							var oldCMD = commands[i].command;
		   							var oldMsg = "None";

		   							if(commands[i].hasOwnProperty("message")) oldMsg = commands[i].message;
		   							if(msg === null){		   								
		   								bot.sendMessage({
			   								to: channelID,
			   								message: "**Error:** No message was added."
		   								});
		   								return;		   								
		   							}

		   							// If the command was an image type, the image is then removed
		   							if(commands[i].type === "image"){
		   								fs.unlink(commands[i].file, function (error){
		   									if(error) console.log(error);
		   								});
		   								delete commands[i].file;
		   								delete commands[i].filename;		   								
		   							}
		   							
		   							commands[i].command = newCmd;
		   							commands[i].type = type;
		   							commands[i].message = msg;
		   							if(author !== null) commands[i].author = author;

		   							bot.sendMessage({
		   								to: channelID,
		   								message: "\n**Command Edited**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) +">\nType: " + commands[i].type +
		   								"\nBy: <"+user+ ">\nMessage: <" + bot.fixMessage(commands[i].message) + ">\nOld Message: <" + bot.fixMessage(oldMsg) + ">\n```"
		   							});

		   							fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'), 'utf8');
		   							return;
		   						}

		   						// Editing image commands
		   						if(type === "image"){
		   							var oldCMD = commands[i].command;
		   							var oldMsg = "None";		   							
		   							var location = "pictures/"

		   							if(commands[i].hasOwnProperty('message')) oldMsg = commands[i].message;
		   							if(msg === null){
		   								if(commands[i].hasOwnProperty('message')){
		   									delete commands[i].message;
		   								}
		   								msg = "None";
		   							}
		   							else{
		   								commands[i].message = msg;
		   							}
		   							
		   							/*	If no image is uploaded when this command is executed then it assumes
		   							/	you are editing the command or adding/removing the message. Keeping the
		   							/	image intact and will still be uploaded when the new command is executed.
		   							*/
		   							if(rawEvent.d.attachments.length === 0){
		   								if(commands[i].type === "text"){
			   								bot.sendMessage({
			   									to: channelID,
			   									message: "**Error:** `" + cmd+ "` isn't an image type command. Upload an image with this command to convert it to image."
			   								});
			   								return;
		   								}
		   								commands[i].command = newCmd;
		   								commands[i].type = type;
		   								commands[i].author = user.toLowerCase();
		   								

		   								bot.sendMessage({
			   								to: channelID,
			   								message: "\n**Command Edited**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) + ">\nType: " + commands[i].type +
			   								"\nBy: " + user + "\nPath: " + commands[i].file + "\nFile Name: " + commands[i].filename+
			   								"\nMessage: <" + bot.fixMessage(msg) +">\nOld Message: <" + bot.fixMessage(oldMsg) + ">\n```"
		   								});
		   								fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'), 'utf8');
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

		   								if(commands[i].hasOwnProperty('file') && commands[i].hasOwnProperty('filename')){
		   									var oldFileName = commands[i].filename;		   							
		   									var oldFile = commands[i].file;
		   									fs.unlink(oldFile, function(error){
		   										if(error) console.log(error);
		   									});
		   									isText = false;
		   								}
		   								else isText = true; 								
		   								
		   								
		   								request(url).pipe(fs.createWriteStream(file));		   								

		   								commands[i].command = newCmd;
		   								commands[i].type = type;
		   								commands[i].author = user.toLowerCase();
		   								commands[i].filename = fileName;
		   								commands[i].file = file;

		   								if(isText){
		   									bot.sendMessage({
		   										to: channelID,
		   										message: "\n**Command Edited**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) + ">\nType: " + commands[i].type +
		   												 "\nBy: " + user +"\nFile Name: " + commands[i].filename+"\nPath: " + commands[i].file+ 
		   												 "\nMessage: <" + bot.fixMessage(msg) + ">\nOld Message: <" +  + ">\n```"
		   									})
		   								}
		   								else{
		   									bot.sendMessage({
				   								to: channelID,
				   								message: "\n**Command Edited**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nOld Command: <" + bot.fixMessage(oldCMD) + ">\nType: " + commands[i].type +
			   											 "\nBy: " + user +"\nFile Name: " + commands[i].filename + "\nOld File Name: " + oldFileName + "\nPath: " + commands[i].file + "\nOld Path: " + oldFile + 
			   											 "\nMessage: <" + bot.fixMessage(msg) +">\nOld Message: <"+bot.fixMessage(oldMsg) +">\n```"		   								
			   								});
		   								}
			   								
		   								fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'), 'utf8');
		   							}
		   							return;
		   						}
	   						}
	   						else{
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
	   			}
	   			return;
	   		}

	   		// Append a second command to a command.
	   		if(message.toLowerCase().search("!appcmd") === 0){	   			
	   			if(message.search(" ") !== -1){
	   				message = message.split(" ");
	   				var cmd = message[1].toLowerCase();
	   				if(message.length > 2) var cmd2 = message[2].toLowerCase();
	   				try{
	   					var commands = JSON.parse(fs.readFileSync('./akebot/botCommands.json', 'utf8'));
	   				}
	   				catch (error){ if(error) return console.log(error)};

	   				// Remove the second command from command if no command is entered.
	   				if(message.length === 2){
	   					for(var i = 0 ; i < commands.length; i++){
	   						if(cmd === commands[i].command || cmd === commands[i].command2){
		   						if(commands[i].editable){
		   							var author = "Server";
		   							if(commands[i].hasOwnProperty("author")) author = commands[i].author;

		   							if(commands[i].hasOwnProperty("command2")){
		   								delete commands[i].command2;

			   							if(commands[i].type === "text"){
				   							bot.sendMessage({
				   								to: channelID,
				   								message: "**Second Command Removed**\n```javascript\nCommand: <" + commands[i].command + ">\nType: " + commands[i].type + "\nBy: <" + author + ">\nMessage: <" + commands[i].message + ">\n```"
				   							});
			   							}

			   							if(commands[i].type === "image"){
				   							if(commands[i].hasOwnProperty("message")){
				   								bot.sendMessage({
					   								to: channelID,
					   								message: "**Second Command Removed**\n```javascript\nCommand: <" + commands[i].command + ">\nType: " + commands[i].type + 
					   								"Path: " + commands[i].file +"\nFile Name: " + commands[i].filename + "\nBy: <" + author + ">\nMessage: <" + commands[i].message  + ">\n```"
					   							});
				   							}
				   							else{
				   								bot.sendMessage({
					   								to: channelID,
					   								message: "**Second Command Removed**\n```javascript\nCommand: <" + commands[i].command + ">\nType: " + commands[i].type +
					   								"Path: " + commands[i].file +"\nFile Name: " + commands[i].filename + "\nBy: <" + author + ">\n```"
					   							});
				   							}	   							
				   						}

				   						fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'));			   						   								
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
	   				for(var i = 0; i < commands.length; i++){
	   					if(cmd === commands[i].command || cmd === commands[i].command2){
	   						if(commands[i].editable){
	   							var author = "Server";
	   							if(commands[i].hasOwnProperty("author")) author = commands[i].author;

	   							commands[i].command2 = cmd2;

		   						if(commands[i].type === "text"){
		   							bot.sendMessage({
		   								to: channelID,
		   								message: "**Command Appended**\n```javascript\nCommand: <" + commands[i].command + ">\nCommand 2: <" + commands[i].command2 + ">\nType: " + commands[i].type +
		   								"\nBy: " + author + "\nMessage: " + commands[i].message + "\n```"
		   							});
		   						}

		   						if(commands[i].type === "image"){
		   							if(commands[i].hasOwnProperty("message")){
		   								bot.sendMessage({
			   								to: channelID,
			   								message: "**Command Appended**\n```javascript\nCommand: <" + commands[i].command + ">\nCommand 2: <" + commands[i].command2 + ">\nType: " + commands[i].type +
			   								"Path: " + commands[i].file +"\nFile Name: " +commands[i].filename + "\nBy: <" + author + ">\nMessage: <" + commands[i].message  + ">\n```"
			   							});
		   							}
		   							else{
		   								bot.sendMessage({
			   								to: channelID,
			   								message: "**Command Appended**\n```javascript\nCommand: <" + commands[i].command + ">\nCommand 2: <" + commands[i].command2 + ">\nType: " + commands[i].type +
			   								"Path: " + commands[i].file +"\nFile Name: " +commands[i].filename + "\nBy: <" + author + ">\n```"
			   							});
		   							}	   							
		   						}
		   						fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'));
		   						return;	
	   						}
	   					}
	   				}

	   				bot.sendMessage({
	   					to: channelID, 
	   					message: "`"+cmd+"` isn't editable."
	   				});

	   			}
	   			return;
	   		}

	   		// Displays details of the command
	   		if(message.toLowerCase().search("!cmd") === 0){
	   			message = message.slice(5);
	   			try{ 
		   			var commands = fs.readFileSync('./akebot/botCommands.json', 'utf8');
		   			commands = JSON.parse(commands);
		   		}
		   		catch(error) {if(error) return console.log(error)};
		   		var author = "Server";
		   		for(var i = 0; i < commands.length; i++){
		   			if(commands[i].command === message || commands[i].command2 === message){
		   				if(commands[i].hasOwnProperty("author")){
		   					author = commands[i].author;
		   				}

		   				if(commands[i].type === 'text'){		   					
			   				if(commands[i].hasOwnProperty("command2")){
			   					bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nCommand 2: <"+ bot.fixMessage(commands[i].command2)+ ">\nType: " + commands[i].type +"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(commands[i].message) + "```"
			   					});
			   					return;
			   				}
			   				
			   				bot.sendMessage({
			   					to: channelID,
			   					message: "\n**Command**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nType: " + commands[i].type +"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(commands[i].message) + "```"
			   				});
			   				return;
		   				}

		   				if(commands[i].type === 'image'){
		   					var message = "None";
		   					if(commands[i].message !== ""){
		   						message = commands[i].message;
		   					}

		   					if( commands[i].hasOwnProperty('message') && commands[i].hasOwnProperty("command2")){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nCommand 2: <"+ bot.fixMessage(commands[i].command2) + ">\nType: " + commands[i].type +"\nPath: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(message) + "```"
			   					});
			   					return;
		   					}
		   					if( commands[i].hasOwnProperty('message') && !(commands[i].hasOwnProperty("command2")) ){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) +">\nType: " + commands[i].type +"\nPath: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\nMessage: " + bot.fixMessage(message) + "```"
			   					});
		   						return;
		   					}

		   					if( !(commands[i].hasOwnProperty('message')) && commands[i].hasOwnProperty("command2")){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nCommand 2: <" + bot.fixMessage(commands[i].command2) + ">\nType: " + commands[i].type +"\nPath: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\n```"
			   					});
		   						return;
		   					}

		   					if( !(commands[i].hasOwnProperty('message')) && !(commands[i].hasOwnProperty("command2")) ){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <" + bot.fixMessage(commands[i].command) + ">\nType: " + commands[i].type +"\nPath: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\n```"
			   					});
		   						return;
		   					}
		   				}
		   			}
		   			
		   		}
		   		bot.sendMessage({
		   			to: channelID,
		   			message: "*No command found.*"
		   		});
		   		return;
	   		}

	   		// Add sounds to play
	   		if(message.toLowerCase() === "!addsound"){
	   			if(rawEvent.d.attachments.length > 0){
	   				var url = rawEvent.d.attachments[0].url;
	   				var fileName = rawEvent.d.attachments[0].filename.toLowerCase();
	   				var songName = fileName.split(".")[0];
	   				var extension = fileName.split(".")[1];
	   				var sounds = fs.readdirSync('./sounds/');
	   				if(extension !== "mp3"){
	   					bot.sendMessage({
	   						to: channelID,
	   						message: "**Error:** This file is not a `.mp3` file."
	   					});
	   					return;
	   				}
	   				
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
	   						fs.writeFile('./sounds/'+fileName, data, function (error){
	   							if(error) return console.log(error);
	   							bot.sendMessage({
				   					to: channelID,
				   					message: "**Sound Added**\nUse `!" + songName + "` to play." 
				   				});
	   						});
	   					}
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
	   		if(message.toLowerCase().search("!delsound") === 0 && isAdmin(userID, channelID)){
	   			if(message.search(" ") !== -1){
	   				message = message.split(" ");
	   				var sound = message[1].split(".")[0];
	   				var soundList = fs.readdirSync('./sounds/');

	   				for(var i = 0; i < soundList.length; i++){
	   					if(sound === soundList[i].split(".")[0]){
	   						fs.unlink('./sounds/'+soundList[i], function(error){
	   							if(error) {
	   								console.log(error);
	   								bot.sendMessage({
	   									to: channelID,
	   									message: "**Error:** Please make sure the sound isn't playing first."
	   								});
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
	   					message: "No sound found."
	   				});
	   			}
	   			return;
	   		}

	   		// Play sound if command equals to sound name
	        if(message.toLowerCase().search("!") === 0){
	        	var inVC = false;
	        	if(message.length > 1) {
	        		var voiceID = "";
	        		var server = bot.servers[bot.serverFromChannel(channelID)];
	        		for(var channel in server.channels){
	        			if(server.channels[channel].type === "voice"){
	        				if(userID in server.channels[channel].members) {
	        					voiceID = server.channels[channel].id; 
	        					inVC = true;
	        				}
	        				break;       				
	        			}
	        		}

		        	if(inVC){
		        		var soundName = message.slice(1);
		        		var soundsList = fs.readdirSync('./sounds');
		        		for(var i = 0; i < soundsList.length; i ++){
		        			if(soundName.toLowerCase() + '.mp3'  === soundsList[i]){
		        				var soundfile = './sounds/' + soundsList[i];		        			
			        			var voiceID = bot.servers[bot.serverFromChannel(channelID)].channels[channel].id;
			        			bot.joinVoiceChannel(voiceID, function (){
				        			bot.getAudioContext({channel: voiceID, stereo: true}, function (stream) {
				        				stream.playAudioFile(soundfile);
				        				stream.once('fileEnd', function () {
				        					bot.leaveVoiceChannel(voiceID);
				        				});
				        			});
			        			});
			        			break;  			
			        		}		        		
		        		}
		        	}
	        	}
	        	
	        }

	        // Check message to see if it triggers any commands in botCommands.json
	        
	   		try{var file = fs.readFileSync('./akebot/botCommands.json', 'utf8')}
	   		catch(error) {
	   			if(delayMessage){
	   				bot.sendMessage({
		   				to:channelID, 
		   				message:"**Error:** Please check your botCommands.json file\n```javascript\n"+error+"\n```"
	   				});
	   				delayMessage = false;
	   				setTimeout(function () { delayMessage = true;}, 60000);
	   			}	   			
	   			return;
	   		};
	   		// Check for any errors when parsing file
	   		try{var cmd = JSON.parse(file)}
	   		catch(error){
		   		if(delayMessage){
		   			bot.sendMessage({
		   				to:channelID,
		   				message: "**Error:** CMDS\n**Message**: *Your 'botCommands.json' file is causing an error, please revise!*```javascript\n"+error+"\n```"
		   			});
		   			delayMessage = false;
		   			setTimeout(function () { delayMessage = true;}, 60000);
		   		}		   		
	   			return;
	   		};
	   		for(var i in cmd){
	   			if(message.toLowerCase() === cmd[i].command || message.toLowerCase() === cmd[i].command2){
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
	   						setTimeout(function(){
	   							bot.sendMessage({
	   								to:channelID,
	   								message: String(cmd[i].message),
	   								typing: cmd[i].typing,
	   								tts: cmd[i].tts
	   							});
	   						},cmd[i].delay);
	   					}
	   					else if (!(cmd[i].hasOwnProperty('delay'))){
	   						bot.sendMessage({
	   							to:channelID,
	   							message: cmd[i].message,
	   							typing: cmd[i].typing,
	   							tts: cmd[i].tts
	   						});
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
				        }, function(error,response){
				            if(error){
				                bot.sendMessage({
				                    to: channelID,
				                    message: "**Error**\n**Message**: "+error.message
				                });
				            }
				        });
	   				}
	   			}
	   		}

	    }
	}

});
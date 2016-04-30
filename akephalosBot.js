var DiscordClient = require('discord.io');
var fs = require('fs');
var botLogin = require('./akebot/botLogin.js');
//var botEvents = require('./akebot/botEvents.js');
var botSounds = require('./akebot/botSounds.js');
var cleverBot = require('./akebot/cleverBot.js');
var twitchClient = require('./twitch/twitch.js');
var uptimer = require('uptimer');
var bot = new DiscordClient({
    token: botLogin.token,	// Or bot.email, bot.password
    autorun: true
});
var reboot = false;
var isBotDevSet = false;

function getBotDev(){
	for(var servers in bot.servers){

	}
}

try {var botVersion = "Akebot v"+ require('./package.json')["version"]}
catch(error) {console.log(error)};
var gameList = [];					 // set Games

function printDateTime(){       // month-day-year time for CLI
    var d = new Date();
    var dHours = (d.getHours() < 12) ? d.getHours().toString() : (d.getHours()-12).toString();
    var dMinutes = (d.getMinutes()<10) ? "0"+d.getMinutes().toString()+ "AM" : d.getMinutes().toString()+ "PM";
    return d.toDateString()+" at "+dHours+":"+dMinutes;
}

function botGetDate(){
    var d = new Date();
    return d.toDateString();
}

function botGetTime(){
    var d = new Date();
    var dHours = d.getHours().toString();
    var dMinutes = (d.getMinutes()<10) ? "0"+d.getMinutes().toString() : d.getMinutes().toString();
    if(dHours < 12)
        return dHours + ":" + dMinutes + " AM";
    else if (dHours > 12)
        return (dHours-12) + ":" + dMinutes + " PM";
}

function setPresence(name){
    bot.setPresence({game: name});
  	if(name === ''){
  		console.log("Game Presence set to: None");
  	}
  	else
    	console.log("Game Presence set to: " + name);
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

	return "**Uptime:** *"+upHours+" hours : "+upMinutes+" minutes : "+upSeconds+" seconds*";
}

function checkAdminPermission (userID, channelID){           // Checks if the User is Admin
    var adminRoleID = "";
    for(var i in bot.servers[bot.serverFromChannel(channelID)].roles){
        if(bot.servers[bot.serverFromChannel(channelID)].roles[i].name.toLowerCase() === "admin"){          // Checks to see what admin's ID is
            adminRoleID = bot.servers[bot.serverFromChannel(channelID)].roles[i].id;
            break;
        }
    }

    for(var i in bot.servers[bot.serverFromChannel(channelID)].members[userID].roles){                      
        if(bot.servers[bot.serverFromChannel(channelID)].members[userID].roles[i] === adminRoleID)          // Checks user's roles if user is admin
            return true
    }
    return false;
}

function isGuildOwner(userID, channelID){
	if(bot.servers[bot.serverFromChannel(channelID)].owner_id === userID){
		return true;
	}
	else return false;
}

function serversConnected(){
    var count = 0;
    for(var i in bot.servers){
        count++;
    }
    return count;
}

function botAnnounce(message){
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
}

bot.on('debug', function (event) {
	if(event.t === "GUILD_DELETE"){					// Test to log when the bot is kicked
		console.log(event);
		fs.writeFileSync("GUILD_DELETE.log","Kicked from Server:\n"+JSON.stringify(event,null,'\t'));
	}

});

bot.on('ready', function (rawEvent) {
    console.log("\n" + botVersion);
    console.log("Discord.io - Version: " + bot.internals.version);
    console.log("Username: "+bot.username + " - (" + bot.id + ")");
    bot.setPresence({game: (gameList.length === 0) ? botVersion : gameList[Math.floor(Math.random()*gameList.length)]});
    var serverList = [];    
    for(var i in bot.servers){
      serverList.push(bot.servers[i].name + ": (" + bot.servers[i].id + ")");
    }
    console.log("Servers: \n" + serverList.join('\n')+"\n");
});

bot.on('disconnected', function(){
	if(reboot === true){
		reboot = false;
		console.log("Connecting...");
		bot.connect();
	}
    
});


bot.on('message', function (user, userID, channelID, message, rawEvent) {
	if(channelID in bot.directMessages){
		if(rawEvent.d.author.username !== bot.username){
			bot.sendMessage({
				to: userID,
				message: "Direct Messages for this bot are disabled."
			});
			bot.deleteChannel(channelID);
		}
		
	}
	else{			 // Else if Message is not a direct message
	    if(rawEvent.d.author.username !== bot.username){                 // Does not check for bot's own messages.        
	    	// ------ GlOBAL COMMANDS ---------
	    	if(message.search('~') === 0 && isGuildOwner(userID, channelID) === false){						// Checks to make sure 
	    		bot.sendMessage({
	    			to: channelID,
	    			message: "*Global commands are for the bot Owner only.*"
	    		});
	    		return;
	    	}

	        if(message.toLowerCase() === "~writeout" && isGuildOwner(userID, channelID)){
	            fs.writeFile('bot.JSON', "Updated at: "+ printDateTime() + "\n\n" + JSON.stringify(bot, null, '\t'), function(error){
	                if(error) throw error;
	                console.log("Succesfully written bot properties");
	                bot.sendMessage({
	                    to: channelID,
	                    message: "*Succesfully written bot properties*"
	                });
	            });
	        }

	        if(message.toLowerCase() === "~test" && isGuildOwner(userID, channelID)){
	        	var data = writeObjToFile(bot.serverFromChannel(channelID));
	        	bot.sendMessage({
	        		to: channelID,
	        		message: "```javascript\n"+data+"\n```"
	        	});
	        }

	        if(message === "~disconnect" && isGuildOwner(userID, channelID)){
	            bot.sendMessage({
	                to: channelID,
	                message: "*Exiting...*"
	            });
	            bot.disconnect();
	            console.log("[DISCONNECTED]");
	        }

	        if(message === "~reboot" && isGuildOwner(userID, channelID)){
	        	bot.sendMessage({
	                to: channelID,
	                message: "*Rebooting...*"
	            });
	            console.log("[REBOOTING]");
	           setTimeout(()=>{ bot.disconnect()}, 2000);
	            reboot = true;
	        }

	        if(message.toLowerCase().search("~announce") === 0 && isGuildOwner(userID, channelID)){
	        	botAnnounce(message);
	        }

	        // ------------END of Global Commands------------

	        if(message.toLowerCase() === "!uploadfile"){
	        	if(rawEvent.d.attachments.length > 0){
	        		bot.sendMessage({
	        			to:channelID,
	        			message: "\n**URL**\n```javascript\n"+JSON.stringify(rawEvent.d.attachments[0], null, '\t')+"\n```"
	        		});
	        	}
	        	return;
	        }

	        if(message.toLowerCase().search("!setgame") === 0 && checkAdminPermission(userID, channelID)){
	            var message = message.slice(9);
	            setPresence(message);
	            return;
	        }

	        if(message.toLowerCase() === "!uptime"){
	            bot.sendMessage({
	                to: channelID,
	                message: botUptime()
	            });
	            return;
	        }

	        if(message === "!servers"){
	            bot.sendMessage({
	                to: channelID,
	                message: ("*Akephalos is connected to `" + serversConnected() +"` servers*")
	            });
	            return;
	        }
	       	// ---- EVENT BETA in progress -----
	        /*if(message.toLowerCase() === "!events"){
	            botEvents.getEvents(bot, channelID);
	        }

	        if(message.toLowerCase().search("!setevent") === 0){
	            botEvents.setEvent(bot, channelID, message);
	        }

	        if(message.toLowerCase().search("!delevent") === 0){
	        	botEvents.deleteEvent(bot, channelID, message);
	        }*/
	        // ---------------------------------

	        if(message.toLowerCase().search("!ask") === 0){ 
	        	cleverBot.askBot(bot, message, channelID);
	        	return;
	        }

	        if((message.toLowerCase() === "!joinserver" || message.toLowerCase() === "!addserver") && checkAdminPermission(userID, channelID)){
	        	bot.sendMessage({
	        		to: channelID, 
	        		message: "\n**Authorize this bot to your server**\n**Link**: https://goo.gl/HDY52X"
	        	});
	        	return;
	        }

	        if(message === "!twtest"){
	            twitchClient.searchTwitch(bot, channelID);
	            return;
	        }

	        if(message.toLowerCase().search("!twitch") === 0){
	            var searchUser = message.slice(8);
	            twitchClient.checkTwitchUser(searchUser, channelID, bot);
	            return;
	        }

	        if(message.toLowerCase() === '!sounds'){
	            var songList = fs.readdirSync('sounds');
	            for(var i = 0; i < songList.length; i++){
	            	songList[i] = songList[i].split('.');
	            	songList[i] = "!"+songList[i][0];
	            }
	            bot.sendMessage({
	                to: channelID,
	                message: "\n**Sounds**\n"+songList.join("  ")
	            })
	            return;
	        }

	        // SOUNDS
	        if(message.toLowerCase().search("!") === 0){
	        	if(message.length > 1) botSounds.playSound(bot, channelID, message.toLowerCase());
	        }

	        if(message.toLowerCase()==="!listmembers"){
	            var listMembers = [];
	            for(var i in bot.servers[bot.serverFromChannel(channelID)].members){
	                listMembers.push(bot.servers[bot.serverFromChannel(channelID)].members[i].user.username);
	            }
	            bot.sendMessage({
	                to: channelID,
	                message: "\n**Members:**\n```" + listMembers.join("\n") + "```"
	            });
	            return;
	        }

	        if(message.toLowerCase() === "!commands") {
	            try {
	                var commands = fs.readFileSync('./akebot/botCommands.txt', 'utf8');
	                bot.sendMessage({
	                    to: channelID,
	                    message: "\n**"+bot.username+" Commands**\n"+commands
	                });
	            }
	            catch(err){
	                bot.sendMessage({
	                    to: channelID,
	                    message: err
	                });
	            }
	            return;
	        }

	        if(message.toLowerCase().search("!say") === 0 && checkAdminPermission(userID, channelID)){
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
	            bot.sendMessage({
	                to: channelID,
	                message: "\n**Username**: "+bot.username+"\n**Servers**: "+serversConnected()+"\n"+botUptime()+"\n**Version**: " + botVersion + "\n**Author**: Mesmaroth\n**Written in**: Javascript\n"+
	                "**Library**: Discord.io\n**Library Version**: "+bot.internals["version"]+"\n**Avatar**: https://goo.gl/kp8L7m\n**Thanks to**: izy521, negativereview, yukine."
	            });
	            return;
	        }

	        if(message.toLowerCase() === "!purge all"){			// Can only delete 5 messages including this command that called it. 
	        	console.log("Executed purge all");	        	
	        	bot.getMessages({
	        		channel: channelID,
	        		limit: 5
	        	}, function(error, messageArr){
	        		var msgDel = 0;
	        		for(var i = 0; i< messageArr.length; i++){
	        			bot.deleteMessage({
	        				channel: channelID,
	        				messageID: messageArr[i].id
	        			}, function(e){
	        				if(e) bot.sendMessage({channel:channelID, message:e});
	        			});
	        			msgDel++;
	        		}
	        		console.log("Deleted "+ (msgDel-1) + " messages for " + user + " at "+ printDateTime() + " on Server: " + bot.serverFromChannel(channelID));
	        	});	        	
	        	return;
	        }

	        if(message.toLowerCase() === "!date"){
	            bot.sendMessage({
	                to: channelID,
	                message: botGetDate()
	            });
	            return;
	        }

	        if(message.toLowerCase() === "!time"){
	            bot.sendMessage({
	                to: channelID,
	                message: botGetTime()
	            });
	            return;
	        }

	        //if(message.search("!") === 0){	// Checks for custom cmds
	        	//console.log("Executed");
	   			var file = fs.readFileSync('akebot/cmds.json', 'utf8');
	   			try{var cmd = JSON.parse(file)}
	   			catch(e){return bot.sendMessage({to:channelID, message: "**Error** CMDS\n**Message**: *Your 'botCommands.json' file is causing an error, please revise!*```javascript\n"+e+"\n```"})};
	   			for(var i in cmd){
	   				if(message.toLowerCase() === cmd[i].command || message.toLowerCase() === cmd[i].command2){
	   					if(cmd[i].hasOwnProperty('typing')){
	   						if(typeof cmd[i].typing != 'boolean'){
	   							cmd[i].typing = false;
	   							bot.sendMessage({
	   								to: channelID, 
	   								message: "**Warning** CMDS\n**Message**: The property `\"typing\"` is not a boolean. Please make sure it is either `true` or `false` without quotes. Property set to `false`"
	   							});
	   						}
	   					}
	   					if(!(cmd[i].hasOwnProperty('type'))){
	   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Error** CMDS\n**Message**: No `\"type\"` property specified. Please check that your command properties are written correctly."
		   						});
		   						return;
	   					}
	   					if(cmd[i].type === "text"){
	   						if(!(cmd[i].hasOwnProperty('message'))){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Error** CMDS\n**Message**: No `\"message\"` property specified. Please check that your command properties are written correctly."
		   						});
		   						return;
	   						}
	   						if(cmd[i].hasOwnProperty('timeout')){
	   							return setTimeout(function(){
	   								bot.sendMessage({
	   									to:channelID,
	   									message: String(cmd[i].message),
	   									typing: cmd[i].typing
	   								});
	   							},cmd[i].timeout)
	   						}
	   						else if (!(cmd[i].hasOwnProperty('timeout'))){
	   							bot.sendMessage({
	   								to:channelID,
	   								message: cmd[i].message,
	   								typing: cmd[i].typing
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
	   		//}

	   		if(message === "!cmds") {
	   			var file = fs.readFileSync('akebot/cmds.json', 'utf8');
	   			var file = JSON.parse(file);
	   			var commands = [];
	   			for(var i = 0 ; i < file.length; i++){
	   				commands.push(JSON.stringify({command: file[i].command, type: file[i].type},null,'\t'));
	   			}
	   			bot.sendMessage({
	   				to: channelID,
	   				message: "```javascript\n" + commands.join('\n') + "\n```"
	   			});
	   		}
	    }
	}

});
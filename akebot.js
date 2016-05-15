var DiscordClient = require('discord.io');
var fs = require('fs');
var request = require('request');
var botLogin = require('./akebot/botLogin.js');
//var botEvents = require('./akebot/botEvents.js');
var botSounds = require('./akebot/botSounds.js');
var cleverBot = require('./akebot/cleverBot.js');
var liveStream = require('./liveStream/liveStream.js');
var uptimer = require('uptimer');
var bot = new DiscordClient({token: botLogin.token, autorun: true});		// Or add bot.email, bot.password
var reboot = false;
try {var botVersion = "Akebot v"+ require('./package.json')["version"]}
catch(error) {console.log(error)};
var gameList = [];							// games here will be picked at random
var streamWatchList = [];					// live stream users will be pushed if streamerlist.txt has users to push
var isWatching = false;						// Live stream watching
var commandTimeout = true;					// Set timeout to command each time its called. 


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

function printDateTime(options){       // month-day-year time used for logging	
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

  	if(gameName === ''){
  		console.log("Game Presence set to: None");
  	}
  	else console.log("Game Presence set to: " + gameName);
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

function isAdmin (userID, channelID){           // Checks if the User is Admin
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

function isGuildOwner(userID, channelID){						// Checks if the user is server owner.
	if(bot.servers[bot.serverFromChannel(channelID)].owner_id === userID){
		return true;
	}
	return false;
}

function isDev(userID){							// This checks if the user is the bot owner
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

// -------------- Testing Stream Check Interval --------------

function streamWatch(user){					// Keep checking the status of the user every 10s 
	console.log("Watching: "+ user.username);
	user.interval = setInterval( () => {
		liveStream.getStreamStatus(user.username, function(streamStatus, streamSite,streamName, streamGame, streamUrl){
			if(streamStatus){
				if(!(user.streamChecked)){
					bot.sendMessage({
					    to: "102910652447752192",
					    message: "**" + streamSite + "**\n**User**: "+ streamName + "\n**Status**: `Online`\n**Game**: "+
					    streamGame+"\n**Url**: "+streamUrl
					});
					user.streamChecked = true;			
				}				
			}
			else if(!(streamStatus)){
				user.streamChecked = false;
			}
		});
		
	}, 10000);	
}


function watchStreamList(){
	var streamUserList = fs.readFileSync('./liveStream/streamerlist.txt', 'utf8').split('\n');
	for(var i = 0; i < streamUserList.length; i++){
		var user = streamUserList[i]
		streamWatchList.push({
			username: user,
			streamChecked: false,
			interval: {}
		});
	}

   	for(var i = 0; i < streamWatchList.length; i++){
   		//streamWatch(streamWatchList[i]);
   		setTimeout(streamWatch, 1000, streamWatchList[i]);
   	}
   	isWatching = true;
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
    setPresence((gameList.length === 0) ? botVersion : gameList[Math.floor(Math.random()*gameList.length)]);    
    var serverList = [];    
    for(var i in bot.servers){
      serverList.push(bot.servers[i].name + ": (" + bot.servers[i].id + ")");
    }
    console.log("Servers: \n" + serverList.join('\n')+"\n");
    sudoCheck();

    // Watch users in streamer list at startup
	//watchStreamList();
});

bot.on('disconnected', function(){
	if(reboot === true){
		reboot = false;
		console.log("Connecting...");		
		setTimeout(bot.connect, 3000);
	}
    
});

bot.on('message', function (user, userID, channelID, message, rawEvent) {
	if(channelID in bot.directMessages){
		if(rawEvent.d.author.username !== bot.username){
			bot.sendMessage({
				to: userID,
				message: "Direct messages for this bot are disabled."
			});
			bot.deleteChannel(channelID);
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
	            bot.sendMessage({
	                to: channelID,
	                message: "*Exiting...*"
	            });
	            console.log("[DISCONNECTED]");
	            if(isWatching){
	            	for(var i = 0; i < streamWatchList.length; i++){
			        	clearInterval(streamWatchList[i].interval);
			        }
			        console.log("Cleared StreamWatch Intervals");
	            }
	            bot.disconnect();	            
	            return;
	        }

	        if(message === "~reboot" && isAdmin(userID, channelID)){
	        	bot.sendMessage({
	                to: channelID,
	                message: "*Rebooting...*"
	            });
	            console.log("[REBOOTING]");
	           setTimeout(()=>{ bot.disconnect()}, 2000);
	            reboot = true;
	            return;
	        }	        

	        if(message.search("~announce") === 0 && isDev(userID)){
	        	botAnnounce(message);
	        	return;
	        }

	        if(message.toLowerCase().search("~setgame") === 0 && isDev(userID)){
	            var message = message.slice(9);
	            setPresence(message);
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

	        if((message.toLowerCase() === "!joinserver" || message.toLowerCase() === "!addserver")){
	        	bot.sendMessage({
	        		to: channelID, 
	        		message: "\n**Authorize this bot to your server**\n**Link**: https://goo.gl/4NtO4q"			// Replace this with your bots auth invite link
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
	                message: "\n**Bot Username**: "+bot.username+"\n**Bot Owner**: "+devName+"\n**Servers Connected**: "+serversConnected()+"\n"+
	                botUptime()+"\n**Version**: " + botVersion + "\n**Author**: Mesmaroth\n**Written in**: Node.js\n"+
	                "**Library**: Discord.io\n**Library Version**: "+bot.internals["version"]+"\n**Avatar**: https://goo.gl/kp8L7m\n**Thanks to**: izy521, negativereview, yukine."
	            });
	            return;
	        }

	       	// ---------- Events (Not worked on) --------------
	        /*if(message.toLowerCase() === "!events"){
	            botEvents.getEvents(bot, channelID);
	        }

	        if(message.toLowerCase().search("!setevent") === 0){
	            botEvents.setEvent(bot, channelID, message);
	        }

	        if(message.toLowerCase().search("!delevent") === 0){
	        	botEvents.deleteEvent(bot, channelID, message);
	        }*/

	        
	        // ------------------- Live Stream Checks----------------------
	        // 			Stream Check Interval	       

	        if(message.search("!streamwatch") === 0 ){
	        	if(message.search(' ') != -1){
	        		message = message.split(' ');
	        		message = message[1];
	        		
	        		if(message === "start"){
			        	if(isWatching === false){
			        		watchStreamList();
				        	bot.sendMessage({
				        		to: channelID,
				        		message: "LiveStream Watch **ON**"
				        	});
			        	}
		        	}       		
	        		

		        	if(message === "stop"){
		        		if(isWatching){
		        			for(var i = 0; i < streamWatchList.length; i++){
			            		clearInterval(streamWatchList[i].interval);
			            	}
			            	bot.sendMessage({
			            		to: channelID,
			            		message: "LiveStream Watch **OFF**"
			            	});
		        		}
		        	}
	        	}		        	
	        	return;
	        }	        

	        if(message.toLowerCase() === "!streamlist"){					// Checks all streamers from streamlist.txt if streaming
	        	var streamers = fs.readFileSync('./liveStream/streamerlist.txt', 'utf8').split('\n');
	            for(var i = 0; i < streamers.length; i++){
	            	liveStream.getStreamStatus(streamers[i], function(streamStatus, streamSite, streamName, streamGame, streamUrl){
	            		if(streamStatus){
	            			bot.sendMessage({
							    to: channelID,
							    message: "**" + streamSite + "**\n**User**: "+ streamName +
							    "\n**Status**: `Online`\n**Game**: "+ streamGame+"\n**Url**: "+streamUrl
							});
	            		}	            		
	            	});
	            }
	            return;
	        }	        

	        if(message.toLowerCase().search("!stream") === 0){						// Check if user is streaming
	            var searchUser = message.slice(8);
	            liveStream.getStreamStatus(searchUser, function(streamStatus, streamSite, streamName, streamGame, streamUrl){
	            	if(streamStatus){
		            	bot.sendMessage({
					        to: channelID,
					        message: "**"+streamSite+"**\n**User**: "+ streamName + "\n**Status**: `Online`\n**Game**: "+ streamGame +"\n**Url**: " + streamUrl
					    });
	            	}
	            	else if(!(streamStatus)){
	            		bot.sendMessage({
				            to: channelID,
				            message: "**Stream**\n**User**: "+ searchUser + "\n**Status**: `Offline`"
				        });	
	            	}
	            });
	                        
	            return;
	        }

	        // ---------------------------------------------------------------

	        

	        if(message.toLowerCase() === '!sounds'){				// List sounds in sounds directory
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


	        if(message.toLowerCase() === "!commands") {	        	
	        	try {
		            var commands = fs.readFileSync('./akebot/commandList.txt', 'utf8');
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

	        if(message.toLowerCase().search("!purge") === 0){
	        	var name = "";
	        	var max = 100;
	        	var amount = max;
	        	var msgArrIDs = [];				// Array of messageIDs to delete
	        	message = message.slice(7);
	        	if(message === "") return;
	        	if(message.search(' ') !== -1){
	        		message = message.split(' ');
	        		name = message[0]
	        		amount = Number(message[1]);
	        		if(name === "me") {
	        			name = user;
	        			amount+=1;
	        		}
	        		if(name === "bot") name = bot.username;
	        	}
	        	else{
	        		if(!(isNaN(message))){
		        		name = Number(message);
		        		//if(name <= 0) name++;
		        		amount = name + 1;
		        	}
		        	if(message === "me") {
	        			name = user;
	        			amount+=1;
	        		}
		        	if(message === "bot") name = bot.username;
	        	}	        	
		        //console.log("Message: " + message);
		        //console.log("Name: " + name);
		        //console.log("Amount: " + amount);

		        if(message === "all" || name === "all"){	        		
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

	        	if(!(isNaN(name))){     		
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
	        	
	        	var userMessages = [];	        	
	        	bot.getMessages({
	        		channel: channelID,
	        		limit: max
	        	}, function(error, messageArr){
	        		for(var i = 0; i < messageArr.length; i++){
	        			if(name.toLowerCase() === messageArr[i].author.username.toLowerCase()){
	        				userMessages.push(messageArr[i]);
	        			}
	        		}
	        		
	        		for(var i = 0; i < userMessages.length; i++){	        					        		
	  					if(i === amount) break;
		        		msgArrIDs.push(userMessages[i].id)
	        		}
	        		bot.deleteMessages({channelID: channelID,messageIDs: msgArrIDs});
	        	});	        	
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

	        if(message === "!cmds") {
	   			try{
	   				var file = fs.readFileSync('akebot/botCommands.json', 'utf8');
	   				file = JSON.parse(file);
	   			}
	   			catch(error) {if(error) return console.log(error)};

	   			var commands = [];
	   			for(var i = 0 ; i < file.length; i++){
	   				if(file[i].editable === true){
	   					commands.push((i+1)+". "+ file[i].command + "         Editable: " + file[i].editable);
	   				}
	   				else commands.push((i+1)+". "+file[i].command);
	   			}
	   			
	   			bot.sendMessage({
	   				to: channelID,
	   				message: "\n**Commands**\n```javascript\n" + commands.join('\n') + "\n```"
	   			});
	   			return;
	   		}

	   		if(message.toLowerCase().search("!addcmd") === 0){
	   			var cmd = "";
	   			var type = "";
	   			var output = [];
	   			var reservedCMDS = ['!commands', '!time', '!date', '!purge', '!servers', '!stream', 
	   			'!streamlist', '!streamwatch', '!uptime', '!cmds', '!addcmd', '!delcmd', '!cmd', '!sounds', '!say', '!reverse', '!about' ]
	   			message = message.slice(8);
	   			if(message.search(" ") !== -1){
	   				message = message.split(" ");
	   				cmd = message[0].toLowerCase();
	   				type = message[1];

	   				if(cmd.search("~") === 0){					// All tilde commands or future commmands are reserved for global dev commands
	   					bot.sendMessage({
	   							to: channelID,
	   							message: "*Tilde commands are not allowed and is reserved.*"
	   						});
	   					return;
	   				}

	   				for(var i = 0; i < reservedCMDS.length; i++){					// Check if any of the command equals any of the reserved commands 
	   					if(reservedCMDS[i] === cmd){
	   						bot.sendMessage({
	   							to: channelID,
	   							message: "*This command `" + cmd +"` is reserved for the bot.*"
	   						});
	   						return;
	   					}
	   				}
	   				try{
				   		var commands = fs.readFileSync('./akebot/botCommands.json', 'utf8')
				   		commands = JSON.parse(commands);
				   	}
				   	catch(error) {if(error) return console.log(error)};
	   				
	   				if(type.toLowerCase() === "text"){
	   					for(var i = 2; i < message.length; i++){		// Add everything after the second index which is 'type'
	   						output.push(message[i]);
		   				}
		   				output = output.join(" ");		   				
		   				if (output === ""){
		   					bot.sendMessage({
		   						to: channelID,
		   						message: "*No message was entered. Please try again.*"
		   					});
		   					return;
		   				}		   				

		   				for(var i = 0; i < commands.length; i++){		   					

		   					if((commands[i].command === cmd || commands[i].command2 === cmd) && commands[i].editable === true){
		   						var oldMessage = commands[i].message;
		   						commands[i].type = type;
		   						commands[i].author = user.toLowerCase();
		   						commands[i].message = output;

		   						if(commands[i].hasOwnProperty('file') && commands[i].hasOwnProperty('filename')){		   							
		   							fs.unlinkSync(commands[i].file);
		   							delete commands[i].file;
		   							delete commands[i].filename;

		   						}

		   						bot.sendMessage({
		   							to: channelID,
		   							message: "**Command Replaced**\n```javascript\nCommand: <"+cmd+">\nType: " + type +"\nBy: <"+ user +">\nNew Message: " + output+ "\nOld Message: " + oldMessage + "```"
		   						});
		   						fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands,null,'\t'));
		   						return;
		   					}

		   					if((commands[i].command === cmd || commands[i].command2 === cmd)  && commands[i].editable === false){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "*This command already exist.*\n```javascript\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
		   						});
		   						return;
		   					}
		   				}

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
		   					message: "\n**Command Added**\n```javascript\nCommand: <"+cmd+">\nType: " + type +"\nBy: <"+ user +">\nMessage: " + output+ "```"
		   				});
		   				return;
	   				}

	   				if(type.toLowerCase() === 'image'){
	   					var url = "";
	   					var fileName = "";
	   					var location = "pictures/";
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

	   					for(var i = 2; i < message.length; i++){		// Add everything after the second index which is 'type'
	   						output.push(message[i]);
		   				}
		   				output = output.join(" ");
		   				var noMsg = false;

		   				if(output === ""){
		   					noMsg = true;
		   				}

		   				for(var i = 0; i < commands.length; i++){
		   					if((commands[i].command === cmd || commands[i].command2 === cmd) && commands[i].editable === true){
		   						if(commands[i].hasOwnProperty('file') && commands[i].hasOwnProperty('filename')){
		   							if(commands[i].file !== location+fileName) fs.unlinkSync(commands[i].file);		   							
		   							else if(commands[i].file === location+fileName){
		   								bot.sendMessage({
		   									to: channelID,
		   									message: "*This image has already been uploaded to this command.*"
		   								});
		   								return;
		   							}
		   						}
		   						var oldMessage = commands[i].message;
		   						commands[i].type = type;
		   						commands[i].author = user.toLowerCase();
		   						commands[i].file = location+fileName;
		   						commands[i].filename = fileName;		   						
		   						if(noMsg){
		   							if(commands[i].hasOwnProperty('message')){
		   								delete commands[i].message;
		   							}
		   							commands[i].message = output;
		   							bot.sendMessage({
			   							to: channelID,
			   							message: "**Command Replaced**\n```javascript\nCommand: <"+cmd+">\nType: " + type +"\nBy: <"+ user + ">\nfile: "+ location+fileName + "\nfilename: " +fileName+ "\n```"
		   							});
		   						}
		   						else{
		   							bot.sendMessage({
			   							to: channelID,
			   							message: "**Command Replaced**\n```javascript\nCommand: <"+cmd+">\nType: " + type +"\nBy: <"+ user + ">\nfile: "+ location+fileName + "\nfilename: " +fileName+ "\nNew Message: " + output+ "\nOld Message: " + oldMessage + "```"
		   							});
		   						}	

		   						
		   						fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands,null,'\t'));
		   						return;
		   					}

		   					if((commands[i].command === cmd || commands[i].command2 === cmd)  && commands[i].editable === false){
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "*This command already exist.*\n```javascript\n"+JSON.stringify(commands[i], null, '\t')+"\n```"
		   						});
		   						return;
		   					}
		   				}

		   				commands.push({
		   					command: cmd.toLowerCase(),
		   					type: type,
		   					author: user.toLowerCase(),
		   					file: location+fileName,
		   					filename: fileName ,
		   					message: output,
		   					editable: true	
		   				});
		   				if(noMsg) {
		   					delete commands[commands.length - 1].message;
		   					bot.sendMessage({
		   						to: channelID,
		   						message: "\n**Command Added**\n```javascript\nCommand: <"+cmd+">\nType: " + type +"\nBy: <"+ user + ">\nFile: "+ location+fileName+"\nFilename: " + fileName + "```"
		   					});
		   				}
		   				else {
		   					bot.sendMessage({
			   					to: channelID,
			   					message: "\n**Command Added**\n```javascript\nCommand: <"+cmd+">\nType: " + type +"\nBy: <"+ user + ">\nFile: "+ location+fileName+"\nFilename: " + fileName + "\nMessage: " + output+ "```"
		   					});
		   				}

		   				fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands,null,'\t'));		   				
		   				return;
	   				}

	   				bot.sendMessage({
	   					to: channelID, 
	   					message: "*No `type` found. Use `text` or `image` and be sure you are following this format:`!addcmd [COMMAND] [TYPE] [MESSAGE]`"
	   				});

	   			}
	   			return; 
	   		}

	   		if(message.toLowerCase().search('!delcmd') === 0){
	   			message = message.slice(8);
	   			try{ 
	   				var commands = fs.readFileSync('./akebot/botCommands.json', 'utf8');
	   				commands = JSON.parse(commands);
	   			}
	   			catch(error) {if(error) return console.log(error)};

	   			for(var i = 0; i < commands.length; i++){
	   				if(commands[i].command === message || commands[i].command2 === message){
	   					if(commands[i].editable === true){
	   						if(commands[i].hasOwnProperty('file')){
	   							var location = commands[i].file;
	   							fs.unlinkSync(location);
	   						}
	   						if(commands[i].type === "image"){
	   							commands.splice(i,1);
	   							fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'));
	   							bot.sendMessage({
		   							to: channelID,
		   							message: "*Command `" + message + "` has been deleted.*"
		   						});
		   						return;
	   						}

	   						if(commands[i].type === "text"){
	   							commands.splice(i,1);
		   						fs.writeFileSync('./akebot/botCommands.json', JSON.stringify(commands, null, '\t'));
		   						bot.sendMessage({
		   							to: channelID,
		   							message: "*Command `" + message + "` has been deleted.*"
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
	   				message: "\n**Error**: *No Command found.*"
	   			});
	   			return;
	   		}

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
			   						message: "\n**Command**\n```javascript\nCommand: <"+commands[i].command+">\nCommand 2: <"+ commands[i].command2+ ">\nType: " + commands[i].type +"\nBy: <"+ author +">\nMessage: " + commands[i].message+ "```"
			   					});
			   					return;
			   				}
			   				
			   				bot.sendMessage({
			   					to: channelID,
			   					message: "\n**Command**\n```javascript\nCommand: <"+commands[i].command+">\nType: " + commands[i].type +"\nBy: <"+ author +">\nMessage: " + commands[i].message+ "```"
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
			   						message: "\n**Command**\n```javascript\nCommand: <"+commands[i].command+">\nCommand 2: <"+ commands[i].command2+ ">\nType: " + commands[i].type +"\nFile: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\nMessage: " + message + "```"
			   					});
			   					return;
		   					}
		   					if( commands[i].hasOwnProperty('message') && !(commands[i].hasOwnProperty("command2")) ){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <"+commands[i].command+">\nType: " + commands[i].type +"\nFile: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\nMessage: " + message + "```"
			   					});
		   						return;
		   					}

		   					if( !(commands[i].hasOwnProperty('message')) && commands[i].hasOwnProperty("command2")){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <"+commands[i].command+">\nCommand 2: <"+ commands[i].command2+ ">\nType: " + commands[i].type +"\nFile: "+commands[i].file+
			   						"\nFile Name: "+ commands[i].filename+"\nBy: <"+ author +">\n```"
			   					});
		   						return;
		   					}

		   					if( !(commands[i].hasOwnProperty('message')) && !(commands[i].hasOwnProperty("command2")) ){
		   						bot.sendMessage({
			   						to: channelID,
			   						message: "\n**Command**\n```javascript\nCommand: <"+commands[i].command+">\nType: " + commands[i].type +"\nFile: "+commands[i].file+
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

	   		// Check if the command matches a sound from the sounds folder
	        if(message.toLowerCase().search("!") === 0){
	        	if(message.length > 1) botSounds.playSound(bot, channelID, message.toLowerCase());
	        }

	        // Check message to see if it triggers any commands in botCommands.json
	   		try{var file = fs.readFileSync('./akebot/botCommands.json', 'utf8')}
	   		catch(error) {return bot.sendMessage({to:channelID, message:"**Error** botCommands.json\n```javascript\n"+error+"\n```"})};
	   		try{var cmd = JSON.parse(file)}
	   		catch(error){return bot.sendMessage({to:channelID, message: "**Error** CMDS\n**Message**: *Your 'botCommands.json' file is causing an error, please revise!*```javascript\n"+error+"\n```"})};
	   		for(var i in cmd){
	   			if(message.toLowerCase() === cmd[i].command || message.toLowerCase() === cmd[i].command2){	   				
	   				if(!(cmd[i].hasOwnProperty('type'))){			// Check if theres type property
	   					bot.sendMessage({
		   					to: channelID,
		   					message: "**Error** CMDS\n**Message**: No `\"type\"` property specified. Please check that your command properties are written correctly."
		   					});
		   					return;
	   				}
	   				if(cmd[i].hasOwnProperty('typing')){					// Check if typing is not a boolean
	   					if(typeof cmd[i].typing != 'boolean'){
	   						cmd[i].typing = false;
	   						bot.sendMessage({
	   							to: channelID, 
	   							message: "**Warning** CMDS\n**Message**: The property `\"typing\"` is not a boolean. Please make sure it is either `true` or `false` without quotes. Property set to `false`"
	   						});
	   					}
	   				}
	   				if(cmd[i].hasOwnProperty('tts')){					// Check if tts is not a boolean
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

	   					return;
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
				        return;
	   				}

	   			}
	   		}

	    }
	}

});
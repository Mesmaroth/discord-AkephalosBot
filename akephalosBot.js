var DiscordClient = require('discord.io');
var fs = require('fs');
var botLogin = require('./akebot/botLogin.js');
//var botEvents = require('./akebot/botEvents.js');
var botSounds = require('./akebot/botSounds.js');
var cleverBot = require('./akebot/cleverBot.js');
var twitchClient = require('./twitch/twitch.js');
var uptimer = require('uptimer');
var bot = new DiscordClient({
    token: botLogin.token,
    // Or add email: {EMAIL_HERE}, password: {PASWORD_HERE}
    autorun: true
});
var reboot = false;

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

function checkAdminPermission (channelID, userID){           // Checks if the User is Admin
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
		fs.writeFileSync("GUILD_DELETE.log","Kicked from Server\n", event);
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

	        if(message.toLowerCase() === "~writeout" && checkAdminPermission(channelID, userID)){
	            fs.writeFile('bot.JSON', "Updated at: "+ printDateTime() + "\n\n" + JSON.stringify(bot, null, '\t'), function(error){
	                if(error) throw error;
	                console.log("Succesfully written bot properties");
	                bot.sendMessage({
	                    to: channelID,
	                    message: "*Succesfully written bot properties*"
	                });
	            });
	        }

	        if(message === "~quit" && checkAdminPermission(channelID, userID)){
	            bot.sendMessage({
	                to: channelID,
	                message: "*Exiting...*"
	            });
	            bot.disconnect();
	            console.log("[DISCONNECTED]");
	        }

	        if(message === "~reboot" && checkAdminPermission(channelID, userID)){
	        	bot.sendMessage({
	                to: channelID,
	                message: "*Rebooting...*"
	            });
	            console.log("[REBOOT]");
	           setTimeout(()=>{ bot.disconnect()}, 2000);
	            reboot = true;
	        }

	        if(message.toLowerCase().search("~setgame") === 0 && checkAdminPermission(channelID, userID)){
	            var message = message.slice(9);
	            setPresence(message);
	        }

	        if(message.toLowerCase().search("~announce") === 0 && checkAdminPermission(channelID, userID)){
	        	botAnnounce(message);
	        }

	        // ------------END of Global Commands------------

	        if(message.toLowerCase() === "!uptime"){
	            bot.sendMessage({
	                to: channelID,
	                message: botUptime()
	            });
	        }

	        if(message === "!servers"){
	            bot.sendMessage({
	                to: channelID,
	                message: ("*Akephalos is connected to `" + serversConnected() +"` servers*")
	            });
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

	        if(message.toLowerCase().search("!ask") === 0) 
	        	cleverBot.askBot(bot, message, channelID);

	        if((message.toLowerCase() === "!joinserver" || message.toLowerCase() === "!addserver") && checkAdminPermission(channelID, userID)){
	        	bot.sendMessage({
	        		to: channelID, 
	        		message: "\n**Authorize this bot to your server**\n**Link**: https://goo.gl/HDY52X"
	        	});
	        }

	        if(message === "!twtest"){
	            twitchClient.searchTwitch(bot, channelID);
	        }

	        if(message.toLowerCase().search("!twitch") === 0){
	            var searchUser = message.slice(8);
	            twitchClient.checkTwitchUser(searchUser, channelID, bot);
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
	        }

	        // SOUNDS
	        if(message.toLowerCase().search("!") === 0){
	                botSounds.playSound(bot, channelID, message.toLowerCase());
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
	        }

	        if(message.toLowerCase() === "!commands") {
	            try {
	                var commands = fs.readFileSync('./akebot/botCommands.txt', 'utf8');
	                bot.sendMessage({
	                    to: channelID,
	                    message: commands
	                });
	            }
	            catch(err){
	                bot.sendMessage({
	                    to: channelID,
	                    message: err
	                });
	            }

	        }

	        if(message.toLowerCase().search("!say") === 0 && checkAdminPermission(channelID, userID)){
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
	        }

	        if (message.toLowerCase().search("!delete") === 0 && checkAdminPermission(channelID, userID)) {   // Checks if user is in admin group
	        var messageNum = message.slice(7);
	         bot.getMessages({
	            channel: channelID,
	            limit: (Number(messageNum)+1)       //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
	        }, function (error, messageArr) {
	        	var msgDel = 0;
	            if(error) return console.error(error);
	            var arrSize = messageArr.length;
	            for(var i = 0; i < arrSize; i++){
	                var msgID = messageArr[i].id;
	                bot.deleteMessage({
	                    channel: channelID,
	                    messageID: msgID
	                }, function(error){
	                    if(error){
	                        console.error(error);
	                        return bot.sendMessage({
	                            to:channelID,
	                            message: "**Error "+error.statusCode+ " "+error.statusMessage+"**\n**Message:** "+error.message+"\n**Response:** \n```JSON\n"+JSON.stringify(error.response)+"\n```"
	                        });
	                    }
	                });
	                msgDel++;
	            }
	            if(msgDel !== 0) console.log("Deleted "+ (msgDel-1) + " messages for " + user + " at "+ printDateTime() + " on Server: " + bot.serverFromChannel(channelID));
	            });
	        }
	        else if(message.search("!delete") === 0 && (checkAdminPermission(channelID, userID) === false)){
	            bot.sendMessage({
	                to: channelID,
	                message: "You're not admin dude!"
	            });
	        }

	        if(message.toLowerCase().search("!purge") === 0 && checkAdminPermission(channelID, userID)) {
	        	if(message.length > 7){
	        		var message = message.slice(7).toLowerCase();
	        	bot.getMessages({
	        		channel: channelID,
	        		limit: 100
	        	}, function (error, messageArr){
	        		var msgDel=0;
	        		if(error) throw error;
		        	for (var i = 0; i < messageArr.length; i++){
		        		if(message === "all") {
		        		 bot.deleteMessage({
		        				channel: channelID,
		        				messageID: messageArr[i].id
		        			}, function(error){
		        				if (error){
		                            console.error(error);
		                            return bot.sendMessage({
		                                to: channelID,
		                                message: "**Error "+error.statusCode+ " "+error.statusMessage+"**\n**Message:** "+error.message+"\n**Response:** \n```JSON\n"+JSON.stringify(error.response)+"\n```"
		                            });
		                        }
		        			});
	                     msgDel++;
		        		}

		        		if(message === "me") message = user.toLowerCase();
	                    if(message === "bot") message = bot.username.toLowerCase();
		        		if(messageArr[i].author.username.toLowerCase() === message) {                         
		        			bot.deleteMessage({
		        				channel: channelID,
		        				messageID: messageArr[i].id
		        			}, function (error){
		        				if (error){
		                            console.error(error);
		                            return bot.sendMessage({
		                                to: channelID,
		                                message: "**Error "+error.statusCode+ " "+error.statusMessage+"**\n**Message:** "+error.message+"\n**Response:** \n```JSON\n"+JSON.stringify(error.response)+"\n```"
		                            });
		                        }
		        			});
		        			msgDel++;
		        		}	        		
		        	}
		        	if(msgDel !== 0) console.log("Deleted "+ (msgDel-1) + " messages for " + user + " at "+ printDateTime() + " on Server: " + bot.serverFromChannel(channelID));
	        		});        	
	        	}        	
	        }
	        else if(message.toLowerCase().search("!purge") === 0 && (checkAdminPermission(channelID, userID) === false)){
	            bot.sendMessage({
	                to: channelID,
	                message: "You're not Admin dude!"
	            })
	        }

	        if(message.toLowerCase() === "peace" || message.toLowerCase() === "goodnight") {
	            bot.sendMessage({
	                to: channelID,
	                message: "Peace out!",
	                typing: true
	            });
	        }        

	        if(message.toLowerCase() === "!date"){
	            bot.sendMessage({
	                to: channelID,
	                message: botGetDate()
	            });
	        }

	        if(message.toLowerCase() === "!time"){
	            bot.sendMessage({
	                to: channelID,
	                message: botGetTime()
	            });
	        }

	        // MEMES
	        if(message.toLowerCase() === "!yes") {
	            bot.sendMessage({
	                to: channelID,
	                message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
	            });
	        }

	        if(message.toLowerCase()==="!neil"){
	            bot.uploadFile({
	                to: channelID,
	                file: "pictures/Neil.png",
	                filename: "Neil.png"
	            }, function(error){
	            	if(error){
	            		bot.sendMessage({
						to: channelID,
						message: "**Error**\n**Message**: "+error.message
						});
	            	}
	            });
	        }

	        if(message.toLowerCase()==="!nice") {
	            bot.uploadFile({
	                to: channelID,
	                file: "pictures/noice.jpg",
	                filename: "noice.jpg"
	            }, function(error){
	            	if(error){
	            		bot.sendMessage({
						to: channelID,
						message: "**Error**\n**Message**: "+error.message
						});
	            	}
	            });
	        }

	        if(message.toLowerCase() === "!rekt" || message.toLowerCase() === "rekt") {
	            bot.sendMessage({
	                to: channelID,
	                message: "https://giphy.com/gifs/rekt-vSR0fhtT5A9by"
	            });
	        }

	        if (message.toLowerCase() === "why?") {
	            bot.sendMessage({
	                to: channelID,
	                message: "Because fuck you! That's why!"
	            });
	        }

	        if(message.toLowerCase() === "!doit") {
	            bot.sendMessage({
	                to: channelID,
	                message: "https://media.giphy.com/media/TCaq4FekwSV5m/giphy.gif"
	            });
	        }

	        if(message.toLowerCase() === "!bmj") {
	            bot.sendMessage({
	                to: channelID,
	                message: "http://cdn.makeagif.com/media/9-13-2015/28JfPx.gif"
	            });
	        }

	        if(message.toLowerCase() === "!whoa") {
	            bot.uploadFile({
	                to: channelID,
	                file: "pictures/whoaMan.jpg",
	                filename: "whoaMan.jpg"
	            }, function(error,response){
	                if(error){
	                    bot.sendMessage({
	                        to: channelID,
	                        message: "**Error**\n**Message**: "+error.message
	                    })
	                }
	            });
	        }

	        if(message.toLowerCase() === "!feelsbad" || message.toLowerCase() === "!feelsbadman") {
	            bot.uploadFile({
	            	to: channelID,
	            	file: './pictures/feelsBadMan.png',
	            	filename: "feelsBadMan.png"
	            }, function(error){
	            	if(error){
	            		bot.sendMessage({
						to: channelID,
						message: "**Error**\n**Message**: "+error.message
						});
	            	}
	            });
	        }

	        if(message.toLowerCase() === "!feelsgood" || message.toLowerCase() === "!feelsgoodman") {
	            bot.uploadFile({
	            	to: channelID,
	            	file: './pictures/feelsGoodMan.png',
	            	filename: "feelsGoodMan.png"
	            }, function(error){
	            	if(error){
	            		bot.sendMessage({
						to: channelID,
						message: "**Error**\n**Message**: "+error.message
						});
	            	}
	            });
	        }

	        if(message.toLowerCase() === "!topkek") {
	            bot.sendMessage({
	                to: channelID,
	                message: "http://i1.kym-cdn.com/photos/images/list/000/706/368/0cc.gif"
	            });
	        }

	        if(message.toLowerCase() === "!bobe") {
	            bot.uploadFile({
	            	to: channelID,
	            	file: './pictures/feelsGoodMon.png',
	            	filename: "feelsGoodMon.png"
	            }, function(error){
	            	if(error){
	            		bot.sendMessage({
						to: channelID,
						message: "**Error**\n**Message**: "+error.message
						});
	            	}
	            });
	        }

	        if(message === "(╯°□°）╯︵ ┻━┻"){
	        	setTimeout(function(){
	        		bot.sendMessage({
		        		to: channelID,
		        		message: "┬─┬﻿ ノ( ゜-゜ノ)",
		        		typing: true
	        		});
	        	}, 1250)
	        }

	        if(message.toLowerCase() === "gitgud" || message.toLowerCase() === "!gitgud"){
	            bot.sendMessage({
	                to: channelID,
	                message: "https://cdn.discordapp.com/attachments/102910652447752192/170747206842712066/gitgud.gif"
	            });
	        }


	        if(message.toLowerCase() === "!israel"){
	            bot.uploadFile({
	            	to: channelID,
	            	file: './pictures/angryTyrone.png',
	            	filename: "angryTyrone.png"
	            }, function(error){
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

});
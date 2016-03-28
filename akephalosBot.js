var DiscordClient = require('discord.io');
var fs = require('fs');
var botLogin = require('./akebot/botLogin.js');
var botEvents = require('./akebot/botEvents.js');
var cleverBot = require('./akebot/cleverBot.js');
var twitchClient = require('./twitch-test/twitch.js');
var bot = new DiscordClient({
    token: botLogin.token,
    autorun: true
});
try {var botVersion = "Akebot v"+ require('./package.json')["version"]}
catch(error) {console.log(error)};

var gameList = [];


function outputBotProperties(){
  fs.writeFile('bot.JSON', "Updated at: "+ printDateTime() + "\n\n" + JSON.stringify(bot, null, '\t'), function(error){
    if(error) throw error;
    console.log("Succesfully written bot properties");
  });
}

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

function searchSong(message, botSounds){
    var songName = message.slice(1);
    for(var i = 0; i < botSounds.length; i++){
       if(botSounds[i].includes(songName) === true) {
        return i;
       }
    }
    return null;
}

function playSound(songNum, botSounds, channelID) {             // Plays sound effects on the first voice channel listed.
    for(var i in bot.servers[bot.serverFromChannel(channelID)].channels){
        if(bot.servers[bot.serverFromChannel(channelID)].channels[i].type === "voice" && bot.servers[bot.serverFromChannel(channelID)].channels[i].position === 0){
            var voiceChannel = bot.servers[bot.serverFromChannel(channelID)].channels[i].id;
            bot.joinVoiceChannel(voiceChannel, function(){
                bot.getAudioContext({channel: voiceChannel, stereo: true }, function(stream){
                    stream.playAudioFile('sounds/'+botSounds[songNum]);
                    stream.once('fileEnd', function(){
                        bot.leaveVoiceChannel(voiceChannel);
                    });
                });
            });
            return;
        }
    }

    bot.sendMessage({
        to: channelID,
        message: "No voice channels were found."
    });    
}

function setPresence(name){
    bot.setPresence({game: name});
    console.log("Game Presence set to: " + name);
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

bot.on('debug', function (rawEvent) {
    if(rawEvent.t === "GUILD_CREATE"){
        fs.writeFile('joined server.txt', rawEvent, function(error){
            if (error) throw error;
            console.log(rawEvent.d.id, "Joined, written file.");
        })
    }
});


bot.on('ready', function (rawEvent) {
    console.log("Discord.io - Version: "+ bot.internals.version);
    console.log(bot.username + " - (" + bot.id + ")");
    outputBotProperties();
    bot.setPresence({game: (gameList.length === 0) ? botVersion : gameList[Math.floor(Math.random()*gameList.length)]});    
    var serverList = [];
    for(var i in bot.servers){
      serverList.push(bot.servers[i].name + ": (" + bot.servers[i].id + ")");
    }
    console.log("Servers: \n" + serverList.join('\n'));
});

bot.on('disconnected', function(){
    console.log("Bot has "+"disconnected".red + " from the server  Retrying...");
    setInterval(bot.connect(), 15000)
});

bot.on('message', function (user, userID, channelID, message, rawEvent) {
    if(rawEvent.d.author.username !== bot.username){                 // Does not check for bot's own messages.

        if(message.toLowerCase() === "!events"){
            botEvents.getEvents(bot, channelID);
        }

        if(message.toLowerCase().search("!setevent") === 0){
            botEvents.setEvent(bot, channelID, message);
        }

        if(message.toLowerCase().search("!delevent") === 0){
        	botEvents.deleteEvent(bot, channelID, message);
        }

        if(message === "!twtest"){
            twitchClient.searchTwitch(bot);
        }

        if(message.toLowerCase().search("!ask") === 0) cleverBot.askBot(bot, message, channelID);

        if(message.toLowerCase().search("!twitch") === 0){
            var searchUser = message.slice(8);
            twitchClient.checkTwitchUser(searchUser, channelID, bot);
        }

        if(message.toLowerCase() === '!sounds'){
            var songList = fs.readdirSync('sounds');
            bot.sendMessage({
                to: channelID,
                message: "\n**Sounds**\nNote that when playing a sound.\nDo not enter the `.mp3` at the end. Just the name: `![Name Here]`\n\n"+songList.join("\n")
            })
        }

        // SOUNDS
        if(message.toLowerCase().search("!") === 0){
            var botSounds = fs.readdirSync('sounds');
            if(message.length > 1){
                var songNum = searchSong(message, botSounds);
                if(songNum !== null){
                    playSound(songNum, botSounds, channelID);
                }
            }
        }

        if(message.toLowerCase().search("!setgame") === 0){
            var message = message.slice(9);
            setPresence(message);
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

        if(message.toLowerCase().search("!say") === 0){
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
                message: "\n**Username:** "+bot.username+"\n**Version:** " + botVersion + "\n**Author:** Mesmaroth\n**Written in:** Javascript\n"+
                "**Library:** Discord.io\n**Library Version:** "+bot.internals["version"]+"\n**Avatar:** https://goo.gl/kp8L7m\n**Thanks to:** izy521, negativereview, yukine."
            });
        }

        if (message.toLowerCase().search("!delete") === 0 && checkAdminPermission(channelID, userID)) {   // Checks if user is in admin group
        var messageNum = message.slice(7);
         bot.getMessages({
            channel: channelID,
            limit: (Number(messageNum)+1)       //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
        }, function (error, messageArr) {
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
            }
            });
        }
        else if(message.search("!delete") === 0 && (checkAdminPermission(channelID, userID) === false)){
            bot.sendMessage({
                to: channelID,
                message: "You're not admin bro!"
            });
        }

    // Delete Bot messages only.
        if(message.toLowerCase() === "!delmsgbot" && checkAdminPermission(channelID, userID)){
            bot.getMessages({
                channel: channelID,
                limit: 100
            }, function (error, messageArr){
                if(error) return console.error(error);
                var msgsDel = 0;
                for(var i = 0; i < messageArr.length; i++) {
                    if(messageArr[i].author.username === bot.username) {
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
                        msgsDel+=1;
                    }
                }
            });
        }

        if(message.toLowerCase().search("!delmsguser") === 0 && checkAdminPermission(channelID, userID)) {
        	if(message.length > 12){
        		var message = message.slice(12).toLowerCase();
        	bot.getMessages({
        		channel: channelID,
        		limit: 100
        	}, function (error, messageArr){
        			if(error) throw error;
	        		for (var i = 0; i < messageArr.length; i++){
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
	        			}

	        			if(i === (messageArr.length) &&  messageArr[i].author.username.toLowerCase() !== message){
	        				bot.sendMessage({
	        					to: channelID,
	        					message: "*No messages were found for*  **" + message + "**"
	        				})
	        			}
	        		}
        		
        		});

        	}
        	
        }


        if(message.toLowerCase() === "!delmsgs" && checkAdminPermission(channelID, userID)) {
            bot.getMessages({
                channel: channelID,
                limit: 100
            }, function (error, messageArr){
                if(error) throw error;
                var msgsDel = 0;
                for(var i = 0; i < messageArr.length; i++){
                    if(messageArr[i].author.id === userID){
                        bot.deleteMessage({
                            channel: channelID,
                            messageID: messageArr[i].id
                        }, function(error){
                            if(error) {
                                console.error(error);
                                return bot.sendMessage({
                                    to: channelID,
                                    message: "**Error "+error.statusCode+ " "+error.statusMessage+"**\n**Message:** "+error.message+"\n**Response:** \n```JSON\n"+JSON.stringify(error.response)+"\n```"
                                });
                            }
                        });
                        msgsDel+=1;
                    }
                }
                console.log("Deleted "+ (msgsDel-1) + " messages for " + user + " at "+ printDateTime() + " on Server: " + bot.serverFromChannel(channelID));
            });
        }
        else if(message.toLowerCase() === "!delmines" && (checkAdminPermission(channelID, userID) === false)){
            bot.sendMessage({
                to: channelID,
                message: "You're not Admin bro!"
            })
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

        if(message.toLowerCase() === "!yes") {
            bot.sendMessage({
                to: channelID,
                message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
            });
        }

        if(message.toLowerCase()==="!neil"){
            bot.uploadFile({
                to: channelID,
                file: "pictures/1Neil.png",
                filename: "Neil.png"
            }, function (error, response){
                if(error){
                    bot.sendMessage({
                        to: channelID,
                        message: "**Error**\n**Message**: "+error.message
                    });
                }
            });
        }

        if(message.toLowerCase() === "!ping") {
            bot.sendMessage({
                to: channelID,
                message: "<@" + userID + ">" + "Not working right now.",
                typing: true
            });
        }

        if(message.toLowerCase() === "peace" || message.toLowerCase() === "goodnight") {
            bot.sendMessage({
                to: channelID,
                message: "Peace out!",
                typing: true
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
            bot.sendMessage({
                to: channelID,
                message: "http://www.likeplusone.org/feelsbadman.png"
            });
        }

        if(message.toLowerCase() === "!feelsgood" || message.toLowerCase() === "!feelsgoodman") {
            bot.sendMessage({
                to: channelID,
                message: "http://chan.catiewayne.com/nc/src/132264456389.png"
            });
        }

        if(message.toLowerCase() === "!topkek") {
            bot.sendMessage({
                to: channelID,
                message: "http://i1.kym-cdn.com/photos/images/list/000/706/368/0cc.gif"
            })
        }

        if(message.toLowerCase() === "!bobe") {
            bot.sendMessage({
                to: channelID,
                message: "https://cdn.discordapp.com/attachments/102910652447752192/160512968671363073/weed.png"
            })
        }
    }

});

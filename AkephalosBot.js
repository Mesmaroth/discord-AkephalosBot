var DiscordClient = require('discord.io');
var fs = require('fs');
var colors = require('colors');
var botLogin = require('./akebot/botLogin');
var bot = new DiscordClient({
    token: botLogin.token,
    autorun: true
});
var gameList = ["Akebot v1.0.0"];
var isInVChannel = false;
// ------
var twitchClient = require('./twitch-test/twitch.js');
//------
var cleverbot = require("cleverbot.io");
var clBot = new cleverbot("HE3vJbjtX7eH55pz", "ApPtaxIECdDOz3ZHH9wvCkRg5DHasXqE");

function askBot(message, channelID){
    var message = message.slice(5);
    clBot.setNick("AkeSession");
    clBot.create(function (err, session){
        clBot.ask(message, function (error, response){
            bot.sendMessage({
                to: channelID,
                message: response
            });
        });

    });
}

function searchSong(message, botSounds){    
    var songName = message.slice(1);
    for(var i = 0; i < botSounds.length; i++){
       if(botSounds[i].includes(songName) === true ){
        return i;
       }
    }
    return null;
}

function playSound(songNum, botSounds) {
    var channelID = "102910652766519296"
    bot.joinVoiceChannel(channelID, function(){
        bot.getAudioContext({channel: channelID, stereo: true }, function(stream){
            stream.playAudioFile('sounds/'+botSounds[songNum]);   // ADD SONG
            stream.once('fileEnd', function(){
                bot.leaveVoiceChannel(channelID);
            });
        });        
    });
}

function printDateTime(){       // month-day-year time for CLI
    var d = new Date();
    var dHours = ((d.getHours() < 12) ? d.getHours().toString() : (d.getHours()-12).toString());
    var dMinutes = (d.getMinutes()<10) ? "0"+d.getMinutes().toString() : d.getMinutes().toString();
    return d.toDateString().green+" at "+dHours.green+":"+dMinutes.green;
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
    console.log("Game Presence set to: " + name);
}

function consoleMsgDel(user,msgDel){
    return console.log("Deleted "+ (msgDel-1) + " messages for " + user.cyan + " at "+ getDateConsole().green );
}

function botLogChan(msg){
    bot.sendMessage({
        to: "148891779364683776",
        message: botGetTime()+ " " + msg
    });
}

var eventTestSmite = {
    game: "Smite",
    time: "8PM",
    name: "Smite Event 1"
}

var eventTestHL = {
    game: "Killing Floor",
    time: "6PM",
    name: "Killing Floor Event 2"
}

var events = [eventTestSmite, eventTestHL];

function getEvents(channelID){
    var eventNames = [];
    for(var i = 0; i < events.length; i++){
        eventNames.push((i+1)+". "+events[i].name + ' At: ' + events[i].time);
    }
    
    bot.sendMessage({
        to: channelID,
        message: "**Events** - IN PROGRESS\n```"+eventNames.join('\n')+"```"
    });
}



bot.on('ready', function (rawEvent) {
    var getDate = new Date();
    console.log("Discord.io - Version: "+ bot.internals.version.green);
    console.log(bot.username.magenta + " - (" + bot.id.cyan + ")");
    bot.setPresence({game: gameList[Math.floor(Math.random()*gameList.length)]});
    fs.writeFileSync('bot.JSON',"Updated at: "+getDate.toDateString()+"\n\n"+JSON.stringify(bot,null,'\t'));

});

bot.on('disconnected', function(){
    console.log("Bot has "+"disconnected".red + " from the server  Retrying...");
    setInterval(bot.connect(), 15000)
});

bot.on('message', function (user, userID, channelID, message, rawEvent) {
    if(message.toLowerCase() === "!events"){
        getEvents(channelID);
    }

    if(message.toLowerCase().search("!ask") === 0){
        askBot(message, channelID);

    }

    if(message.toLowerCase() === '!sounds'){
        var songList = fs.readdirSync('sounds');
        bot.sendMessage({
            to: channelID,
            message: "\n**Sounds**\nNote that when playing a sound.\nDo not enter the `.mp3` at the end. Just the name: `![Name Here]`\n\n"+songList.join("\n")
        })
    }

    if(message.toLowerCase().search("!accept") === 0){
        var serverCode = message.slice(8);
        bot.acceptInvite(serverCode);
        console.log("Accepted invite from " + user + ". Invite code: " + serverCode)
    }

    if(message.toLowerCase().search("!twitch") === 0){
        var searchUser = message.slice(8);
        twitchClient.checkTwitchUser(searchUser, channelID, bot);
    }

    if(message.toLowerCase() === "!topkek"){
        bot.sendMessage({
            to: channelID,
            message: "http://i1.kym-cdn.com/photos/images/list/000/706/368/0cc.gif"
        })
    }

    if(message === "!twtest"){
        twitchClient.searchTwitch(bot);
    }

    if(message.toLowerCase().search("!setgame") === 0){
        var msg = message.slice(9);
        setPresence(msg);
    }

    if(message.toLowerCase()==="!listmembers"){
        var listMembers = [];
        for(var i in bot.servers["102910652447752192"].members){
            listMembers.push(bot.servers["102910652447752192"].members[i].user.username);
        }
        bot.sendMessage({
            to: channelID,
            message: "\n**Members:**\n```" + listMembers.join("\n") + "```"
        });
    }

    // SOUNDS
    if(message.toLowerCase().search("!") === 0){
        var botSounds = fs.readdirSync('sounds');
        if(message.length > 1){
            var songNum = searchSong(message, botSounds);
            if(songNum !== null){
                playSound(songNum, botSounds);
            }
        }
    }

    if(rawEvent.d.author.username !== bot.username){                 // Does not check for bot's own messages.
        
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
            bot.sendMessage({
                to: "102910652447752192",
                message: newMsg
            });
        }

        if(message.toLowerCase().search("~usrname") == 0 && user === "Mesmaroth"){
            var newName = message.slice(9);
            bot.editUserInfo({
                username: newName,
                password: botLogin.password
            });
            console.log(botGetTime()+" Changed name to: " + newName.green);
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
                message: "\n```Username: "+bot.username+"\nAuthor: Mesmaroth\nWritten in: Javascript\n"+
                "Library: Discord.io by izy521\nVersion: Discord.io: "+bot.internals["version"]+"\nAvatar: https://cdn.discordapp.com/avatars/"+bot.id+
                "/"+bot.avatar+".jpg\nThanks to: izy521, negativereview, yukine.```"
            });
        }

        if (message.search("!delete") === 0 && (user === "Mesmaroth" || user === "Gun")) {
        var messageNum = message.slice(7);
         bot.getMessages({
            channel: channelID,
            limit: (Number(messageNum)+1)       //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
        }, function (error, messageArr) {
            if(error) return console.log(error);
            var arrSize = messageArr.length;
            for(var i = 0; i < arrSize; i++){
                var msgID = messageArr[i].id;
                bot.deleteMessage({
                    channel: channelID,
                    messageID: msgID
                });
            }
            });
        }

        if (message.toLowerCase() === "1v1") {
            var listMsgs = ["My nigga! Let's go then bitch!!", " nah you scared...", " you don't want that."]
            var msg = listMsgs[Math.floor(Math.random()*listMsgs.length)];
            bot.sendMessage({
                to: channelID,
                message: "<@" + userID + ">" + " " + msg,
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

    } // -------------------------End of non-msgBot check

    if(message.toLowerCase() === "!yes") {
        bot.sendMessage({
            to: channelID,
            message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
        });
    }

// Delete Bot messages only.
    if(message.toLowerCase() === "!msgdelbot" && user === "Mesmaroth"){
        bot.getMessages({
            channel: channelID,
            limit: 100
        }, function (error, messageArr){
            if(error) return console.log(error);
            var msgsDel = 0;
            for(var i = 0; i < messageArr.length; i++) {
                if(messageArr[i].author.username === bot.username) {
                    bot.deleteMessage({
                        channel: channelID,
                        messageID: messageArr[i].id
                    });
                    msgsDel+=1;
                }
            }
        });
    }

// Delete gun messages only
    if(message.toLowerCase() === "$sudo rm gun -r" && user === "Gun") {
        bot.getMessages({
            channel: channelID,
            limit: 100
        }, function (error, messageArr){
            if(error) return console.log(error);
            var msgsDel = 0;
            for(var i = 0; i < messageArr.length; i++){
                if(messageArr[i].author.username === 'Gun'){
                    bot.deleteMessage({
                        channel: channelID,
                        messageID: messageArr[i].id
                    });
                    msgsDel+=1;
                }
            }
            consoelMsgDel(user,msgsDel);
        });
    }

    if(message.toLowerCase()==="!neil"){
        bot.uploadFile({
            to: channelID,
            file: "pictures/1Neil.png",
            filename: "Neil.png"
        });
    }

    if(message.toLowerCase() === "!ping") {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + "Not working right now.",
            typing: true
        });
    }

    if(message.toLowerCase()==="peace" || message.toLowerCase()==="goodnight") {
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
            message: "<@" + userID + ">" + " Because fuck you! That's why!"
        });
    }

    if(message.toLowerCase() === "!doit") {
        bot.sendMessage({
            to: channelID,
            message: "https://media.giphy.com/media/TCaq4FekwSV5m/giphy.gif"
        });
    }

    if(message.toLowerCase() === "!bmj"){
        bot.sendMessage({
            to: channelID,
            message: "http://cdn.makeagif.com/media/9-13-2015/28JfPx.gif"
        });
    }

    if(message.toLowerCase() === "!whoa"){
        try{
            bot.uploadFile({
                to: channelID,
                file: "pictures/whoaMan.jpg",
                filename: "whoaMan.jpg"
            });
        }
        catch(err){
            bot.sendMessage({
                to: channelID,
                message: err
            })
        }
    }

});
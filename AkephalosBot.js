var DiscordClient = require('discord.io');
var colors = require('colors');
var botLogin = require('./botLogin.js').akeBotInfo;
var bot = new DiscordClient({
    token: botLogin.token,
    autorun: true
});
var gameList = ["Half-Life", "Portal", "World of Warcraft", "DayZ", "Smite"];
var setMorning = false;
var isInVChannel = false; // voice channel bool for music bot
// ------
var twitchClient = require("node-twitchtv");
var account = ("twitch-test/account.json");
var twitch = new twitchClient(account);

var botSounds = ["sounds/GetNoScoped.mp3", "sounds/DamnSon.mp3",
        "sounds/WhyUMad.mp3", "sounds/SupaHotFire.mp3",
        "sounds/WomboCombo.mp3", "sounds/ThatKilledHim.mp3",
        "sounds/GetTheCamera.mp3", "sounds/Nice.mp3",
        "sounds/JohnCena.mp3", "sounds/Wow.mp3",
         "sounds/HitMarker.mp3", "sounds/YouFuckedUp.mp3", "sounds/TheFuckIsThat.mp3"];

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

function consoleMsgDel(user,msgDel){         // logs any message deletion to console
    return console.log("Deleted "+ (msgDel-1) + " messages for " + user.cyan + " at "+ getDateConsole().green );
}

function botLogChan(msg){       // Sends all feedback to the bot feedback channel
    bot.sendMessage({
        to: "148891779364683776",
        message: botGetTime()+ " " + msg
    });
}

function playSound(songNum) {
    var channelID = "102910652766519296"
    bot.joinVoiceChannel(channelID, function(){
        bot.getAudioContext({channel: channelID, stereo: true }, function(stream){
            stream.playAudioFile(botSounds[songNum]);
            stream.once('fileEnd', function(){
                bot.leaveVoiceChannel(channelID);
            });
        });        
    });
}

function getServers(){
    var serverList = [];
    for(var i in bot.servers){
        serverList.push(i.server);
    }
    console.log(serverList.join("\n"));
}


bot.on('ready', function (rawEvent) {
    var getDate = new Date();
    console.log("Discord.io - Version: "+ bot.internals.version.green);
    console.log(bot.username.magenta + " - (" + bot.id.cyan + ")");
    bot.setPresence({game: gameList[Math.floor(Math.random()*gameList.length)]});
    require('fs').writeFileSync('bot.JSON',"Updated at: "+getDate.toDateString()+"\n\n"+JSON.stringify(bot,null,'\t'));
    getServers();
});

bot.on('disconnected', function(){
    console.log("Bot has "+"disconnected".red + " from the server  Retrying...");
    setInterval(bot.connect(), 15000)
});

bot.on('message', function (user, userID, channelID, message, rawEvent) {
    if(message.toLowerCase().search("!accept") === 0){
        var serverCode = message.slice(8);
        bot.acceptInvite(serverCode);
        bot.sendMessage({
            to: channelID,
            message: "I have succesfully joined your server."
        });
        console.log("Accepted invite from " + user + ". Invite code: " + serverCode)
    }

    if(message.toLowerCase().search("!twitch") === 0){
        var searchUser = message.slice(8);        
        twitch.streams({channel: searchUser}, function (err, user) {
            if(user.stream != null){
                bot.sendMessage({
                    to: channelID,
                    message: "User **" + searchUser + "** is `Online`\n" + user.stream.channel.url
                });
            }
            else if(user.stream === null) {
                bot.sendMessage({
                    to: channelID,
                    message: "User is offline"
                });
            }

            if(err){
                bot.sendMessage({
                    to: channelID,
                    message: err
                });
            }
        });
    }

    if(message.toLowerCase().search("!setgame") === 0){
        var msg = message.slice(9);
        setPresence(msg);
    }

    if(message.toLowerCase() === "!me"){            // Displays your information to the person that called it.
        bot.sendMessage({
            to: channelID,
            message: "```\nUsername: " + JSON.stringify(bot.servers["102910652447752192"].members[userID].user.username) +
            "\nID: "+bot.servers["102910652447752192"].members[userID].user.id +
            "\nAvatar: "+"https://cdn.discordapp.com/avatars/"+bot.servers["102910652447752192"].members[userID].user.id+"/"+bot.servers["102910652447752192"].members[userID].user.avatar+".jpg ```"
        });
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
    // ------------------------------------------- 
    if(rawEvent.d.author.username !== bot.username){                 // Does not check for bot's own messages.
        if(message.toLowerCase() === "!commands") {
        bot.sendMessage({
            to: channelID,
             message: "<@" + userID + "> "+ "```Akephalos\nBot Commands:\n\n1. !botInfo: About me\n"+
             "2. !me: View your information\n"+
             "3. !Sample text: Outputs Sample Text Youtube video.\n"+
             "4. !ping: See ping status\n5. Peace or Goodnight: I will say bye!\n" +
             "6. No invite?: That's just cold.\n7. !rekt: Display's rekt meme gif.\n" +
             "8. 1V1: Bot will fight you.\n9. !Yes: Creepy Jack gif\n"+
             "10. !doit: JUST DO IT!\n11. !reverse: To reverse your message\n"+
             "12. !listmembers: See all members\n13. !date: Show date\n14. !time: Show time\n16. !noscope: Get noscoped!\n\n"+
             "Music Commands:\n\n1. !music: Type to see options.```"
            });
        }

        if(message.toLowerCase().search("!say") === 0 && user==="Mesmaroth"){
            var newMsg = message.slice(5);
            bot.sendMessage({
                to: "102910652447752192",
                message: newMsg
            });
        }
        else if (message.toLowerCase().search("!say") === 0 && user!=="Mesmaroth"){
            botLogChan("**"+user+"**"+" attempted an unauthorized command.");
            console.log(user+" tried " + message);
        }

        if(message.toLowerCase().search("~usrname") == 0 && user === "Mesmaroth"){
            var newName = message.slice(9);
            bot.editUserInfo({
                username: newName,
                password: botLogin.password
            });
            console.log(botGetTime()+" Changed name to: " + newName.green);
        }
        else if (message.toLowerCase().search("~usrname") == 0 && user !== "Mesmaroth") {
            botLogChan("**"+user+"**"+" attempted an unauthorized command.");
            console.log(user+" tried " + message);
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

        if(message.toLowerCase() === "!events"){
            bot.sendMessage({
                to: channelID,
                message: "Still working on it."
            });
        }

        switch(message.toLowerCase()) {         // SOUNDS
            case '!noscope': {
                playSound(0);
                break;
            }
            case '!damnson': {
                playSound(1);
                break;
            }
            case '!mad': {
                playSound(2);
                break;
            }
            case '!supahot': {
                playSound(3);
                break;
            }
            case '!wombo': {
                playSound(4);
                break;
            }
            case '!jr': {
                playSound(5);
                break;
            }
            case '!mom': {
                playSound(6);
                break;
            }
            case '!nice': {
                playSound(7);
                break;
            }
            case '!bmj': {
                playSound(8);
                break;
            }
            case '!wow': {
                playSound(9);
                break;
            }
            case '!x': {
                playSound(10);
                break;
            }
            case '!nyfu': {
                playSound(11);
                break;
            }
            case '!thefuck': {
                playSound(12);
                break;
            }
        }
        // ----------

            // for when somone didn't invite someone
         if(message.toLowerCase().search("no invite") >= 0) {
            bot.sendMessage({
                to: channelID,
                message:"That's cold.",
                typing: true
            });
        }

        if(message.toLowerCase() === "!botinfo"){
            bot.sendMessage({
                to: channelID,
                message: "```\nUsername: "+bot.username+"\nAuthor: Mesmaroth\nWritten in: Javascript\n"+
                "Library: Discord.io by izy521\nVersion: Discord.io: "+bot.internals["version"]+"\nAvatar: https://cdn.discordapp.com/avatars/"+bot.id+
                "/"+bot.avatar+".jpg\nThanks to: izy521, negativereview, yukine.```"
            })
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
        else if(message.search("!delete") === 0 && (user !== "Mesmaroth" || user === "Gun")){
            botLogChan("**"+user+"**"+" attempted an unauthorized command.");
            console.log(user + " tried "+ message);
        }

        // TEST: Displays other users status when mentioning them. !check @Bot
        if(message.search("!check") === 0){
            var mentionsArr = rawEvent.d.mentions;
            if(mentionsArr.length > 0){
                var usrMentionID = mentionsArr[0].id;
                bot.sendMessage({
                    to: channelID,
                    message: "```\nUser: "+bot.servers["102910652447752192"].members[usrMentionID].user.username+"\nStatus: "+bot.servers["102910652447752192"].members[usrMentionID]["status"]+"\n```"
                });
            }
        }

        // For when someone says !1v1
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
    if(message.toLowerCase() === "!delmsgbot" && user === "Mesmaroth"){
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
            consoleMsgDel(user,msgDel);
        });
    }
    else if(message.toLowerCase() === "!delmsgbot" && user !== "Mesmaroth"){
        botLogChan("**" + user + "**" + "attempted an unauthorized account.");
    }

    // Delete Mesmaroth messages only
    if(message.toLowerCase() === "!delmsgmes" && user === "Mesmaroth") {
        bot.getMessages({
            channel: channelID,
            limit: 100
        }, function (error, messageArr){
            if (error) return console.log(error);
            var msgsDel = 0;
            for(var i = 0; i < messageArr.length; i++){
                if(messageArr[i].author.username === user){
                    bot.deleteMessage({
                        channel: channelID,
                        messageID: messageArr[i].id
                    });
                    msgsDel+=1;
                }
            }
            consoleMsgDel(user,msgsDel);
        });
    }
    else if(message.toLowerCase() === "!delmsgmes" && user !== "Mesmaroth"){
       botLogChan("**" + user + "**" + "attempted an unauthorized account.");
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
    else if(message.toLowerCase() === "$sudo rm gun -r" && user !== "Gun") {
        botLogChan("**" + user + "**" + "attempted an unauthorized account.");
    }

    // check to see if bot is mentioned
    function mentionedBot(rawEvent) {
        var mentionArr = rawEvent.d.mentions;
        for (var i=0; i<mentionArr.length; i++) {
            if (mentionArr[i].id === bot.id) {
                return true;
            }
        }
        return false;
    } 

    // if bot is mentioned with having FU;
    if ( mentionedBot(rawEvent) && (message.toLowerCase().search("fuck you") > bot.username.length+2) ) {
        bot.sendMessage({
            to: channelID, 
            message: "<@" + userID + ">"+" Why you mad!",
            typing: true
        });
    }

    if(message.toLowerCase()==="!neil"){
        bot.uploadFile({
            to: channelID,
            file: "pictures/1Neil.png",
            filename: "Neil.png"
        });
    }

    //check ping
    if(message.toLowerCase() === "!ping") {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + "Not working right now.",
            typing: true
        });
    }

    // Say goodye
    if(message.toLowerCase()==="peace" || message.toLowerCase()==="goodnight") {
        bot.sendMessage({
            to: channelID,
            message: "Bye! :)",
            typing: true

        });
    }

    // For when someone says rekt
    if(message.toLowerCase() === "!rekt" || message.toLowerCase() === "rekt") {
        bot.sendMessage({
            to: channelID,
            message: "https://giphy.com/gifs/rekt-vSR0fhtT5A9by"
        });
    }

    // for when someone says why?
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

    if(message.toLowerCase() === "!who" || message.toLowerCase() === "!cena"){
        bot.sendMessage({
            to: channelID,
            message: "http://cdn.makeagif.com/media/9-13-2015/28JfPx.gif"
        });
    }

});
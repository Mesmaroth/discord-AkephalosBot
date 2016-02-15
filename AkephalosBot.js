var DiscordClient = require('discord.io');
var botLogin = require('./akeBotLogin.js').akeBotInfo;
var colors = require('colors');
var bot = new DiscordClient({
    token: botLogin.token,
    autorun: true
});

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

var gameList = ["Half-Life", "Portal", "World of Warcraft", "DayZ", "Smite"];
bot.on('ready', function (rawEvent) {
    var getDate = new Date();
    console.log("Discord.io - Version: "+ bot.internals.version.green);
    console.log(bot.username.magenta + " - (" + bot.id.cyan + ")" + " Token: " + "[[" + bot.internals.token.green + "]]");
    bot.setPresence({game: gameList[Math.floor(Math.random()*gameList.length)]});
    //require('fs').writeFileSync('bot.JSON',"Updated at: "+getDate.toDateString()+"\n\n"+JSON.stringify(bot,null,'\t'));
});

bot.on('disconnected', function(){
    console.log("Bot has "+"disconnected".red + " from the server  Retrying...");
    setInterval(bot.connect(), 15000)
});

function getMorning (){
    var d = new Date();
    if (d.getHours() < 12 && d.getHours() >=8){
        return true;
    }
    return false;
}

var setMorning = false;

bot.on('presence', function (user, userID, status, gameName, rawEvent){
    if(setMorning === false && getMorning() === true && status === 'online' && user === "xTris10x"){
        bot.sendMessage({
            to: "102910652447752192",
            message: "<@"+userID+">"+" morning. https://media.giphy.com/media/Xs9JV74p71qQU/giphy.gif"
        });
        setMorning = true;
    }

    if(status === 'online' && getMorning() === false){  // Reset morning 
        setMorning = false;
    }
});

function consoleMsgDel(user,msgDel){         // logs any message deletion to console
    return console.log("Deleted "+ (msgDel-1) + " messages for " + user.cyan + " at "+ getDateConsole().green );
}

var mBot = {
    vChannel: "",
    playSong: function (message, user){
        var songList = require('fs').readdirSync('music/')
        bot.getAudioContext({channel: this.vChannel, stero: true}, function(stream){
            //stream.stopAudioFile();
            var songNum = Number(message.slice(6));
            stream.playAudioFile('music/' + songList[songNum-1] );
            this.isPlaying = true;
            bot.sendMessage({
                to: "148891779364683776",
                message: "**"+user+"**" + " requested:  " + "*"+songList[songNum-1]+"*"
            });
        });
    },
    stopSong: function (){
        bot.getAudioContext({channel: this.vChannel, stero: true}, function(stream){
            stream.stopAudioFile();
        });
    }
}

var isInVChannel = false; // voice channel bool for music bot

bot.on('message', function (user, userID, channelID, message, rawEvent) {
    var songList = require('fs').readdirSync('music/');
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
             "10. Why?: Go ahead ask me why.\n11. !doit: JUST DO IT!\n"+
             "12. !reverse: To reverse your message"+
             "13. !listmembers: See all members\n 14. !date: Show date\n15. !time: Show time\n\n"+
             "Music Commands:\n\n1. !songlist: List songs to play.\n"+
             "2. !play #: Play a song by there number.\n3. !stop: Stop playing current music.```"
            });
        }

        if(message.toLowerCase().search("~usrname") == 0 && user === "Mesmaroth"){
            var newName = message.slice(9);
            console.log("Changed name at: "+ consoleMsgDel() + " to " + newName.cyan);
            bot.editUserInfo({
                username: newName,
                password: botLogin.password
            });
        }
        else if (message.toLowerCase().search("~usrname") == 0 && user !== "Mesmaroth") {
            bot.sendMessage({
                to: channelID,
                message: "You are not allowed to do that."
            });
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
        // MUSIC
        if(message.toLowerCase().search("!play") === 0){
            mBot.playSong(message, user);
        }

        if(message.toLowerCase()==="!joinvc"){
          mBot.vChannel = "102910652766519296"
          bot.joinVoiceChannel(mBot.vChannel);
          isInVChannel = true;
        }

        if(message.toLowerCase() === "!vc"){
            mBot.vChannel = "134125693104685056"  // Test channel
            bot.joinVoiceChannel(mBot.vChannel);
            isInVChannel = true;
        }

        if(message.toLowerCase() === "!stop"){
            mBot.stopSong();
        }

        if(message.toLowerCase()==="!leavevc" || message.toLowerCase()==="!lvc"){
            bot.leaveVoiceChannel(mBot.vChannel)
        }

        if(message.toLowerCase()==="!songlist" || message.toLowerCase() === "!listsongs" || message.toLowerCase() === "!songs"){
            var listSongs = require('fs').readdirSync('music/');
            var listSize = listSongs.length;
            for(var i = 0; i < listSize; i++){
                listSongs[i]=(i+1)+" - "+ listSongs[i];
            }
            bot.sendMessage({
                to: channelID,
                message: "```\nSongList  Use `!play #` command.\n"+listSongs.join("\n")+"```"
            });
        }

            // for when somone didn't invite someone
         if(message.toLowerCase().search("no invite") >= 0) {
            bot.sendMessage({
                to: channelID,
                message:"That's cold blooded right there man.",
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

        if (message.search("!delete") === 0 && user === "Mesmaroth") {
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

        if (message == "!getMsgs"){
            bot.getMessages({
                channel: channelID,
                limit: 50
            }, function (error, messageArr){
                if (error) return console.log(error);
                console.log(messageArr);
                console.log(typeof messageArr);
                console.log(messageArr.length)
            });
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
        bot.sendMessage({
            to: channelID,
            message: "You are not authorized to do that."
        });
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
        bot.sendMessage({
            to: channelID,
            message: "<@"+userID + ">" + "You are not authorized to do that."
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
    else if(message.toLowerCase() === "$sudo rm gun -r" && user !== "Gun") {
        bot.sendMessage({
            to: channelID,
            message: "<@"+userID + ">" + "You are not authorized to do that."
        });
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

    if ( message.toLowerCase() === "fuck you") {
        bot.sendMessage({
            to: channelID,
            message: "http://4.bp.blogspot.com/-XWNXDprHibk/UYxniZERK6I/AAAAAAAAW1Y/RyvRcq_Q_cc/s640/vlcsnap-2011-11-10-19h19m39s159.png"
        });
    }

    if(message.toLowerCase()==="!neil"){
        bot.uploadFile({
            to: channelID,
            file: require('fs').createReadStream("pictures/1Neil.png")
            });
    }

    //sample text
    if(message.toLowerCase() === "!sample text" || message.toLowerCase() === "!sp") {
        bot.sendMessage({
            to: channelID,
            message: "SampleText.MP4?\nhttps://www.youtube.com/watch?v=Tlr1L8FHp2U",
        });
    }

    //check ping
    if(message.toLowerCase() === "!ping") {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + " Ping deez nuts in your mouth",
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
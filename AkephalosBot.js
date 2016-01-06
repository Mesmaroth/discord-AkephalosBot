var DiscordClient = require('discord.io');
var colors = require('colors');
var bot = new DiscordClient({
    token: "{TOKEN}",
    autorun: true
});

bot.on('ready', function(rawEvent) {
    var getDate = new Date();
    console.log(bot.username.magenta + " - (" + bot.id.cyan + ")" + " Token: " + "[[" + bot.internals.token.green + "]]");
    bot.setPresence({game: "Doom"});

    require('fs').writeFileSync('bot.JSON',"Updated at: "+getDate.toDateString()+"\n\n"+JSON.stringify(bot,null,'\t'));
    console.log("Succesfully written Bot properties at "+"bot.JSON".green);


    bot.joinVoiceChannel("134125693104685056");
});

bot.on('disconnected', function(){
    console.log("Bot has"+" disconnected ".red + "from the server. \tRetrying...");
    setInterval(bot.connect(), 15000)
});

function getDate(){       // month-day-year
    var d = new Date();
    var dHours = (d.getHours()-12).toString();
    var dMinutes = (d.getMinutes()<10) ? "0"+d.getMinutes().toString() : d.getMinutes().toString();
    return d.toDateString().green+" at "+dHours.green+":"+dMinutes.green;
}

function consoleMsgDel(user,msgDel){         // outputs any message deletion to console
    return console.log("Deleted "+ (msgDel-1) + " messages for " + user.cyan + " at "+ getDate().green );
}

bot.on('message', function(user, userID, channelID, message, rawEvent) {

    if(message.toLowerCase()==="!neil"){
        bot.uploadFile({
            to: channelID,
            file: require('fs').createReadStream("pictures/1Neil.png")
            });
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
            message: "```" + listMembers + "```"
            });
    }
    // ------------------------------------------- 
    if(rawEvent.d.author.username !== bot.username){                 // Does not check for bot's own messages.
        if(message.toLowerCase() === "!commands") {
        bot.sendMessage({
            to: channelID,
             message: "<@" + userID + "> "+ "```Akephalos\nHere are my commands:\n\n1. !botInfo: About me\n"+
             "2. !me: View your information\n"+
             "3. !Sample text: Outputs Sample Text Youtube video.\n"+
             "4. !ping: See ping status\n5. Peace or Goodnight: I will say bye!\n" +
             "6. No invite?: Results in saying that, that's cold.\n7. !rekt: Display's rekt meme gif.\n" +
             "8. 1V1: Bot will fight you.\n9. !Yes: Creepy Jack gif\n"+
             "10. Why?: Go ahead ask me why.\n11. !doit: JUST DO IT!\n"+
             "12. !reverse: To reverse your message```"
            });
        }

        if(message.search("!reverse") === 0){
            var userString = message.slice(8);
            var newWord = [];
            for(var i = userString.length; i>0;i--){
                newWord.push(userString[i-1]);
            }
            bot.sendMessage({
                to: channelID,
                message: newWord.join("")
            });
        }
        // SONGS
        var songList = [
        "Vinterkvarteret - Goodbye Horses(Instrumental)",
        "Bonobo - Pieces - Featuring Cornelia",
        "U2 - I Still Haven't Found What I'm Looking For",
        "U2 - With or without you",
        "Chaos Chaos (formerly Smoosh) - Do You Feel It",
        "Mazzy Star - Look On Down From The Bridge",
        "kansas-carry on wayward son",
        "Coldplay - A Sky Full Of Stars",
        "Journey - Don't Stop Believin",
        "Spongebob - Sweetvictory",
        "Eric Rigo - Back Home"]

        // play MUSIC
        bot.getAudioContext({channel: "134125693104685056", stereo: true}, function(stream){
            if(message.search("!play") === 0){
                var songNum = message.slice(6);               
                if(typeof Number(songNum) === 'number' && Number(songNum) <= songList.length && Number(songNum) > 0){
                    songNum = Number(songNum);
                    stream.playAudioFile("music/"+songList[songNum-1]+".mp3");
                    bot.sendMessage({
                        to: "102910652447752192",
                        message: "♫Now playing: "+songList[songNum-1]+"♫"
                    });
                }
            }

            if(message==="!stop"){
                stream.stopAudioFile();
            }
        });

        if(message==="!leavevc" && user === "Mesmaroth"){
            bot.leaveVoiceChannel("134125693104685056")
        }
        if(message==="!joinvc" && user === "Mesmaroth"){
            bot.joinVoiceChannel("134125693104685056");
        }

        if(message.toLowerCase()==="!songlist"){
            var listSongs = "";
            bot.sendMessage({
                to: channelID,
                message: "```\nSongList\n"+songList.join("\n")+"```"
            });
        }
    // ---------------------------
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
                "/"+bot.avatar+".jpg\nThanks to: izy521, treexxjay, negativereview, yukine.```"
            })
        }
        // TEST
        if(message.search("!test") === 0){
            var mentionsArr = rawEvent.d.mentions;
            if(mentionsArr.length > 0){
                var usrMentionID = mentionsArr[0].id;
                console.log(usrMentionID);
                bot.sendMessage({
                    to: channelID,
                    message: "```\nUser: "+bot.servers["102910652447752192"].members[usrMentionID].user.username+"\nStatus: "+bot.servers["102910652447752192"].members[usrMentionID]["status"]+"\n```"
                });
            }
        }

    } // --- End of non-msgBot check

    if(message.toLowerCase() === "!yes") {
        bot.sendMessage({
            to: channelID,
            message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
        });
       }

    if ((message.toLowerCase() === "!delete") && user === "Mesmaroth") {
         bot.getMessages({
            channel: channelID,
            limit: 5 //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
        }, function(messageArr) {
            for(var i = 0; i < messageArr.length; i++){
                var msgID = messageArr[i].id;
                bot.deleteMessage({
                    channel: channelID,
                    messageID: msgID
                })
            }
        });
    }
    else if((message.toLowerCase() === "!delete") && user !== "Mesmaroth") {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + " You are not authorized to use this command.",
            typing: true
        });
    }

// Delete Bot messages only.
    if(message.toLowerCase() === "!delmsgbot" && user === "Mesmaroth"){
        bot.getMessages({
            channel: channelID,
            limit: 100
        }, function(messageArr){
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
            console.log("Deleted "+msgsDel+" messages for "+bot.username.cyan+" at "+getDate());
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
        }, function(messageArr){
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
        }, function(messageArr){
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

    // For when someone says !1v1
    if (message.toLowerCase()=== "1v1" || message.toLowerCase() === "!1v1") {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">"+" My nigga! Let's go then bitch!!",
            typing: true
        });
    }

    // for when someone says why?
    if (message.toLowerCase() === "why?") {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + " Because fuck you! That's why!",
            typing: true
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

var DiscordClient = require('discord.io');
var bot = new DiscordClient({
    token: "...",
    autorun: true
});


bot.on('ready', function(rawEvent) {
    //bot.setName();
    require('fs').writeFileSync('./bot.json', JSON.stringify(bot, null, '\t'))
    console.log(bot.username + " - (" + bot.id + ")" + "Token: " + "[[" + bot.internals.token + "]]");
    bot.setPresence({game: "Doom"});

     // Reminds the channel to 
    function remindChannel() {
        bot.sendMessage({
            to: "102910652447752192",   // test-area channel
            message: "To see my commands type: *!Commands*",
            typing: true
        });
    }      
    setInterval(remindChannel, 7200000); // @ every 2 hours
});



bot.on('presence', function(user, userID, status, gameName, rawEvent) {

    
 });




bot.on('message', function(user, userID, channelID, message, rawEvent) {

    if(message.toLowerCase() === "!commands") {
    bot.sendMessage({
        to: channelID,
         message: "<@" + userID + ">"+ "```Akephalos\nHere are my commands:\n\n1. @mentions: gives you a rude statement.\n2. !Sample text: Outputs Sample Text Youtube video.\n3. !ping: See ping status\n4. Peace or Godnight: Saying peace or goodnight will result in Akephalos also saying goodbye.\n5. No invite?: Results in saying that, that's cold.\n6. !rekt: Display's rekt meme gif.\n7. 1V1: Bot will fight you.\n8. !Yes: Creepy Jack gif\n9. Why?: Go ahead ask me why.\n10. !doit: JUST DO IT!```"
        });
    }

    if(message.toLowerCase() === "!yes") {
        bot.sendMessage({
            to: channelID,
            message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
        });
       }


    if ((message.toLowerCase() === "!delete") && user === "Mesmaroth") {
         bot.getMessages({
            channel: channelID,
            limit: 100 //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
        }, function(messageArr) {
            for(var i = 0; i < messageArr.length; i++)
            {
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
if(message.toLowerCase() === "!delmsgakephalos" && user === "Mesmaroth"){
    bot.getMessages({
        channel: channelID,
        limit: 100
    }, function(messageArr){
        for(var i = 0; i < messageArr.length; i++) {
            if(messageArr[i].author.username === 'Akephalos (Bot)') {
                bot.deleteMessage({
                    channel: channelID,
                    messageID: messageArr[i].id
                });
            }
        }
    });
}
    // Delete Mesmaroth messages only
    if(message.toLowerCase() === "!delmsgmes" && user === "Mesmaroth") {
        bot.getMessages({
            channel: channelID,
            limit: 100
        }, function(messageArr){
            var msgsDeleted = 0;
            for(var i = 0; i < messageArr.length; i++){
                if(messageArr[i].author.username === 'Mesmaroth'){
                    bot.deleteMessage({
                        channel: channelID,
                        messageID: messageArr[i].id
                    });
                    msgsDeleted+=1;
                }
            }
            console.log("Deleted "+ (msgsDeleted-1) + " messages for " + user);
        });
    }

// Delete gun messages only
if(message.toLowerCase() === "$sudo rm gun -r" && user === "Gun") {
    bot.getMessages({
        channel: channelID,
        limit: 100
    }, function(messageArr){
        var msgsDeleted = 0;
        for(var i = 0; i < messageArr.length; i++){
            if(messageArr[i].author.username === 'Gun'){
                bot.deleteMessage({
                    channel: channelID,
                    messageID: messageArr[i].id
                });
                msgsDeleted+=1;
            }
        }
        console.log("Deleted "+ (msgsDeleted-1) + " messages for " + user); // not including command request
    });
}
else if(message.toLowerCase() === "$sudo rm gun -r" && user !== "Gun") {
    bot.sendMessage({
        to: channelID,
        message: "<@"+userID + ">" + "You are not authorized to do that.",
        typing: true
    });
}

if(message === "!getMsgs") {
    bot.getMessages({
        channel: channelID,
        limit: 50
    }, function(messageArr){
        console.log(messageArr);
    });
}
if(message=== "!rawEvent")
{
    console.log(rawEvent);
}
// --------------------------------------

    // check to see if bot is mentioned
    function mentionedMe(rawEvent) {
        var mentionArr = rawEvent.d.mentions;
        for (var i=0; i<mentionArr.length; i++) {
            if (mentionArr[i].id === bot.id) {
                return true;
            }
        }
        return false;
    } 

    // if bot is mentioned with having FU;
    if ( message.toLowerCase() === "<@" + bot.id + ">"+ " fuck you!") {
        bot.sendMessage({
            to: channelID, 
            message: "<@" + userID + ">"+" Why you mad!",
            typing: true
        });        
    }
    else if (mentionedMe(rawEvent)) {
        bot.sendMessage({
            to: channelID,
            message: "Why you calling me? Fuck off!",
            typing: true
        });
        
    }

    if ( message.toLowerCase() === "fuck you!") {
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

    // for when somone didn't invite someone
    if(message.toLowerCase() === "no invite?") {
        bot.sendMessage({
            to: channelID,
            message:"That's cold blooded right there man.",
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

});


var DiscordClient = require('discord.io');
var bot = new DiscordClient({
    token: "...",
    autorun: true
}); 

bot.on('ready', function(rawEvent) {
   console.log(bot.username + " - (" + bot.id + ")" + "Token: " + "[[" + bot.internals.token + "]]");
   console.log(rawEvent.d.user.username);
    bot.setPresence({
    game: "Doom"
    });

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

    // Special message for xTris10x
    if (user === "xTris10x" && status !== "online")
    {
        bot.sendMessage({
            to: userID,
            message: "I see you went offline like a faggot. HA! "
        });
        console.log("I've sent offline message");
    }
 });



bot.on('message', function(user, userID, channelID, message, rawEvent) {

    if(message === "!Commands" || message === "!commands"){
    bot.sendMessage({
        to: channelID,
         message: "<@" + userID + ">"+ "```Akephalos\nHere are my commands:\n\n1. @mentions: gives you a rude statement.\n2. !Sample text: Outputs Sample Text Youtube video.\n3. !ping: See ping status\n4. Peace or Godnight: Saying peace or goodnight will result in Akephalos also saying goodbye.\n5. No invite?: Results in saying that, that's cold.\n6. !rekt: Display's rekt meme gif.\n7. 1V1: Bot will fight you.\n8. !Yes: Creepy Jack gif\n9. Why?: Go ahead ask me why.```"
        });
    }

    if(message === "!yes" || message === "!Yes"){
        bot.sendMessage({
            to: channelID,
            message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
        });
       }

    if (message.indexOf("sucks") >= 0) {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">"+" you suck",
            typing: true
        });
        
    }


    if (message === "!delete")
    {
         bot.getMessages({
            channel: channelID,
            limit: 100 //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
        }, function(messageArr) {
            //Do something with your array of messages
            //console.log(messageArr[0]);
            for(var i=0;i<5;i++)
            {
                var ID = messageArr[i].id;
                bot.deleteMessage({
                    channel: channelID,
                    messageID: ID
                });            
            }
        });
    }

    function delHistory()
    {
        console.log("Deleting history now!")
        bot.getMessages({
            channel: channelID,
            limit: 100 //If 'limit' isn't added, it defaults to 50, the Discord default, 100 is the max.
        }, function(messageArr) {
            //Do something with your array of messages
            //console.log(messageArr[0]);
            for(var i=0;i<100;i++)
            {
                var ID = messageArr[i].id;
                bot.deleteMessage({
                    channel: channelID,
                    messageID: ID
                });            
            }
        });

    }

    if (message === "!del")
    {
        console.log("Deletion activated")
        setInterval(delHistory, 15000);
    }


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

    // if bot is given a direct message without having fuck you in it
    if ( (message.indexOf("fuck you") >= 0 || message.indexOf("Fuck you") >=0) && mentionedMe(rawEvent)) {
        bot.sendMessage({
            to: channelID, 
            message: "<@" + userID + ">"+" Why you mad!",
            typing: true
        });
        
    }
    else if (mentionedMe(rawEvent))
    {
        bot.sendMessage({
            to: channelID,
            message: "Why you calling me? Fuck off!",
            typing: true
        });
        
    }

    if ( message === "fuck you" || message === "Fuck you" || message === "FUCK YOU") {
        bot.sendMessage({
            to: channelID,
            message: "http://4.bp.blogspot.com/-XWNXDprHibk/UYxniZERK6I/AAAAAAAAW1Y/RyvRcq_Q_cc/s640/vlcsnap-2011-11-10-19h19m39s159.png"
        });
        
    }

    //sample text
    if(message === "!sample text" || message === "!Sample text"){
        bot.sendMessage({
            to: channelID,
            message: "SampleText.MP4?\nhttps://www.youtube.com/watch?v=Tlr1L8FHp2U",
        });
    }

    //check ping
    if(message === "ping" || message === "!ping"){
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + " Ping deez nuts in your mouth",
            typing: true
        });
    }


    // Say goodye, Also checks to see if peace is within the sentence 
    if(message === "peace" || message === "Peace" || message === "goodnight" || message ==="Goodnight"){
        bot.sendMessage({
            to: channelID,
            message: "Goodnight! :)",
            typing: true

        });
    }

    // for when somone didn't invite someone
    if(message === "No invite?" || message === "no invite?" || message === "no invite!"){
        bot.sendMessage({
            to: channelID,
            message:"That's cold blooded right there man.",
            typing: true
        });
    }

    // For when someone says rekt
    if(message === "!REKT" || message === "!Rekt" || message === "rekt" || message === "REKT" || message === "!rekt" || message === "Rekt") {
        bot.sendMessage({
            to: channelID,
            message: "https://giphy.com/gifs/rekt-vSR0fhtT5A9by"
        });
    }

    // For when someone says !1v1
    if (message ==="1v1" || message === "1V1"){
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">"+" My nigga! Let's go then bitch!!",
            typing: true
        });
    }

    // for when someone says why?
    if (message === "Why?" || message === "why?" || message ==="Why" || message === "Why"){
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + " Because fuck you! That's why!",
            typing: true
        });
    }

});


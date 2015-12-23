var DiscordClient = require('discord.io');
var bot = new DiscordClient({
    email: "..."
    password: "...",
    autorun: true
}); 

bot.on('ready', function() {
    console.log(bot.username + " - (" + bot.id + ")");
    console.log(bot.username + ": is Online");

    bot.setPresence({
    //idle_since: Date.now(),
    game_id: 13
    });
 

});


bot.on('message', function(user, userID, channelID, message, rawEvent, avatar) {

    if (message === "!info") {
        bot.sendMessage({
            to: channelID,
            message: "This channel ID is: " + channelID + "."
        });
        console.log("I've sent a message.");
    } 

    if (message.indexOf("sucks") >= 0) {
        bot.sendMessage({
            to: channelID,
            message: "you suck"
        });
        console.log("I've sent a message.");
    } 

    // check to see if bot is directed
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
    if ( (message.indexOf("fuck you") >= 0 || message.indexOf("Fuck you")) && mentionedMe(rawEvent)) {
        bot.sendMessage({
            to: channelID,
            message: "Why you mad!"
        });
        console.log("I've sent a message.");
    }
    else if (mentionedMe(rawEvent))
    {
        bot.sendMessage({
            to: channelID,
            message: "Why you calling me? Fuck off!"
        });
        console.log("I've sent a message.");
    }

    if ( (message.indexOf("fuck you") >= 0) || (message.indexOf("Fuck you") >= 0)) {
        bot.sendMessage({
            to: channelID,
            message: "http://4.bp.blogspot.com/-XWNXDprHibk/UYxniZERK6I/AAAAAAAAW1Y/RyvRcq_Q_cc/s640/vlcsnap-2011-11-10-19h19m39s159.png"
        });
        console.log("I've sent a message.");
    }

    //sample text
    if(message === "!sample text" || message == "!Sample text"){
        bot.sendMessage({
            to: channelID,
            message: "SampleText.MP4?\nhttps://www.youtube.com/watch?v=Tlr1L8FHp2U"
        });
    }

    //check ping
    if(message === "ping" || message === "!ping"){
        bot.sendMessage({
            to: channelID,
            message: "Ping deez nuts in your mouth"
        });
    }


    // Say goodye, Also checks to see if peace is within the sentence
    if(message === "peace" || message === "Peace" || message === "goodnight" || message ==="Goodnight" || (message.indexOf("peace") >= 0) ){
        bot.sendMessage({
            to: channelID,
            message: "Goodnight! :)"

        });
    }

    // for when somone didn't invite someone
    if(message === "No invite?" || message == "no invite?" || message === "no invite!"){
        bot.sendMessage({
            to: channelID,
            message:"That's cold blooded right there man.",
            tts: true
        });
    }

    // For when someone says rekt
    if(message === "!REKT" || message === "!Rekt" || message === "rekt" || message === "REKT" || message === "!rekt") {
        bot.sendMessage({
            to: channelID,
            message: "https://giphy.com/gifs/rekt-vSR0fhtT5A9by"
        });
    }

    // For when someone says !1v1
    if (message.indexOf("1v1") >= 0 || message.indexOf("1V1") >= 0){
        bot.sendMessage({
            to: channelID,
            message: "My nigga! Let's go then bitch!!"
        });
    }

});


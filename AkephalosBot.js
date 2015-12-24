var DiscordClient = require('discord.io');
var bot = new DiscordClient({
    email: "...",
    password: "...",
    autorun: true
}); 

bot.on('ready', function(user, userID, channelID, message, rawEvent) {
    console.log(bot.username + " - (" + bot.id + ")");
    console.log(bot.username + ": is Online");

    bot.setPresence({
    //idle_since: Date.now(),
    game_id: 19
    }); 

    // Number of times it says hello when first connecting.
    for(var x = 0;x<1;x++){
        bot.sendMessage({
            to: "128707001986449409",     // 102910652447752192 #general
            message: "`Online`= `true`"
        });
    }

    // Reminds the channel to 
    function remindChannel() {
        bot.sendMessage({
            to: "102910652447752192",   // test-area channel
            message: "To see my commands type `!Commands`"
        });
    }      
        setInterval(remindChannel, 5400000); // 1.5 hours

});


bot.on('presence', function(user, userID, status, rawEvent) {

    if(status === 'online')
    {
        bot.sendMessage({
            to: "102910652447752192",
            message: "<@" + userID + ">" + " Greetings!"
        });
    }

 });



bot.on('message', function(user, userID, channelID, message, rawEvent) {

    if(message === "!Commands" || message === "!commands"){
    bot.sendMessage({
        to: channelID,
         message: "<@" + userID + ">"+ "```Akephalos\nHere are my commands:\n\n1. @mentions: gives you a rude statement.\n2. !Sample text: Outputs Sample Text Youtube video.\n3. !ping: Out puts insult, ping does not work right now.\n4. Fuck you: displays Neil Degrass photo.\n5. Peace or Godnight: Saying peace or goodnight will result in Akephalos also saying goodbye.\n6. No invite?: Results in saying that, that's cold.\n7. !rekt: Display's rekt meme gif.\n8. 1v1: Bot will fight you. \n9.!Yes: Creepy Jack gif\n10. Why?: Go ahead ask me why.```"
        });
    }

    if(message === "!yes" || message == "!Yes"){
        bot.sendMessage({
            to: channelID,
            message:"https://media.giphy.com/media/3rgXBOmTlzyFCURutG/giphy.gif"
        });
       }

    if (message === "!info") {
        bot.sendMessage({
            to: channelID,
            message: "This channel ID is: " + channelID + "."
        });
        
    } 

    if (message.indexOf("sucks") >= 0) {
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">"+" you suck"
        });
        
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
            message: "<@" + userID + ">"+" Why you mad!"
        });
        
    }
    else if (mentionedMe(rawEvent))
    {
        bot.sendMessage({
            to: channelID,
            message: "Why you calling me? Fuck off!"
        });
        
    }

    if ( message === "fuck you" || message === "Fuck you" || message === "FUCK YOU") {
        bot.sendMessage({
            to: channelID,
            message: "http://4.bp.blogspot.com/-XWNXDprHibk/UYxniZERK6I/AAAAAAAAW1Y/RyvRcq_Q_cc/s640/vlcsnap-2011-11-10-19h19m39s159.png"
        });
        
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
            message: "<@" + userID + ">" + " Ping deez nuts in your mouth"
        });
    }


    // Say goodye, Also checks to see if peace is within the sentence
    if(message === "peace" || message === "Peace" || message === "goodnight" || message ==="Goodnight"){
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
    if (message ==="1v1" || message === "1V1"){
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">"+" My nigga! Let's go then bitch!!"
        });
    }

    // for when someone says why?
    if (message === "Why?" || message === "why?" || message=="Why" || message === "Why"){
        bot.sendMessage({
            to: channelID,
            message: "<@" + userID + ">" + " Because fuck you! That's why!"
        });
    }

});


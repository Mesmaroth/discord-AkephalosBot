var fs = require('fs');

function searchSong(message, soundsList){
    var songName = message.slice(1);
    for(var i = 0; i < soundsList.length; i++){
        var soundListName = soundsList[i].split('.');   // Splitting the name and extension
        soundListName = soundListName[0];
        if(soundListName === songName) return i;
    }
    return null;
}

module.exports.playSound = function(bot, channelID, message) {
	var soundsList = fs.readdirSync('./sounds');
	var songNum = searchSong(message, soundsList);
	if(songNum === null) return;
	var voiceChannelID = "";
	var file = 'sounds/'+soundsList[songNum];
	
    for(var i in bot.servers[bot.serverFromChannel(channelID)].channels){       // Get first voice channel
        if(bot.servers[bot.serverFromChannel(channelID)].channels[i].type === "voice" && bot.servers[bot.serverFromChannel(channelID)].channels[i].position === 0){
            voiceChannelID = bot.servers[bot.serverFromChannel(channelID)].channels[i].id;
            break;
        }
    }
    // play
    bot.joinVoiceChannel(voiceChannelID, function(){
        bot.getAudioContext({channel: voiceChannelID, stereo: true}, function (stream){
        	stream.playAudioFile(file);
            stream.once('fileEnd', function(){
                bot.leaveVoiceChannel(voiceChannelID);
            });
        });
    });
}
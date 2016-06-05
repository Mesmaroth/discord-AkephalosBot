var fs = require('fs');

function searchSong(message, soundsList){
    var soundName = message.slice(1);
    for(var i = 0; i < soundsList.length; i++){
        var soundListName = soundsList[i].split('.')[0];
        if(soundListName === soundName) return i;
    }
    return null;
}

module.exports.playSound = function(bot, channelID, message) {
	var soundsList = fs.readdirSync('./sounds');
	var songNum = searchSong(message, soundsList);
	if(songNum === null) return;
	var voiceChannelID = "";
	var file = 'sounds/'+soundsList[songNum];
	
    var serverChannels = bot.servers[bot.serverFromChannel(channelID)].channels;
    for(var i in serverChannels){       // Get first voice channel
        if(serverChannels[i].type === "voice" && serverChannels[i].position === 0){
            voiceChannelID = serverChannels[i].id;
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
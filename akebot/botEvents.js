// Akephalos Bot Events
// TODO
// Add reminder at event times
// Write events in JSON file
// delete event method

var eventTestSmite = {
	eventName: "Gem Day Grind!",
    game: "Smite",
    time: "8PM"
}

var eventTestKF = {
	eventName: "KF GORE FEST!",
    game: "Killing Floor",
    time: "6PM"    
}

var events = [eventTestSmite, eventTestKF];

module.exports.getEvents = function (bot, channelID){
	var eventList = [];
	if(events.length > 0){
		for(var i = 0; i < events.length; i++){
        	eventList.push("**"+(i+1)+". Event:** "+events[i].eventName+"\n**Time:** "+events[i].time+"\n**Game:** "+events[i].game);
    	}

	    bot.sendMessage({
	        to: channelID,
	        message: "\n**Events - BETA**\n\n"+eventList.join('\n\n')
	    });
	}

	if(events.length === 0){
		bot.sendMessage({
			to: channelID,
			message: "\n**Events - BETA**\n\n" + "*No events set*"
		});
	}    
}

module.exports.setEvent = function (bot, channelID, message){	
	message = message.slice(10);
	var eventArr = message.split("-");
	events.push({
		eventName: eventArr[0],
		game: eventArr[1],
		time: eventArr[2]
	})

	bot.sendMessage({
		to: channelID,
		message: "*Event set.*"
	});
}

module.exports.deleteEvent = function (bot,channelID,message){
	eventNum = message.slice(10);
	events.splice((eventNum-1),1);
	bot.sendMessage({
		to: channelID,
		message: "*Event deleted.*"
	});
}
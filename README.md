# Discord-AkephalosBot (Node.js)
Discord bot written in Node.js for [Discord](http://www.discord.gg) Anyone can edit or modify this project of their own doing, all I ask is a mention of me or by leaving `!about` with "author" with my name intact.

Library: [Discord.io](https://github.com/izy521/discord.io)

##Features:
 - Purging messages or channels
 - Clever Bot implemented, ask anything
 - Making commands can be written without a hassle with less code
 - Making quick and simple commands within the discord client
 - Custom sounds ready to be played, just drag and drop to the folder and your done
 - Upload your sounds to the bot within discord to play them
 - Twitch/Hitbox status, check if a user is live streaming

If you have any questions please ask them in my test Server:

[![Discord](https://discordapp.com/api/servers/160436336095002624/widget.png?style=banner3)](https://discord.gg/0tYqr4FWusEQHErS)

Try out my bot first before you check it out [Authorize Akephalos](https://discordapp.com/oauth2/authorize?&client_id=158451686627737600&scope=bot)

## Installation:

### Windows
  - Install [Node.JS](https://nodejs.org/dist/v4.4.7/node-v4.4.7-x64.msi)
  - Install [Python v2.7.x](https://www.python.org/downloads/)
  - Install [Visual C++ Build Tools](http://landinghub.visualstudio.com/visual-cpp-build-tools) using **Default Install**
  - Install [node-gyp](https://github.com/nodejs/node-gyp) (Open command prompt and enter `npm install -g node-gyp`)
  - Install [FFMPEG static build](https://ffmpeg.zeranoe.com/builds/) to PATH. [Tutorial to install FFMPEG on Windows](http://www.wikihow.com/Install-FFmpeg-on-Windows)
  - Enter bot token or email+pass in `akebot/botLogin.js` as well as [Cleverbot](https://cleverbot.io/) API key essentials
  - Run `install_modules.bat`
  - Run `Start_Bot.bat` or `Start_Bot_Loop.bat` if you aren't using another program to handle the bot restarting.
  - Have a role called `Admin` to use admin commands
 
## Playing Sounds:
Sounds are executed when the command for that sound is called, the bot leaves as soon as it is done playing the sound.
You don't need to do work when adding sounds. You just need to drag and drop your sound file in to the `sounds` folder and you are all set. The command for executing the sound on discord is what ever the filename is. If I have a sound file named `example.mp3` in the sound folder, then the command for that would be `!example`. Use `!sounds` to show a list of all sounds currently in the sounds folder.

## Adding commands:
To customize your commands more, then you need to edit the properties in `akebot/botCommands.json`, make sure you follow the format.

**Command Properties**:
 - `command` or `command2`: Set a command to be triggered.
 - `type`: The type of command you are trying to make. Either `text` or `image`
 - `delay`: The amount of time to delay your command from being executed in milliseconds e.g 5000 = 5 seconds Without quotes
 - `typing`: Shows that the bot is typing depending on the length of your message Set this to either `true` or `false` without quotes. *Not setting it, is false.
 - `message`: The output message you want to deliever after your command has been executed
 - `file`: Path to your file, including extension `"pictures/example.png"`
 - `filename`: Name of your file, be sure to include the extension if you want to display an image instead of uploading the image `"example.png"`
 - `tts`:  Whether the message will be in Text To Speech. `true` or `false`



## Bot Commands: 

**Dev** *Commands only for the bot owner, E.G You. Make sure your credenitals is correct in `akebot/sudo.json`*

 - `~disconnect`: Disconnect the bot
 - `~announce [Your announcment]`: Global announcment to all servers this bot is connected to.
 - `~setGame [Your Game]`: Set the bot presence to playing a game. E.G `~setGame World of Warcraft`

**General**
 - `!about`: About this bot
 - `!help`: Displays bot commands
 - `!commands`: A list of all custom server commands
 - `!commands global`: A list of all global commands
 - `!invite`: Gets an invite link for the bot to join servers
 - `!upTime`: How long this bot has been on
 - `!date`: Display the date
 - `!time`: Display the time 
 - `!twitch [username]`: Checks if the user is live on Twitch 
 - `!hitbox [username]`: Checks if the user is live on Hitbox
 - `!ask [Question]`: Ask Clever Bot anything


**Admins** *Must be in group admin*
 - `!say [message]`: Send your message from any channel to general as the bot
 - `!purge all`: **[Optional] Add amount to delete** Deletes up to 100 messages at a time
 - `!purge me`: **[Optional] Add amount to delete** Deletes up to 100 of your messages at a time
 - `!purge bot`:  **[Optional] Add amount to delete** Deletes up to 100 of the bot's messages at a time
 - `!purge [Number]`: Deletes a specified amount of messages. 
 - `!ban [@user] [days]`: Ban the mentioned user for `X` number of days
 - `!kick [@user]`: Kick the mentioned user from server.  

**Custom Commands**
 Each server/guild has their own custom commands that only work for their server. To add global commands that can be used across all servers and guilds you can put them in the global section in the commands file by following the format. Commands found in `botCommands.json` file.

*Commands for adding, deleting, editing, etc...*
 - `!cmd [command]`: Check a command's details. E.G author, type, message
 - `!addcmd [command] [type] [message]`: Create a command that will be written in the `botCommands.json` file
 - `!delcmd [command]`: Deletes specified command if its editable *Admin required*
 - `!editcmd [command] [new command] [type] [message]`: Edit existing commands
 - `!appcmd [command] [second command]`: Add a second command to your command to be triggered when called
 - `!appcmd [command]`: Will delete the second command of a command if a new command isn't entered

*Global commands that have been added already*
 - `!source`: A link to this github page
 - `!ping`: Just a test command to recieve a message
 - `!rekt`: Because people stay getting rekt
 - `!yes`: The face when you totally agree
 - `feelsbad`: Feels Bad Man pepe
 - `feelsgoood`: Feels Good Man pepe
 - `!whoa`: Someone mad? Take it easy man
 - `!doit`: Just do it!
 - `!neil`: Neil Degrasse Tyson meme
  

**Sounds**
 - `!sounds`: Displays a list of sounds
 - `!addsound`: Upload your sound to the bot. Use command when uploading your file.
 - `!delsound [sound name]`: Delete a sound from the sounds folder without the `!` prefix. *Admin required*
# Discord-AkephalosBot (Node.js)
Discord bot written in Node.js for [Discord](http://www.discord.gg) Anyone can edit or modify this project of their own doing, all I ask is a mention of me or by leaving `!about` with author of this project with my name intact.

Library: [Discord.io](https://github.com/izy521/discord.io)

##Features:
 - Purging messages or channels.
 - Admin controlled commands.
 - Clever Bot implemented, ask it anything.
 - Making commands can be written without a hassle with less code.
 - Making quick and simple commands within the discord client.
 - Custom sounds ready to be played, just drag and drop to the folder and your done.
 - Upload your sounds to the bot within discord.
 - Twitch/Hitbox, check if a user is streaming.

If you have any questions please ask them in my test Server:

[![Discord](https://discordapp.com/api/servers/160436336095002624/widget.png?style=banner3)](https://discord.gg/0tYqr4FWusEQHErS)

If you don't want to setup a bot, you can also test this bot by [Authorizing AkephalosBot](https://discordapp.com/oauth2/authorize?&client_id=158451686627737600&scope=bot) to your server. 

## Installation:
 You need Node.js 0.12.x or greater installed. Along with making sure NPM is installed when installing Node.js Once installed you need to download the discord library `npm install discord.io` after you have installed the library you then you need to install the required modules to run this bot.
 Note: To recieve the latest updates: 
 `git clone https://github.com/Mesmaroth/discord-AkephalosBot.git`
 
 - Put your login details in `akebot/botLogin.js`
 - For cleverBot credentials you need to put them at `akebot/cleverBot.js`
 - Launch `StartBot.bat`(Windows) once login details and required modules have been installed.
 - Make sure you have a group called "admin" for using the commands admin commands.

### Required Modules:
 - cleverbot: `npm install cleverbot.io`
 - uptimer: `npm install uptimer`
 - node-opus: `npm install node-opus` (For audio sounds)
 
### Playing Sounds:
Sounds are executed when the command for that sound is called, the bot leaves the voice channel as soon as it is done playing the sound file.
You don't need to code anything for putting custom sounds. You just need to drag and drop the file in to the `sounds` folder and you are all set. The command for executing the sound on discord is what ever the filename is. If I have a sound file named `example.mp3` in the sound folder, then the command for that would be `!example`. Use `!sounds` to show a list of all sounds currently in the sounds folder.

### Adding commands: 
You can use the `!addcmd [command] [type] [message]` to add command from discord. To customize your command more then you need to edit the properties in `akebot/botCommands.json`, make sure you follow the format.

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

 **Sudo Dev Commands** *Commands only for the bot developer, E.G You. Make sure your credenitals is correct in `akebot/sudo.json`*
  - `~writeout`: Outputs the bot properties for data to a file called bot.JSON
  - `~reboot`: Reboot this bot
  - `~disconnect`: Disconnects the bot
  - `~announce`: Global announcment to all servers this bot is connected to. Can be used for emergencies
  - `~setGame`: Set the bot presence to playing a game. E.G `~setGame Overwatch`

 **General**
  - `!about`: About this bot
  - `!help`: Displays bot commands
  - `!commands`: Shows a list of all custom commands from the "botCommands.json" file
  - `!invite`: If you wish to invite this bot to your server
  - `!upTime`: bot up time
  - `!date`: Display the date
  - `!time`: Display the time  
  - `!twitch [username]`: Checks if the user is live on Twitch 
  - `!hitbox [username]`: Checks if the user is live on Hitbox
  - `!ask [Question]`: Ask the bot anything


 **Admins** *Must be in group admin*
  - `!say [message]`: Re-sends your message from any channel to the general channel
  - `!purge all`: Deletes up to fifteen messages at a time. [Optional] Add a number to specifiy an amount up to 15
  - `!purge me`: Deletes up to fifteen of your messages at a time. [Optional] Add a number to specifiy an amount up to 15
  - `!purge bot`: Deletes up to fifteen of the bot's messages at a time. [Optional] Add a number to specifiy an amount up to 15
  - `!purge [Number]`: Deletes a specified amount of messages to be deleted  
  - `!ban [@user] [days]`: Ban the mentioned user for X number of days.
  - `!kick [@user]`: Kick the mentioned user from server.  

 **Custom Commands**
  Commands found in "botCommands.json" file.

  - `!cmd [command]`: Check a command's details. E.G author, type, message
  - `!addcmd [command] [type] [message]`: Create a command that will be written in the `botCommands.json` file
  - `!delcmd [command]`: Deletes specified command if editable is true  *Admin required*
  - `!editcmd [command] [new command] [type] [message]`: Edit existing commands
  - `!appcmd [command] [second command]`: Add a second command to your command to be triggered when called.

  *Current commands that come with this bot when downloaded.*
  - `!ping`: Pong
  - `!rekt`: Rekt Meme
  - `!Yes`: Creepy Jack Yes
  - `!topkek`: TopKek
  - `!feelsgood`: FeelsGoodMan
  - `!feelsbad`: FeelsBadMan
  - `!whoa`: Take it easy man
  - `!bmj`: John Cena
  - `!doit`: Do it
  - `!nice`: Nice
  - `!neil`: Neil Degrasse Tyson 

**Sounds**
 - `!sounds`: Displays a list of sounds
 - `!addsound`: Upload your sound to the bot. Use command when uploading your file.
 - `!delsound`: Delete a sound from the sounds folder. *Admin required*
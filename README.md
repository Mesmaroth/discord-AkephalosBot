# Discord-AkephalosBot (Node.js)
A simple bot written in JavaScript for [Discord](http://www.discord.gg) This is intended for those who have very little knowledge of programming but still want to run a Discord bot for their server. Anyone can edit or modify this project of their own doing, all I ask is a mention of me or by leaving `!about` with my name intact.

Library: [Discord.io](https://github.com/izy521/discord.io)

If you have any questions please ask them in my test Server:

[![Discord](https://discordapp.com/api/servers/160436336095002624/widget.png?style=banner3)](https://discord.gg/0tYqr4FWusEQHErS)

If you don't want to setup your bot, you can use mines by [Authorizing AkephalosBot](https://discordapp.com/oauth2/authorize?&client_id=158451686627737600&scope=bot)

### Installation:
 You need Node.js 0.12.x or greater installed. Along with making sure NPM is installed with node.js when you install it. Once installed you need to download the discord library `npm install discord.io` after you have installed the library you then need to install the required modules to run this bot.
 Note: To recieve the latest updates: 
 `git clone https://github.com/Mesmaroth/discord-AkephalosBot.git`
 
 - Put your login details in `akebot/botLogin.js`
 - For cleverBot credentials you need to put them at `akebot/cleverBot.js`
 - Launch `runAkeBot.bat` once login details and required modules have been installed.

### Required Modules:
 - cleverbot: `npm install cleverbot.io`
 - node-twitchtv: `npm install node-twitchtv`
 - uptimer: `npm install uptimer`
 - node-opus: `npm install node-opus` (For audio sounds)
 
### Playing Sounds:
Sounds are executed when the command for that sound is called, the bot leaves the voice channel as soon as it is done playing the sound file.
You don't need to code anything for putting custom sounds. You just need to drag and drop the file in to the `sounds` folder and you are all set. The command for executing the sound on discord is what ever the filename is. If I have a sound file named `example.mp3` in the sound folder, then the command for that would be `!example`.

### Adding commands: 
Please follow the format in `akebot/botCommands.json` in order to create or edit your commands. If you want to cusomize the output of `!commands` edit `commandList.txt`.

 **Command Properties**:
  - `command` or `command2`: Set the command you want this command to be triggered when someone types it
  - `type`: The type of command you are trying to make. Either `text` or `image`
  - `delay`: The amount of time to delay your command from being executed in milliseconds e.g 5000 = 5 seconds Without quotes
  - `typing`: Shows that the bot is typing depending on the length of your message Set this to either `true` or `false` without quotes
  - `message`: The output message you want to deliever after your command has been executed
  - `file`: Path to your file, including extension `pictures/example.png`
  - `filename`: Name of your file, be sure to include the extension if you want to display an image instead of uploading the image.



-                          ### Commands                                                           -
### Bot Commands: 

 **Sudo Dev Commands** *Commands only for the bot developer, e.g You. Make sure your credenitals is correct in `akebot/sudo.json`*
  - `~writeout`: Outputs the bot properties for data to a file called bot.JSON
  - `~reboot`: Reboot this bot
  - `~disconnect`: Disconnects the bot
  - `~announce`: Global announcment to all servers this bot is connected to. Can be used for emergencies
  - `~setGame`: Set the bot presence. e.g `~setGame Overwatch` = `playing Overwatch` status

 **General**
  - `!about`: About this bot
  - `!joinServer`: If you wish to invite the bot to your server (Alternative: `!addServer`)
  - `!upTime`: bot up time
  - `!date`: Display the date
  - `!time`: Display the time
  - `!sounds`: Displays a list of sounds
  - `!music`: Display commands for the musicbot
  - `!twitch [username]`: Checks if this twitch user is streaming
  - `!ask [Question]`: Ask the bot anything
  - `!servers`: Shows how many servers the bot is connected to

 **Admins** *Must be in group admin*
  - `!say [message]`: Relays your message from any channel or DM to the general channel
  - `!purge all`: Deletes up to fifteen messages at a time. [Optional] Add a number to specifiy an amount up to 15
  - `!purge me`: Deletes up to fifteen of your messages at a time. [Optional] Add a number to specifiy an amount up to 15
  - `!purge bot`: Deletes up to fifteen of the bot's messages at a time. [Optional] Add a number to specifiy an amount up to 15
  - `!purge [Number]`: Deletes a specified amount of messages to be deleted

 **Memes**
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


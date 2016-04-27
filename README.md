# Discord-AkephalosBot (Node.js)
A simple bot written in JavaScript for [Discord](http://www.discord.gg)

Library: [Discord.io](https://github.com/izy521/discord.io)
You need Node.js 0.12.x or greater to be installed along as making sure NPM is also installed to download required modules

If you have any questions please ask them in my test Server: https://discord.gg/0tYqr4FWusEQHErS
If you don't want to setup your bot, you can use mines by [Authorizing AkephalosBot](https://discordapp.com/oauth2/authorize?&client_id=158451686627737600&scope=bot)


### Required Modules:
 - cleverbot: `npm install cleverbot.io`
 - node-twitchtv: `npm install node-twitchtv`
 - uptimer: `npm install uptimer`
 - node-opus: `npm install node-opus` (For audio sounds)


### Installation:
 Make sure you have the required modules including Discord.io: `npm install discord.io` 
 To recieve the latest updates: 
 `git clone https://github.com/Mesmaroth/discord-AkephalosBot.git`
 
 - Put your login details in `akebot/botLogin.js`
 - For cleverBot credentials you need to put them at `akebot/cleverBot.js`
 - You can edited or remove commands once you've made your own or removed some features you don't need. File is located at `akebot/botCommands.txt`
 - Launch `runAkeBot.bat` once login details and required modules have been installed.
 
### Sounds:
Sounds are executed when the command for that sound is called, the bot leaves the voice channel as soon as it is done playing the sound file.
You don't need to code anything for putting custom sounds. You just need to drag and drop the file in to the `sounds` folder and you are all set. The command for executing the sound on discord is what ever the filename is. If I have a sound file named `example.mp3` in the sound folder, then the command for that would be `!example`.

### Bot Commands: 
 **General**
  - `!about`: About Akephalos
  - `!joinServer`: If you wish to invite the bot to your server (Alternative: `!addServer`)
  - `!upTime`: bot up time
  - `!date`: Display the date
  - `!time`: Display the time
  - `!sounds`: Displays a list of sounds
  - `!music`: Display commands for the musicbot
  - `!twitch [username]`: Checks if this twitch user is streaming
  - `!ask [Question]`: Ask the bot anything
  - `!servers`: Shows how many servers the bot is connected to.

 **Admins** *Must be admin*
  - `!delete [number]`: Specify amount of messages to be deleted
  - `!say [message]`: Relays your message from any channel or DM to the general channel
  - `!purge [username]`: Deletes up to 100 of the users messages
  - `!purge me`: Deletes up to 100 of your own messages
  - `!purge all`: Deletes up to 100 messages of everyone's messages
  - `!purge bot`: Deletes up to 100 messages of the bots messages


 **Memes**
  - `!rekt`: Rekt Meme
  - `!Yes`: Creepy Jack Yes
  - (inside Joke)`!bobe`: FeelsGoodMon
  - `!topkek`: TopKek
  - `!feelsgood`: FeelsGoodMan
  - `!feelsbad`: FeelsBadMan
  - `!whoa`: Take it easy man
  - `!bmj`: John Cena
  - `!doit`: Do it
  - `!nice`: Nice
  - (inside Joke)`!israel`: israel...


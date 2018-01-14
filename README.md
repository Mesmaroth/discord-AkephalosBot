# Discord-AkephalosBot (Node.js)
Easy discord bot written in Node.js for [Discord](http://www.discord.gg) Anyone can edit or modify this project of their own doing, all I ask is to give credit where credit is due.

Library: [Discord.js](https://discord.js.org)
Check out Akephalos before installing your own: [Invite Link](https://discordapp.com/oauth2/authorize?client_id=158451686627737600&permissions=0&scope=bot)

## Features:
 - Twitch notifier
 - Admin message purging
 - Custom commands
 WIP: Sound meme player

## Bot Commands
 ### Admin Commands
  - `exit`: Disconnects the bot
  - `setgame [Game Name]`: Set the game presence of the bot
  - `setchannel [Channel Name]`: Sets the preferred channel to annouce live streams
  - `notify`: Enable/Disable notifications for when someone goes live
  - `purge [Amount]`: Deletes the specified amount of starting from the most recent message
  - `purge [Username] [Amount]`: Deletes the specified amount of messages from the specified user. Amount is optional

 ### General Commands
  - `help`: Display's help prompt
  - `about`: About this bot
  - `source`: Source of bot
  - `invite`: Invite bot to your server
  - `uptime`: Uptime of bot
  - `twitch [Username]`: Checks if the user is streaming on Twitch
  - `hitbox [Username]`: Checks if the user is streaming on Hitbox

 ### Custom Commands
  - `commands`: Displays current custom commands for your specfic server
  - `commands global`: Displays global commands that are accessible to all servers
  - `delcmd [Command Mame]`: Deletes a command from custom commands
  - `addcmd [Command Name] [Type] [Message]`: Makes a custom command with type `image` or `text`

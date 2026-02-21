# OwO, what's this? <img src="https://images-ext-1.discordapp.net/external/irsluKEFPA289XynCj5gRDD749kt2Bev-__BzYGJgqg/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/408785106942164992/1a449430e3a9a830efebb8c57917f943.png" alt="Description" width="35px" height="35px">

Basement is a guide for the battle-related mechanics of [OwO-Bot](https://owobot.com/).
OwO-bot is a primarily discord-based gacha game with pokemon-esque elements, and its main draws are its unexpectedly deep mechanics and cute pets.

This guide will try to give an explanation of the battle system in the game, and maybe even a little more. I won't be able do go in-depth, and I also don't claim to know best about the game. But I'll definitely try my best to give you a decent understanding of battles, teams and pets! I'd also like to say that this isn't "my" guide, rather, the idea is for the guide to be the community's. To this end, we contribute any information or explanations contained to the public domain under the CC0 1.0 Universal ([CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/)) Public Domain Dedication. The idea is that the further this Bible spreads, evolves, gets spliced, or gets translated, the better it is for the community.

Following other attempts to write guides, this one also won't be able to be kept up to date completely and will always be work-in-progress. Also please understand that this guide is painted by our bias significantly. While we try to be objective, some of the topics in this game are inherently subjective. To this end, we also accept all feedback or extra info you'd like added to the site!

 
    -/=--                                --=\-    
           ,-.       _,---._ __  / \
          /  )    ./´       `./ /   \
         (  (   ,'            `/    /|
          \  `-"             \'\   / |
           `.              ,  \ \ /  |
            /'.          ,'-`----Y   |
           (            ;        |   '
           |  ,-.    ,-'         |  /
           |  | (   |        hjw | /
           )  |  \  `.___________|/
           '--'   `--'  
    -\=--                                --=/-
 

## Basement
<div style="display:flex; gap:1.5rem; margin-top:-0.4rem;">
  <table>
    <tr style="line-height:1.1rem">
      <td><a href="https://owo.bwep.net/">Official Website</a></td>
    </tr>
    <tr style="line-height:1.1rem">
      <td><a href="https://github.com/Hasseroeder/Basement/">Github</a></td>
    </tr>
    <tr style="line-height:1.1rem">
      <td><a href="https://discord.gg/wA82GZ2rnR">Support Server</a></td>
    </tr>
  </table>


  <table style="height:3.3rem;">
    <tr style="line-height:1.1rem;">
      <td style="font-size:1.1rem; font-weight:bold;">Our Team</td>
      <td style="font-size:0.6rem;">Discord</td>
      <td style="font-size:0.6rem;">Github</td>
    </tr>
    <tr style="line-height:1.1rem; height:1.2rem;">
      <td>Heather</td>
      <td>
        <div style="font-size: 0.75rem;">
          <code>@hsse</code>
        </div>
      </td>
      <td><a href="https://github.com/Hasseroeder">Hasseroeder</a></td>
    </tr>
    <tr style="line-height:1.1rem; height:1.2rem;">
      <td>Coop</td>
      <td>
          <div style="font-size: 0.75rem;">
            <code>@coopw</code>
          </div>
        </td>
      <td><a href="https://github.com/coopw1">coopw1</a></td>
    </tr>
  </table>
</div>

## Friends & Useful Stuff
<div style="display:flex; gap: 2.5rem; margin-top:-0.7rem;">
  <div>
    <h4 style="margin: 0.2rem 0.4rem; font-size: 0.7rem; color:#888;">#Relevant Bots</h4>
    <table>
      <tr style="line-height:1.1rem">
        <td>OwO</td>
        <td><a href="https://discordapp.com/oauth2/authorize?client_id=408785106942164992">Invite Bot</a></td>
        <td><a href="https://owobot.com/">Website</a></td>
        <td><a href="https://discord.gg/wA82GZ2rnR">Support Server</a></td>
      </tr>
      <tr style="line-height:1.1rem">
        <td>NeonUtil</td>
        <td><a href="https://discord.com/oauth2/authorize?client_id=851436490415931422">Invite Bot</a></td>
        <td><a href="https://neonutil.com/">Website</a></td>
        <td><a href="https://discord.gg/NeonUtil">Support Server</a></td>
      </tr>
      <tr style="line-height:1.1rem">
        <td>ReactionBot</td>
        <td><a href="https://discord.com/oauth2/authorize?client_id=519287796549156864&permissions=478272&scope=bot+applications.commands">Invite Bot</a></td>
        <td>—</td>
        <td><a href="https://discord.gg/KwfCk7r">Support Server</a></td>
      </tr>
    </table>
  </div>
  <div>
    <h4 style="margin: 0.2rem 0.4rem; font-size: 0.7rem; color:#888;">#Other Guides</h4>
    <table style="height:2.2rem;">
      <tr style="line-height:1.1rem">
        <td><a href="https://owobot.fandom.com/wiki/OwO_Bot_Wiki">OwO Bot Wiki</a></td>
      </tr>
      <tr style="line-height:1.1rem">
        <td><a href="https://discord.gg/gg-obbe-owo-bot-battle-enthusiasts-748179924749123662">Kane's OBBE Guide</a></td>
      </tr>
    </table>
  </div>
</div>

## Technical
We try to use vanilla JavaScript to keep the entry barrier as low as possible. You don't need any NPM or Node to help with this project, and you could probably even develop in notepad. We do have some dependencies, but we pull those with CDN script tags, so that's easy peasy.
- Chart.js v4.5.0
- chartjs-plugin-annotation v3.1.0
- MathJax v3

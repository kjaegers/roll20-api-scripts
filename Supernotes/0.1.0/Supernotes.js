on('ready', function() {
    if (!_.has(state, 'Supernotes')) {
        state.Supernotes = {
            sheet: 'Default',
            template: 'default',
            title: 'name',
            theText: '',
            sendToPlayers: true

        };
        message = 'Welcome to Supernotes! If this is your first time running it, the script is set to use the Default Roll Template. You can choose a different sheet template below, as well as decide whether you want the script to display a "Send to Players" footer at the end of every GM message. It is currently set to true.<BR><BR>[Default Template - any sheet](!gmnote --config|default)<BR>[D&D 5th Edition by Roll20](!gmnote --config|dnd5e)<BR>[DnD 5e Shaped](!gmnote --config|5eshaped)<BR>[Pathfinder by Roll20](!gmnote --config|pfofficial)<BR>[Pathfinder Community](!gmnote --config|pfcommunity)<BR>[Pathfinder 2e by Roll20](!gmnote --config|pf2e)<BR>[Starfinder by Roll20](!gmnote --config|starfinder)<BR><BR>[Toggle Send to Players](!gmnote --config|sendtoPlayers)';
        sendChat('Supernotes', '/w gm &{template:' + state.Supernotes.template + '}{{' + state.Supernotes.title + '=' + 'Config' + '}} {{' + state.Supernotes.theText + '=' + message + '}}');
    }
});

on('ready', () => {

    const decodeUnicode = (str) => str.replace(/%u[0-9a-fA-F]{2,4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));


    const version = '0.1.0';
    log('Supernotes v' + version + ' is ready!  To set the template of choice or to toggle the send to players option, Use the command !gmnote --config');

    on('chat:message', function(msg) {
        if ('api' === msg.type && msg.content.match(/^!(gm|pc|self)note\b/)) {
            let match = msg.content.match(/^!gmnote-(.*)$/);


//let theToken = msg.selected
//theTOken = findObjs({type:'graphic', ids:'-MOnBpNz74VBKsJgBb3D'});
//log('selected is ' + JSON.stringify(theToken));



            //define command                     
            let command = msg.content.split(/\s+--/)[0];
let sender = msg.who
log(sender);
            let messagePrefix = '/w gm ';
            if (command === '!pcnote') {
                messagePrefix = '';
            }
            
           if (command === '!selfnote') {
                messagePrefix = '/w '+sender + ' ';
            }

            //define option
/*            let option = msg.content.split(/\s+--/)[1];
            let secondOption = msg.content.split(/\s+--/)[2];
            if (option === 'notitle'){
                option = secondOption;
                secondOption = 'notitle';}
*/

let secondOption = '';
let args = msg.content.split(/\s+--/);
let option = '';
let notitle=false;
let id = '';
let tokenImage = '';
let tokenName = '';
let trueToken = [];

let theToken = msg.selected

               args.forEach(a =>{
                    if(a === 'notitle') {notitle = true}
                    if (a.includes('id-')) {id = a.split(/id/)[1]}
                    if(a !== command && !(a.includes('id-')) && a !== 'notitle'){option = a}
                });
                 log ('option = ' + option);

                ((id) ? theToken = [{"_id": id,"type": "graphic"}] : theToken = msg.selected);
//theToken = [{"_id": ids,"type": "graphic"}]
//theToken = theToken.map({_id:ids,type:"graphic"})

log('selected is ' + JSON.stringify(theToken));

if (undefined !== theToken){
                 trueToken =getObj('graphic',theToken[0]._id);
                 tokenImage = trueToken.get('imgsrc');
                 tokenName =  trueToken.get('name');
}
                
                                //log ('TEST DATA = ' + theToken.get.id);

                log ('notitle = ' + notitle);
                log ('id = ' + id);
                log ('command = ' + command);
                log ('option = ' + option);


            const template = state.Supernotes.template;
            const title = state.Supernotes.title;
            const theText = state.Supernotes.theText;
            const sendToPlayers = state.Supernotes.sendToPlayers;




 if (option !== undefined && option.includes('config')) {
                let templateChoice = option.split('|')[1]

                if (templateChoice === undefined) {
                    message = 'Current sheet template:<BR><b>' + state.Supernotes.sheet + '</b><BR>Send to Players:<BR><b>' + state.Supernotes.sendToPlayers + '</b><BR><BR>Choose a template for Supernotes to use.<BR><BR>[Default Template - any sheet](!gmnote --config|default)<BR>[D&D 5th Edition by Roll20](!gmnote --config|dnd5e)<BR>[DnD 5e Shaped](!gmnote --config|5eshaped)<BR>[Pathfinder Community](!gmnote --config|pfcommunity)<BR>[Pathfinder by Roll20](!gmnote --config|pfofficial)<BR>[Pathfinder 2e by Roll20](!gmnote --config|pf2e)<BR>[Starfinder by Roll20](!gmnote --config|starfinder)<BR><BR>[Toggle Send to Players](!gmnote --config|sendtoPlayers)'
                    sendChat('Supernotes', messagePrefix + '&{template:' + template + '}{{' + title + '=' + 'Config' + '}} {{' + theText + '=' + message + '}}');
                }


                switch (templateChoice) {
                    case 'default':
                        state.Supernotes.sheet = 'Default';
                        state.Supernotes.template = 'default';
                        state.Supernotes.title = 'name';
                        state.Supernotes.theText = '';
                        sendChat('Supernotes', '/w gm Supernotes set to Default roll template');
                        break;
                    case 'dnd5e':
                        state.Supernotes.sheet = 'D&D 5th Edition by Roll20';
                        state.Supernotes.template = 'npcaction';
                        state.Supernotes.title = 'rname';
                        state.Supernotes.theText = 'description';
                        sendChat('Supernotes', '/w gm Supernotes set to ' + state.Supernotes.sheet);
                        break;
                    case '5eshaped':
                        state.Supernotes.sheet = 'DnD 5e Shaped';
                        state.Supernotes.template = '5e-shaped';
                        state.Supernotes.title = 'title';
                        state.Supernotes.theText = 'text_big';
                        sendChat('Supernotes', '/w gm Supernotes set to ' + state.Supernotes.sheet);
                        break;
                    case 'pfcommunity':
                        state.Supernotes.sheet = 'Pathfinder Community';
                        state.Supernotes.template = 'pf_generic';
                        state.Supernotes.title = 'name';
                        state.Supernotes.theText = 'description';
                        sendChat('Supernotes', '/w gm Supernotes set to ' + state.Supernotes.sheet);
                        break;
                    case 'pfofficial':
                        state.Supernotes.sheet = 'Pathfinder by Roll20';
                        state.Supernotes.template = 'npc';
                        state.Supernotes.title = 'name';
                        state.Supernotes.theText = 'descflag=1}} {{desc';
                        sendChat('Supernotes', '/w gm Supernotes set to ' + state.Supernotes.sheet);
                        break;
                    case 'pf2e':
                        state.Supernotes.sheet = 'Pathefinder 2e';
                        state.Supernotes.template = 'rolls';
                        state.Supernotes.title = 'header';
                        state.Supernotes.theText = 'notes_show=[[1]]}} {{notes';
                        sendChat('Supernotes', '/w gm Supernotes set to ' + state.Supernotes.sheet);
                        break;
                    case 'starfinder':
                        state.Supernotes.sheet = 'Starfinder';
                        state.Supernotes.template = 'sf_generic';
                        state.Supernotes.title = 'title';
                        state.Supernotes.theText = 'buttons0';
                        sendChat('Supernotes', '/w gm Supernotes set to ' + state.Supernotes.sheet);
                        break;
                    case 'sendtoPlayers':
                        if (state.Supernotes.sendToPlayers) {
                            state.Supernotes.sendToPlayers = false
                        } else {
                            state.Supernotes.sendToPlayers = true
                        };
                        sendChat('Supernotes', '/w gm Send to Players set to ' + state.Supernotes.sendToPlayers);
                        break;
                }
            } else {
                if (option !== undefined && option.includes('help')) {
                    message = 'Supernotes pulls the contents from a token&#39;s GM Notes field. If the token represents a character, you can optionally pull in the Bio or GM notes from the character, as well as the avatar, or extract just the image from the bio field. The user can decide whether to whisper the notes to the GM or broadcast them to all players. Finally, there is the option to add a footer to notes whispered to the GM. This footer creates a chat button to give the option of sending the notes on to the players.<BR>This script as written is optimized for the D&amp;D 5th Edition by Roll20 sheet, but can be adapted easily suing the Configuration section below.<BR><BR><b>Commands:</b><BR><b>!gmnote</b> whispers the note to the GM<BR><b>!pcnote</b> sends the note to all players<BR><BR><b>Paramaters</b><BR><div style ="text-indent: -1em;margin-left: 1em;"><em>--token</em> Pulls notes from the selected token&#39;s gm notes field. This is optional. If it is missing, the script assumes --token<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--charnote</em> Pulls notes from the gm notes field of the character assigned to a token.<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--bio</em> Pulls notes from the bio field of the character assigned to a token.<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--avatar</em> Pulls the image from the avatar field of the character assigned to a token.<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--image</em> Pulls first image from the bio field of the character assigned to a token, if any exists. Otherwise returns notice that no artwork is available<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--images</em> Pulls all images from the bio field of the character assigned to a token, if any exist. Otherwise returns notice that no artwork is available<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--image[number]</em> Pulls indexed image from the bio field of the character assigned to a token, if any exist. <em>--image1</em> will pull the first image, <em>--image2</em> the second and so on. Otherwise returns first image if available. If no images are available, returns notice that no artwork is available.<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--help</em> Displays help.<BR></div><div style ="text-indent: -1em;margin-left: 1em;"><em>--config</em> Returns a configuration dialog box that allows you to set which sheet&#39;s roll template to use, and to toggle the &quot;Send to Players&quot; footer.</div><BR><BR><b>Configuration</b><BR>When first installed, Supernotes is configured for the default roll template. It will display a config dialog box at startup that will allow you to choose a roll template based on your character sheet of choice, as well as the option  to toggle whether you want the &quot;Send to Players&quot; footer button to appear.<BR>You will need to edit the code of the script to create a custom configuration. The pre-installed sheets are:<BR><div style ="margin-left:10px;">Default Template<BR>D&amp;D 5th Edition by Roll20<BR>5e Shaped<BR>Pathfinder by Roll20<BR>Pathfinder Community<BR>Pathfinder 2e by Roll20<BR>Starfinder</div>';
                    sendChat('Supernotes', messagePrefix + '&{template:' + template + '}{{' + title + '=' + 'Supernotes Help' + '}} {{' + theText + '=' + message + '}}');

                } else {
                    if (!(option + '').match(/^(bio|charnote|tokenimage|avatar|imag(e|es|e[1-9]))/)) {
                        option = 'token';
                    }


                    let playerButton = '';
                    if (sendToPlayers && (command === '!gmnote'||command ===  '!selfnote')) {
                        playerButton = '\n[Send to Players](' + msg.content.replace(/!(gm|self)/,"!pc") + ')';
                    }

                    let regex;
                    if (match && match[1]) {
                        regex = new RegExp(`^${match[1]}`, 'i');
                    }

                    let message = '';
                    let whom = '';

                    if (option === 'tokenimage') {
                        (theToken || [])
                        .map(o => getObj('graphic', o._id))
                            .filter(g => undefined !== g)
                            .map(t => getObj('character', t.get('represents')))
                            .filter(c => undefined !== c)
                            .forEach(c => {
                                message = "<img src='" + tokenImage + "'>";
                                whom = c.get('name');
                                            if (notitle){whom = '';}
                                sendChat(whom, messagePrefix + '&{template:' + template + '}{{' + title + '=' + tokenName + '}} {{' + theText + '=' + message + playerButton + '}}');
                            });
                    } else {                    if (option === 'avatar') {
                        (theToken || [])
                        .map(o => getObj('graphic', o._id))
                            .filter(g => undefined !== g)
                            .map(t => getObj('character', t.get('represents')))
                            .filter(c => undefined !== c)
                            .forEach(c => {
                                message = "<img src='" + c.get('avatar') + "'>";
                                whom = c.get('name');
                                            if (notitle){whom = '';}
                                sendChat(whom, messagePrefix + '&{template:' + template + '}{{' + title + '=' + whom + '}} {{' + theText + '=' + message + playerButton + '}}');
                            });
                    } else {

                        if (option.match(/^imag(e|es|e[1-9])/)) {


                            (theToken || [])
                            .map(o => getObj('graphic', o._id))
                                .filter(g => undefined !== g)
                                .map(t => getObj('character', t.get('represents')))
                                .filter(c => undefined !== c)
                                .forEach(c => c.get('bio', (val) => {
                                    if (null !== val && 'null' !== val && val.length > 0) {
                                        if (regex) {
                                            message = _.filter(
                                                decodeUnicode(val).split(/(?:[\n\r]+|<br\/?>)/),
                                                (l) => regex.test(l.replace(/<[^>]*>/g, ''))
                                            ).join('\r');
                                        } else {
                                            message = decodeUnicode(val);
                                        }
                                        if (option === "images") {
                                            artwork = message.match(/\<img src.*?\>/g)
                                        } else {
                                            artwork = message.match(/\<img src.*?\>/g);
                                            artwork = String(artwork);


                                            imageIndex = option.match(/\d+/g);


                                            if (isNaN(imageIndex) || !imageIndex) {
                                                imageIndex = 1
                                            }

                                            if (imageIndex > (artwork.split(",")).length) {
                                                imageIndex = 1
                                            }

                                            imageIndex = imageIndex - 1; //corrects from human readable

                                            artwork = artwork.split(",")[imageIndex];

                                        }
                                        log("artwork string =" + artwork);
                                        if ((''+artwork).length > 3) {
                                            message = artwork;
                                        } else {
                                            message = 'No artwork exists for this character.';
                                        }

                                        whom = c.get('name');

                                        //Sends the final message
                                            if (notitle){whom = '';}
                                        sendChat(whom, messagePrefix + '&{template:' + template + '}{{' + title + '=' + whom + '}} {{' + theText + '=' + message + playerButton + '}}');

                                    }
                                }));
                        } else {



                            if ((option === 'bio') || (option === 'charnote')) {
                                let suboption = (option === 'charnote') ? 'gmnotes' : 'bio';

                                (theToken || [])
                                .map(o => getObj('graphic', o._id))
                                    .filter(g => undefined !== g)
                                    .map(t => getObj('character', t.get('represents')))
                                    .filter(c => undefined !== c)
                                    .forEach(c => c.get(suboption, (val) => {
                                        if (null !== val && 'null' !== val && val.length > 0) {
                                            if (regex) {
                                                message = _.filter(
                                                    decodeUnicode(val).split(/(?:[\n\r]+|<br\/?>)/),
                                                    (l) => regex.test(l.replace(/<[^>]*>/g, ''))
                                                ).join('\r');
                                            } else {
                                                message = decodeUnicode(val);
                                            }
                                            whom = c.get('name');
                                                                                //Crops out GM info on player messages
                                                if (command === '!pcnote') {
                                                    message = (message.includes("-----") ? message.split('-----')[0] : message);
                                                }
                                            //Sends the final message
                                            if (notitle){whom = '';}
                                              // sendChat(whom, messagePrefix + '/direct ?{'  + message + playerButton + '|}');//This is a test
                                            sendChat(whom, messagePrefix + '&{template:' + template + '}{{' + title + '=' + whom + '}} {{' + theText + '=' + message + playerButton + '}}');

                                        }
                                    }));
                            } else {
                                (theToken || [])
                                .map(o => getObj('graphic', o._id))
                                    .filter(g => undefined !== g)
                                    .filter((o) => o.get('gmnotes').length > 0)
                                    .forEach(o => {
                                        if (regex) {
                                            message = _.filter(unescape(decodeUnicode(o.get('gmnotes'))).split(/(?:[\n\r]+|<br\/?>)/), (l) => regex.test(l)).join('\r');
                                        } else {
                                            message = unescape(decodeUnicode(o.get('gmnotes')));
                                        }
                                        whom = o.get('name');

                                    });
                                    
                                    //Crops out GM info on player messages
                                                if (command === '!pcnote') {
                                                    message = (message.includes("-----") ? message.split('-----')[0] : message);
                                                }
                                    
                                //Sends the final message
                                            if (notitle){whom = '';}
                                  //sendChat(whom, messagePrefix + '/direct ?{'  + message + playerButton + '|}');//This is a test
                                sendChat(whom, messagePrefix + '&{template:' + template + '}{{' + title + '=' + whom + '}} {{' + theText + '=' + message + playerButton + '}}');

                            }


                            [
                                `### REPORT###`,
                                `THE MESSAGE =${message}`,
                                `command = ${command}`,
 //                               `option = ${option}`,
                                `secondOption = ${secondOption}`,
                                `messagePrefix = ${messagePrefix}`,
                                `whom = ${whom}`,
                                `message =${message}`
                            ].forEach(m => log(m));
                        }}
                    }
                }
            }
        }
    });
});

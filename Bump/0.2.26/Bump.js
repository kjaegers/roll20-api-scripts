// Github:   https://github.com/shdwjk/Roll20API/blob/master/Bump/Bump.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron
// Forum:    https://app.roll20.net/forum/permalink/10226949/
var API_Meta = API_Meta||{}; //eslint-disable-line no-var
API_Meta.Bump={offset:Number.MAX_SAFE_INTEGER,lineCount:-1};
{try{throw new Error('');}catch(e){API_Meta.Bump.offset=(parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/,'$1'),10)-7);}}

/* global GroupInitiative TokenMod */
const Bump = (() => { // eslint-disable-line no-unused-vars

  const scriptName = "Bump";
  const version = '0.2.26';
  API_Meta.Bump.version = version;
  const lastUpdate = 1643588841;
  const schemaVersion = 0.6;
  const clearURL = 'https://s3.amazonaws.com/files.d20.io/images/4277467/iQYjFOsYC5JsuOPUCI9RGA/thumb.png?1401938659';
  const checkerURL = 'https://s3.amazonaws.com/files.d20.io/images/16204335/MGS1pylFSsnd5Xb9jAzMqg/med.png?1455260461';

    const regex = {
			colors: /(transparent|(?:#?[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?))/
        };

        const mirroredPropsNoBar = [
          'name', 'left', 'top', 'width', 'height', 'rotation', 'flipv', 'fliph',

          // Bar settings (except max & link fields)
          'bar1_value', 'bar2_value', 'bar3_value',

          'tint_color', 'lastmove', 'controlledby', 'represents'
        ];

        const mirroredPropsWithLight = [
          //LDL settings
          'light_hassight', 'light_radius', 'light_dimradius', 'light_angle',
          'light_losangle','light_multiplier', 'adv_fow_view_distance',

          //UDL settings
          // Vision
          "has_bright_light_vision", "has_limit_field_of_vision",
          "limit_field_of_vision_center", "limit_field_of_vision_total",
          "light_sensitivity_multiplier",

          // Bright Light
          "emits_bright_light", "bright_light_distance",
          "has_directional_bright_light", "directional_bright_light_total",
          "directional_bright_light_center",

          // Dim Light
          "emits_low_light", "low_light_distance", "has_directional_low_light",
          "directional_low_light_total", "directional_low_light_center",
          "dim_light_opacity",

          // Night Vision
          "has_night_vision", "night_vision_tint", "night_vision_distance",
          "night_vision_effect", "has_limit_field_of_night_vision",
          "limit_field_of_night_vision_center",
          "limit_field_of_night_vision_total"
        ];

        const mirroredPropsWithBar = [
          // Bar settings (max & link fields)
          'bar1_max', 'bar2_max', 'bar3_max',
          'bar1_link','bar2_link','bar3_link',
          "bar_location", "compact_bar"
        ];

        const mirroredProps = [
          ...mirroredPropsNoBar,
          ...mirroredPropsWithBar
        ];



        const defaults = {
            css: {
                button: {
                    'border': '1px solid #cccccc',
                    'border-radius': '1em',
                    'background-color': '#006dcc',
                    'margin': '0 .1em',
                    'font-weight': 'bold',
                    'padding': '.1em 1em',
                    'color': 'white'
                }
            }
        };

    const filterObj = (o) => Object.keys(o).reduce( (m,k) => (undefined === o[k] ? m : Object.assign({},m,{[k]:o[k]})), {});
    const mergeObj = (...a) => Object.keys(a).reduce((m,k)=>Object.assign(m,filterObj(a[k])),{});
    const css = (rules) => `style="${Object.keys(rules).map(k=>`${k}:${rules[k]};`).join('')}"`;

    const makeButton = (command, label, backgroundColor, color) => `<a ${css(mergeObj(defaults.css.button,{color,'background-color':backgroundColor}))} href="${command}">${label}</a>`;

    const isPlayerToken = (obj) => {
        let players = obj.get('controlledby')
            .split(/,/)
            .filter(s=>s.length);

        if( players.includes('all') || players.filter((p)=>!playerIsGM(p)).length ) {
           return true;
        } 

        if('' !== obj.get('represents') ) {
            players = (getObj('character',obj.get('represents')) || {get: ()=>''} )
                .get('controlledby').split(/,/)
                .filter(s=>s.length);
            return  players.includes('all') || players.filter((p)=>!playerIsGM(p)).length ;
        }
        return false;
    };
    
    const keyForValue = (obj,v) => Object.keys(obj).find( key => obj[key] === v);

    const cleanupObjectReferences = () => {
      const allIds = findObjs({type:'graphic'}).map( o => o.id);
      const ids = [
        ...Object.keys(state[scriptName].mirrored),
        ...Object.values(state[scriptName].mirrored)
      ]
      .filter( id => !allIds.includes(id) );

      ids.forEach( id => {
        if(state[scriptName].mirrored.hasOwnProperty(id)){
          if(!ids.includes(state[scriptName].mirrored[id])){
            let obj = getObj('graphic',state[scriptName].mirrored[id]);
            if(obj){
              obj.remove();
            }
          }
        } else {
          let iid = keyForValue(state[scriptName].mirrored,id);
          delete state[scriptName].mirrored[iid];
          if(!ids.includes(iid)){
            createMirrored(iid, false, 'gm');
          }
        }
      });
    };

    const fixupSlaveBars = () => {
      let ids = Object.values(state[scriptName].mirrored);
      const burndown = () =>{
        if(ids.length){
          let id = ids.shift();
          let slave = getObj('graphic',id);
          if(slave){
            if(state[scriptName].config.noBars) {
              slave.set({
                bar1_max: '',
                bar2_max: '',
                bar3_max: '',
                bar1_link: '',
                bar2_link: '',
                bar3_link: ''
              });
            } else {
                let master = getMirrored(id);
                slave.set(mirroredPropsWithBar.reduce((m,p)=>({...m,[p]:master.get(p)}),{}));
            }
          }
          setTimeout(burndown,0);
        }
      };
      burndown();
    };

    const fixupSlaveLight = () => {
      let ids = Object.values(state[scriptName].mirrored);
      const burndown = () =>{
        if(ids.length){
          let id = ids.shift();
          let slave = getObj('graphic',id);
          if(slave){
            if(state[scriptName].config.noLight) {
              slave.set({
                  light_hassight: false,
                  light_radius: 0,
                  light_dimradius: 0,
                  light_angle: 360,

                  light_losangle: 360,
                  light_multiplier: 1,
                  adv_fow_view_distance: 0,

                  has_bright_light_vision: false,
                  has_limit_field_of_vision: false,

                  limit_field_of_vision_center: 0,
                  limit_field_of_vision_total: 360,

                  light_sensitivity_multiplier: 1,

                  emits_bright_light: false,
                  bright_light_distance: 0,
                  has_directional_bright_light: false,
                  directional_bright_light_total: 360,
                  directional_bright_light_center: 0,

                  emits_low_light: false,
                  low_light_distance: 0,
                  has_directional_low_light: false,
                  directional_low_light_total: 360,
                  directional_low_light_center: 0,

                  dim_light_opacity: 1,

                  has_night_vision: false,
                  night_vision_tint: '#ffffff',
                  night_vision_distance: 0,

                  night_vision_effect: 'none',
                  has_limit_field_of_night_vision: false,
                  limit_field_of_night_vision_center: 0,
                  limit_field_of_night_vision_total: 360
              });
            } else {
                let master = getMirrored(id);
                slave.set(mirroredPropsWithLight.reduce((m,p)=>({...m,[p]:master.get(p)}),{}));
            }
          }
          setTimeout(burndown,0);
        }
      };
      burndown();
    };


    const checkInstall = () => {
        log(`-=> ${scriptName} v${version} <=-  [${new Date(lastUpdate*1000)}]`);

        if( ! state.hasOwnProperty(scriptName) || state[scriptName].version !== schemaVersion) {
            log('  > Updating Schema to v'+schemaVersion+' <');
            switch(state[scriptName] && state[scriptName].version) {
                case 0.1:
                    state[scriptName].config.autoSlave = false;
                    /* falls through */

                case 0.2:
                case 0.3:
                  delete state[scriptName].globalConfigCache;
                  state[scriptName].globalconfigCache = {lastsaved:0};
                  /* falls through */

                case 0.4:
                  state[scriptName].lastHelpVersion=version;
                  state[scriptName].config.noBars = false;
                  state[scriptName].config.autoUnslave = false;
                  /* falls through */

                case 0.5:
                  state[scriptName].config.noLight = false;

                case 'UpdateSchemaVersion':
                    state[scriptName].version = schemaVersion;
                    break;

                default:
                    state[scriptName] = {
                        version: schemaVersion,
                        lastHelpVersion: version,
                        globalconfigCache: {lastsaved:0},
                        config: {
                            layerColors: {
                                'gmlayer' : '#008000',
                                'objects' : '#800080'
                            },
                            autoPush: false,
                            autoSlave: false,
                            noBars: false,
                            autoUnslave: false,
                            noLight: false
                        },
                        mirrored: {}
                    };
                    break;
            }
        }
        cleanupObjectReferences();
        assureHelpHandout();
    };

    const ch = (c) => {
        const entities = {
            '<' : 'lt',
            '>' : 'gt',
            "'" : '#39',
            '@' : '#64',
            '{' : '#123',
            '|' : '#124',
            '}' : '#125',
            '[' : '#91',
            ']' : '#93',
            '"' : 'quot',
            '*' : 'ast',
            '/' : 'sol',
            ' ' : 'nbsp'
        };

        if( entities.hasOwnProperty(c) ){
            return `&${entities[c]};`;
        }
        return '';
    };

    const _h = {
        outer: (...o) => `<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">${o.join(' ')}</div>`,
        title: (t,v) => `<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">${t} v${v}</div>`,
        subhead: (...o) => `<b>${o.join(' ')}</b>`,
        minorhead: (...o) => `<u>${o.join(' ')}</u>`,
        optional: (...o) => `${ch('[')}${o.join(` ${ch('|')} `)}${ch(']')}`,
        required: (...o) => `${ch('<')}${o.join(` ${ch('|')} `)}${ch('>')}`,
        header: (...o) => `<div style="padding-left:10px;margin-bottom:3px;">${o.join(' ')}</div>`,
        section: (s,...o) => `${_h.subhead(s)}${_h.inset(...o)}`,
        paragraph: (...o) => `<p>${o.join(' ')}</p>`,
        group: (...o) => `${o.join(' ')}`,
        items: (o) => `<li>${o.join('</li><li>')}</li>`,
        ol: (...o) => `<ol>${_h.items(o)}</ol>`,
        ul: (...o) => `<ul>${_h.items(o)}</ul>`,
        grid: (...o) => `<div style="padding: 12px 0;">${o.join('')}<div style="clear:both;"></div></div>`,
        cell: (o) =>  `<div style="width: 130px; padding: 0 3px; float: left;">${o}</div>`,
        inset: (...o) => `<div style="padding-left: 10px;padding-right:20px">${o.join(' ')}</div>`,
        join: (...o) => o.join(' '),
        pre: (...o) =>`<div style="border:1px solid #e1e1e8;border-radius:4px;padding:8.5px;margin-bottom:9px;font-size:12px;white-space:normal;word-break:normal;word-wrap:normal;background-color:#f7f7f9;font-family:monospace;overflow:auto;">${o.join(' ')}</div>`,
        preformatted: (...o) =>_h.pre(o.join('<br>').replace(/\s/g,ch(' '))),
        code: (...o) => `<code>${o.join(' ')}</code>`,
        attr: {
            bare: (o)=>`${ch('@')}${ch('{')}${o}${ch('}')}`,
            selected: (o)=>`${ch('@')}${ch('{')}selected${ch('|')}${o}${ch('}')}`,
            target: (o)=>`${ch('@')}${ch('{')}target${ch('|')}${o}${ch('}')}`,
            char: (o,c)=>`${ch('@')}${ch('{')}${c||'CHARACTER NAME'}${ch('|')}${o}${ch('}')}`
        },
        bold: (...o) => `<b>${o.join(' ')}</b>`,
        italic: (...o) => `<i>${o.join(' ')}</i>`,
        font: {
            command: (...o)=>`<b><span style="font-family:serif;">${o.join(' ')}</span></b>`
        }
    };


    const getMirroredPair = (id) => {
        if(state[scriptName].mirrored.hasOwnProperty(id)){
            return {
                master: getObj('graphic',id),
                slave: getObj('graphic',state[scriptName].mirrored[id])
            };
        }
        let iid = keyForValue(state[scriptName].mirrored,id);
        if(iid){
            return {
                master: getObj('graphic',iid),
                slave: getObj('graphic',id)
            };
        }
    };

    const getMirrored = (id) => {
        if(state[scriptName].mirrored.hasOwnProperty(id)){
            return getObj('graphic',state[scriptName].mirrored[id]);
        }
        let iid = keyForValue(state[scriptName].mirrored,id);
        if(iid){
            return getObj('graphic',iid);
        }
    };

    const slaveByIds = (ids,push=false) => {
      ids.forEach(id=>createMirrored(id,push,'API'));
    };

    const getMirroredPropList = () => ([
      ...mirroredPropsNoBar,
      ...(state[scriptName].config.noBars ? [] : mirroredPropsWithBar),
      ...(state[scriptName].config.noLight ? [] : mirroredPropsWithLight)
    ]);

    const createMirrored = (id, push, who) => {
        // get root obj
        let master = getObj('graphic',id);
        let slave = getMirrored(id);

        if(!slave && master) {
            let layer=((state[scriptName].config.autoPush || push || 'gmlayer' === master.get('layer')) ? 'objects' : 'gmlayer');
            if(state[scriptName].config.autoPush || push) {
                master.set({layer: 'gmlayer'});
            }
            let baseObj = {
                imgsrc: clearURL,
                layer: layer,
                pageid: master.get('pageid'),
                aura1_color: state[scriptName].config.layerColors[layer],
                aura1_square: true,
                aura1_radius: 0.000001,
                light_otherplayers: (isPlayerToken(master) ? master.get('light_otherplayers') : false),
                showname: (isPlayerToken(master) ? master.get('showname') : false),
                showplayers_name: false,
                showplayers_bar1: false,
                showplayers_bar2: false,
                showplayers_bar3: false,
                showplayers_aura1: false,
                showplayers_aura2: false
            };
            getMirroredPropList().forEach( p => baseObj[p]=master.get(p) );
            slave = createObj('graphic',baseObj);
            state[scriptName].mirrored[master.id]=slave.id;
            forceLightUpdateOnPage(master.get('page_id'));
        } else {
            if(!slave) {
                sendChat('',`/w "${who}" `+
                    '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                        `<b>Error:</b> Couldn${ch("'")}t find a token for id: ${id}`+
                    '</div>'
                );
            }
        }
    };

    const setMasterLayer = (obj,layer) => {
        obj.set({
            layer: layer
        });
    };

    const setSlaveLayer = (obj,layer) => {
        obj.set({
            layer: layer,
            aura1_color: state[scriptName].config.layerColors[layer]
        });
    };

    const getActivePages = () => [...new Set([
        Campaign().get('playerpageid'),
        ...Object.values(Campaign().get('playerspecificpages')),
        ...findObjs({
            type: 'player',
            online: true
        })
        .filter((p)=>playerIsGM(p.id))
        .map((p)=>p.get('lastpage'))
      ])
    ];

    const forceLightUpdateOnPage = (()=>{
        const forPage = (pid) => (getObj('page',pid)||{set:()=>{}}).set('force_lighting_refresh',true);
        let pids = new Set();
        let t;

        return (pid) => {
          pids.add(pid);
          clearTimeout(t);
          t = setTimeout(() => {
            let activePages = getActivePages();
            [...pids].filter(p=>activePages.includes(p)).forEach(forPage);
            pids.clear();
          },100);
        };
    })();
  
    const bumpByIds = (ids) => {
      ids.forEach(id=>bumpToken(id,'API'));
    };

    const bumpToken = (id,who) => {
        let pair=getMirroredPair(id);
        if(pair && pair.master && pair.slave) {
            switch(pair.master.get('layer')){
                case 'gmlayer':
                    setMasterLayer(pair.master,'objects');
                    if(state[scriptName].config.autoUnslave){
                        removeMirrored(pair.master.id);
                    } else {
                        setSlaveLayer(pair.slave,'gmlayer');
                    }
                    break;

                default:
                    setMasterLayer(pair.master,'gmlayer');
                    setSlaveLayer(pair.slave,'objects');
                    break;
            }
            forceLightUpdateOnPage(pair.master.get('page_id'));
        } else if(state[scriptName].config.autoSlave) {
            createMirrored(id, false, who);
        }


    };

    const unslaveByIds = (ids) => {
      ids.forEach(id=>removeMirrored(id));
    };

    const removeMirrored = (id) => {
        let pair=getMirroredPair(id);
        if(pair) {
            pair.slave.remove();
            delete state[scriptName].mirrored[pair.master.id];
        }
    };


    const handleRemoveToken = (obj) => {
        // special handling for deleting slaves?
        removeMirrored(obj.id);
    };


    const unpackSM = (stats) => stats.split(/,/).reduce((m,v) => {
        let p = v.split(/@/);
        let n = parseInt(p[1] || '0', 10);
        if(p[0].length) {
          m[p[0]] = Math.max(n, m[p[0]] || 0);
        }
        return m;
      },{});

    const packSM = (o) =>  Object.keys(o)
      .map(k => ('dead' === k || o[k]<1 || o[k]>9) ? k : `${k}@${parseInt(o[k])}` ).join(',');

    
    const handleTokenChange = (obj,prev) => {
        let pair = getMirroredPair(obj.id);
        if(pair && obj) {
            // status markers
            if(obj.id === pair.slave.id && obj.get('statusmarkers') !== prev.statusmarkers){
                let sSM = unpackSM(obj.get('statusmarkers'));
                let mSM = unpackSM(pair.master.get('statusmarkers'));
                Object.keys(sSM).forEach( s => {
                    if(sSM[s]) {
                        mSM[s] = Math.min(Math.max((mSM[s]||0) + sSM[s],0),9);
                    } else if(mSM.hasOwnProperty(s)) {
                        delete mSM[s];
                    } else {
                        mSM[s]=0;
                    }
                });
                pair.slave.set('statusmarkers','');
                pair.master.set('statusmarkers',packSM(mSM));
            }

            const propList = getMirroredPropList();

            (pair.master.id === obj.id ? pair.slave : pair.master).set(propList.reduce((m,p) => {
                m[p]=obj.get(p);
                return m;
            },{}));

            if(pair.slave.id === obj.id) {
                pair.slave.set(Object.assign({
                    showplayers_name: false,
                    showplayers_bar1: false,
                    showplayers_bar2: false,
                    showplayers_bar3: false,
                    showplayers_aura1: false,
                    showplayers_aura2: false
                },(propList.reduce((m,p) => {
                    m[p]=pair.slave.get(p);
                    return m;
                },{}))));
            } else {
                pair.master.set(propList.reduce((m,p) => {
                    m[p]=pair.master.get(p);
                    return m;
                },{}));
                pair.slave.set({
                    showplayers_name: false,
                    showplayers_bar1: false,
                    showplayers_bar2: false,
                    showplayers_bar3: false,
                    showplayers_aura1: false,
                    showplayers_aura2: false
                });
            }

            if(obj.get('layer') !== prev.layer) {
                if(pair.master.id === obj.id) {
                    setSlaveLayer(pair.slave,prev.layer);
                } else {
                    setMasterLayer(pair.master,prev.layer);
                    setSlaveLayer(pair.slave,obj.get('layer'));
                }
            }
        }
    };

    const makeConfigOption = (config,command,text) => {
        let onOff = (config ? 'On' : 'Off' );
        let color = (config ? '#5bb75b' : '#faa732' );
        return '<div style="'+
                'border: 1px solid #ccc;'+
                'border-radius: .2em;'+
                'background-color: white;'+
                'margin: 0 1em;'+
                'padding: .1em .3em;'+
            '">'+
                '<div style="float:right;">'+
                    makeButton(command,onOff,color)+
                '</div>'+
                text+
                '<div style="clear:both;"></div>'+
            '</div>';
        
    };

    const makeConfigOptionColor = (config,command,text) => {
        let color = ('transparent' === config ? "background-image: url('"+checkerURL+"');" : "background-color: "+config+";");
        let buttonText ='<div style="border:1px solid #1d1d1d;width:40px;height:40px;display:inline-block;'+color+'">&nbsp;</div>';
        return '<div style="'+
                'border: 1px solid #ccc;'+
                'border-radius: .2em;'+
                'background-color: white;'+
                'margin: 0 1em;'+
                'padding: .1em .3em;'+
            '">'+
                '<div style="float:right;">'+
                    makeButton(command,buttonText)+
                '</div>'+
                text+
                '<div style="clear:both;"></div>'+
            '</div>';
    };

    const getConfigOption_GMLayerColor = () => {
        return makeConfigOptionColor(
            state[scriptName].config.layerColors.gmlayer,
            '!bump-config --gm-layer-color|?{What aura color for when the master token is visible? (transparent for none, #RRGGBB for a color)|'+state[scriptName].config.layerColors.gmlayer+'}',
            '<b>GM Layer (Visible) Color</b> is the color the overlay turns when it is on the GM Layer, thus indicating that the Bumped token is visible to the players on the Object Layer.'
        );

    };

    const getConfigOption_ObjectsLayerColor = () => {
        return makeConfigOptionColor(
            state[scriptName].config.layerColors.objects,
            '!bump-config --objects-layer-color|?{What aura color for when the master token is invisible? (transparent for none, #RRGGBB for a color)|'+state[scriptName].config.layerColors.objects+'}',
            '<b>Objects Layer (Invisible) Color</b> is the color the overlay turns when it is on the Objects Layer, thus indicating that the Bumped token is invisible to the players on the GM Layer.'
        );
    };

    const getConfigOption_AutoPush = () => {
        return makeConfigOption(
            state[scriptName].config.autoPush,
            '!bump-config --toggle-auto-push',
            '<b>Auto Push</b> automatically moves a bumped token to the GM Layer when it gets added to Bump.'
        );
    };

    const getConfigOption_AutoSlave = () => {
        return makeConfigOption(
            state[scriptName].config.autoSlave,
            '!bump-config --toggle-auto-slave',
            '<b>Auto Slave</b> causes tokens that are not in Bump to be put into Bump when ever !bump is run with them selected.'
        );
    };

    const getConfigOption_AutoUnslave = () => {
        return makeConfigOption(
            state[scriptName].config.autoUnslave,
            '!bump-config --toggle-auto-unslave',
            '<b>Auto Unslave</b> causes tokens that are in Bump to be unslaved when they are moved back to the Token Layer.'
        );
    };

    const getConfigOption_NoBars = () => {
        return makeConfigOption(
            state[scriptName].config.noBars,
            '!bump-config --toggle-no-bars',
            '<b>No Bars on Slave</b> causes slave tokens to only mirror the current value on the bars, not the max, preventing them from having bars.'
        );
    };

    const getConfigOption_NoLight = () => {
        return makeConfigOption(
            state[scriptName].config.noLight,
            '!bump-config --toggle-no-light',
            '<b>No Light on Slave</b> causes slave tokens to not retain any of the light settings themselves, thus hiding their light on the GM layer.'
        );
    };

    const getAllConfigOptions = () => {
        return getConfigOption_GMLayerColor() +
            getConfigOption_ObjectsLayerColor() +
            getConfigOption_AutoPush() +
            getConfigOption_AutoSlave() +
            getConfigOption_AutoUnslave() +
            getConfigOption_NoBars() +
            getConfigOption_NoLight();
    };

    const assureHelpHandout = (create = false) => {
        const helpIcon = "https://s3.amazonaws.com/files.d20.io/images/127392204/tAiDP73rpSKQobEYm5QZUw/thumb.png?15878425385";

        // find handout
        let props = {type:'handout', name:`Help: ${scriptName}`};
        let hh = findObjs(props)[0];
        if(!hh) {
            hh = createObj('handout',Object.assign(props, {inplayerjournals: "all", avatar: helpIcon}));
            create = true;
        }
        if(create || version !== state[scriptName].lastHelpVersion){
            hh.set({
                notes: helpParts.helpDoc({who:'handout',playerid:'handout'})
            });
            state[scriptName].lastHelpVersion = version;
            log('  > Updating Help Handout to v'+version+' <');
        }
    };


    const helpParts = {
        helpBody: (context) => _h.join(
                _h.header(
                    _h.paragraph('Bump provides a way to invisibly manipulate tokens on the GM Layer from the Objects Layer, and vice versa.')
                ),
                _h.subhead('Commands'),
                _h.inset(
                    _h.font.command(
                        `!bump`,
                        _h.optional(
                            `--help`,
                            `--slave`,
                            `--unslave`,
                            `--push`,
                            `--ids ${_h.required('token_id')} ${_h.optional(`${_h.required('token_id')} ...`)}`
                        )
                    ),
                    _h.paragraph( `Using ${_h.code('!bump')} on a token in Bump causes it to swap with it${ch("'")}s counterpart on the other layer.`),
                    _h.ul(
                        `${_h.bold('--help')} -- Shows the Help screen.`,
                        `${_h.bold('--slave')} -- Acts like ${_h.code('!bump-slave')} below.`,
                        `${_h.bold('--push')} -- When used with ${_h.code('--slave')}, if the selected token is on the Objects Layer, it will be pushed to the GM Layer.`,
                        `${_h.bold('--unslave')} -- Acts like ${_h.code('!bump-slave')} below.`,
                        `${_h.bold(`--ids ${_h.required('token_id')} ${_h.optional(`${_h.required('token_id')} ...`)}`)} -- Optional list of ids to perform the operation on.  Useful for scripting events what reveal a whole swath of tokens.`
                    ),
                    _h.font.command(
                        `!bump-slave`,
                        _h.optional(
                            `--push`,
                            `--help`
                        )
                    ),
                    _h.paragraph( 'Adds the selected tokens to Bump, creating their slave tokens.'),
                    _h.ul(
                        `${_h.bold('--push')} -- If the selected token is on the Objects Layer, it will be pushed to the GM Layer.`,
                        `${_h.bold('--help')} -- Shows the Help screen.`
                    ),
                    _h.font.command(
                        `!bump-unslave`,
                        _h.optional(
                            `--help`
                        )
                    ),
                    _h.paragraph( 'Removes the selected tokens from Bump, removing their slave tokens.')
                ),
                _h.subhead('Description'),
                _h.inset(
                    _h.paragraph('When a token is added to Bump a slave token is created that mimics everything about the master token.  The slave token is only visible to the GM and has a color on it to show if the master token is on the GM Layer or the Objects layer.  Moving the slave token will move the master token and vice versa.  The slave token represents the same character as the master token and changes on the slave token will be reflected on the master token.'),
                    _h.paragraph('Non-GM players can also use bump on characters they control.  They will be able to see their bumped token as a transparent aura, but other players will not.  This is useful for invisible characters.'),
                    _h.paragraph(`While changes on the slave token will be reflected on the master token, Status Markers have a special behavior.  Status Markers are always cleared from the slave token to prevent it from being visible, with the following changes being made to the master token. Adding a Status Marker on a slave token that is not on the master token will cause that Status Marker to be added to the master token. Adding a Status Marker to the slave token that is on the master token causes it to be removed from the master token.  Adding a Status Marker with a number on the slave token will cause that number to be added to the master token${ch("'")}s Status Marker. Note that non-GM players will not be able to see Status Markers.`)
                ),
                ( playerIsGM(context.playerid)
                    ?  _h.group(
                            _h.subhead('Configuration'),
                            getAllConfigOptions()
                        )
                    : ''
                )
            ),
        helpDoc: (context) => _h.join(
                _h.title(scriptName, version),
                helpParts.helpBody(context)
            ),

        helpChat: (context) => _h.outer(
                _h.title(scriptName, version),
                helpParts.helpBody(context)
            )
        
    };

    const showHelp = (playerid) => {
        const who=(getObj('player',playerid)||{get:()=>'API'}).get('_displayname');
        let context = {
            who,
            playerid
        };
        sendChat('', '/w "'+who+'" '+ helpParts.helpChat(context));
    };


    const playerCanControlFromID = (id,playerid) => {
      let o=getObj('graphic',id);
      if(o){
        return playerCanControl(o,playerid);
      }
      return false;
    };

    const playerCanControl = (obj, playerid='any') => {
        const playerInControlledByList = (list, playerid) => list.includes('all') || list.includes(playerid) || ('any'===playerid && list.length);
        let players = obj.get('controlledby')
            .split(/,/)
            .filter(s=>s.length);

        if(playerInControlledByList(players,playerid)){
            return true;
        }

        if('' !== obj.get('represents') ) {
            players = (getObj('character',obj.get('represents')) || {get: function(){return '';} } )
                .get('controlledby').split(/,/)
                .filter(s=>s.length);
            return  playerInControlledByList(players,playerid);
        }
        return false;
    };

    const handleInput = (msg) => {
      if (msg.type !== "api") {
        return;
      }
      let who=(getObj('player',msg.playerid)||{get:()=>'API'}).get('_displayname');
      let mode;
      let args = msg.content.split(/\s+--/);
      let PIG = playerIsGM(msg.playerid);
      let ids = [...(msg.selected||[]).map(o=>o._id)];
      switch(args.shift()) {
        case '!bump':
          mode = 'BUMP';
          break;

        case '!bump-slave':
          mode = 'BUMP:SLAVE';
          break;

        case '!bump-unslave':
          mode = 'BUMP:UNSLAVE';
          break;

        case '!bump-config':
          mode = 'BUMP:CONFIG';
          break;

        default:
          return;
      }
      let done = false;
      let forcePush = false;
      
      args.forEach(a=>{
        let cmds = a.split(/\s+/);
        switch(cmds.shift()){
          case 'help':
            showHelp(msg.playerid);
            done=true;
            break;

          case 'slave':
            mode='BUMP:SLAVE';
            break;

          case 'unslave':
            mode='BUMP:UNSLAVE';
            break;
          
          case 'push':
            forcePush = true;
            break;

          case 'config':
            mode='BUMP:CONFIG';
            break;

          case 'ids':
            ids=[...ids,...cmds.filter(id=>(PIG||playerCanControlFromID(id)))];
            break;
        }
      });

      if(done){
        return;
      }
      ids = [...new Set(ids)].filter(id=>!ids.includes(state[scriptName].mirrored[id]));

      switch(mode) {
        case 'BUMP':
          ids.forEach( (id) => bumpToken(id,who) );
          break;

        case 'BUMP:SLAVE':
          ids.forEach( (id) => createMirrored(id, forcePush, who) );
          break;

        case 'BUMP:UNSLAVE':
          ids.forEach( (id) => removeMirrored(id) );
          break;

        case 'BUMP:CONFIG':
          if(!playerIsGM(msg.playerid)){
            return;
          }
          if(!args.length) {
            sendChat('','/w "'+who+'" '+
              '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
              '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'+
              'Bump v'+version+
              '</div>'+
              getAllConfigOptions()+
              '</div>'
            );
            return;
          }
          args.forEach((a) => {
            let opt=a.split(/\|/);
            let omsg='';
            switch(opt.shift()) {
              case 'gm-layer-color':
                if(opt[0].match(regex.colors)) {
                  state[scriptName].config.layerColors.gmlayer=opt[0];
                } else {
                  omsg='<div><b>Error:</b> Not a valid color: '+opt[0]+'</div>';
                }
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  omsg+
                  getConfigOption_GMLayerColor()+
                  '</div>'
                );
                break;

              case 'objects-layer-color':
                if(opt[0].match(regex.colors)) {
                  state[scriptName].config.layerColors.objects=opt[0];
                } else {
                  omsg='<div><b>Error:</b> Not a valid color: '+opt[0]+'</div>';
                }
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  omsg+
                  getConfigOption_ObjectsLayerColor()+
                  '</div>'
                );
                break;

              case 'toggle-auto-push':
                state[scriptName].config.autoPush=!state[scriptName].config.autoPush;
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  getConfigOption_AutoPush()+
                  '</div>'
                );
                break;

              case 'toggle-auto-slave':
                state[scriptName].config.autoSlave=!state[scriptName].config.autoSlave;
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  getConfigOption_AutoSlave()+
                  '</div>'
                );
                break;

              case 'toggle-auto-unslave':
                state[scriptName].config.autoUnslave=!state[scriptName].config.autoUnslave;
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  getConfigOption_AutoUnslave()+
                  '</div>'
                );
                break;

              case 'toggle-no-bars':
                state[scriptName].config.noBars=!state[scriptName].config.noBars;
                fixupSlaveBars();
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  getConfigOption_NoBars()+
                  '</div>'
                );
                break;

              case 'toggle-no-light':
                state[scriptName].config.noLight=!state[scriptName].config.noLight;
                fixupSlaveLight();
                sendChat('','/w "'+who+'" '+
                  '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'+
                  getConfigOption_NoLight()+
                  '</div>'
                );
                break;

              default:
                sendChat('','/w "'+who+'" '+
                '<div><b>Unsupported Option:</div> '+a+'</div>');
            }

          });

          break;
      }
    };
    
    const handleTurnOrderChange = () => {
         Campaign().set({
            turnorder: JSON.stringify(
                JSON.parse( Campaign().get('turnorder') || '[]').map( (turn) => {
                    let iid = keyForValue(state[scriptName].mirrored,turn.id);
                    if(iid) {
                        turn.id = iid;
                    }
                    return turn;
                })
            )
        });
    };

    const registerEventHandlers = () => {
        on('chat:message', handleInput);
        on('change:graphic', handleTokenChange);
        on('destroy:graphic', handleRemoveToken);
        on('change:campaign:turnorder', handleTurnOrderChange);

        if('undefined' !== typeof GroupInitiative && GroupInitiative.ObserveTurnOrderChange){
            GroupInitiative.ObserveTurnOrderChange(handleTurnOrderChange);
        }
        if('undefined' !== typeof TokenMod && TokenMod.ObserveTokenChange){
            TokenMod.ObserveTokenChange(handleTokenChange);
        }
    };

    on('ready', () => {
      checkInstall();
      registerEventHandlers();
    });

    return {
        Notify_TurnOrderChange: handleTurnOrderChange,
        Slave: slaveByIds,
        Unslave: unslaveByIds,
        Bump: bumpByIds
    };
    
})();


{try{throw new Error('');}catch(e){API_Meta.Bump.lineCount=(parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/,'$1'),10)-API_Meta.Bump.offset);}}

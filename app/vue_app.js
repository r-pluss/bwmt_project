(function(){

'use strict';
let use_mock_db = false;

const db = use_mock_db ? window.Q7x$GTCyRg8uYuB.mock : window.Q7x$GTCyRg8uYuB.actual;

const app = new Vue({
    el: '#app-root',
    data: {
        entries: [],
        header: 'Test #01',
        header_1: 'Identifying Info',
        header_2: 'Enter data here',
        header_3: 'Extra Data Entry',
        new_session: {
            descript: '',
            modal_active: false
        },
        session_data: [],
        session_id: null,
        session_list: [],
        session_selected: false,
        ui: {
            visibleEntries: []
        }
    },
    methods: {
        cancel_new_session_modal: cancel_new_session_modal,
        carouselNav: carouselNavHandler,
        create_session: create_session,
        keyup_esc: keyup_esc,
        new_session_modal: new_session_modal,
        select_existing_session: select_existing_session,
        pushFakeEntries: pushFakeEntries
    },
    mounted: start
});

const carousel = {
    filterQuery: null,
    fliterDelay: 300,
    maxItems: 8
};

//for debugging only
window._$app = app;

function start(){
    registerCarouselFilter();
    db.get_sessions(handle_sessions);
}

/*function declarations*/
function cancel_new_session_modal(){
    console.log('cancel_new_session_modal was called');
    window.document.getElementById('new-session-descript-warn').textContent = null;
    window.document.getElementById('new-session-modal').classList.remove('is-active');
    app.new_session.descript = '';
    app.new_session.modal_active = false;
}

function create_session(){
    if(app.new_session.descript === ''){
        window.document.getElementById('new-session-descript-warn').textContent = 'Description cannot be blank.';
        throw new BlankDescript();
    }
    /*let dt = new Date();
    let new_session = {
        created_ts: dt.valueOf(),
        created_string: dt.toLocaleString(),
        descript: app.new_session.descript,
        entry_count: 0,
        last_modified_ts: dt.valueOf(),
        last_modified_string: dt.toLocaleString(),
        session_id: db.new_session_id()
    };
    console.log(new_session);
    db.save_new_session(new_session);
    app.session_id = new_session.session_id;
    app.new_session.descript = '';
    window.document.getElementById('new-session-modal').classList.remove('is-active');
    app.new_session.modal_active = false;
    app.session_selected = true;*/
    db.save_new_session(app.new_session.descript, handle_new_session);
}

function new_session_modal(){
    app.new_session.modal_active = true;
    window.document.getElementById('new-session-modal').classList.add('is-active');
}

function select_existing_session(session_id){
    db.get_session_entries(session_id,handle_session_entries);
}

function handle_sessions(data){
    console.log(data);
    app.session_list = data.sessions;
}

function handle_new_session(data){
    console.log(data);
    app.session_id = new_session.session_id;
    app.new_session.descript = '';
    window.document.getElementById('new-session-modal').classList.remove('is-active');
    app.new_session.modal_active = false;
    app.session_selected = true;
}

function handle_session_entries(data){
    console.log(data);
    app.session_id = data.session_id;
    app.entries = data.entries;
    insertUIEntries(data.entries);
    app.session_selected = true;
}

function handle_entry(data){
    
}

function insertUIEntries(entries){
    if(Array.isArray(entries)){
        for(let i of entries){
            if(!(app.ui.visibleEntries.length < carousel.maxItems)){
                app.ui.visibleEntries.shift();
            }
            app.ui.visibleEntries.push(i);
        }
    }else{
        if(!(app.ui.visibleEntries.length < carousel.maxItems)){
            app.ui.visibleEntries.shift();
        }
        app.ui.visibleEntries.push(entries);
    }
}

function handle_new_entry(){
    let data = {
        captain: getEntryCaptain(),
        entry_id: entryID(),
        junk_fish: getEntryJunkFish(),
        session_id: app.session_id,
        tournament_id: getTournamentID(),
        walleyes: getEntryWalleyes()
    };
    db.save_entry(data, handle_entry);
}

function getEntryCaptain(){
    //TODO
    return null;
}

function getEntryJunkFish(){
    let junk = document.getElementById('junk-1').valueAsNumber;
    if(junk === NaN){
        junk = null;
    }
    return junk;
}

function getTournamentID(){
    //TODO
    return null;
}

function getEntryWalleyes(){
    let walleyes = [document.getElementById('wall-1').valueAsNumber,
        document.getElementById('wall-2').valueAsNumber,
        document.getElementById('wall-3').valueAsNumber];
    for(let w of walleyes){
        if(w === NaN){
            w = null;
        }
    }
    walleyes.sort();
    return walleyes;
}

function pushFakeEntries(){
    let _ = [
        {entry_id: 'Entry #1'},
        {entry_id: 'Entry #2'},
        {entry_id: 'Entry #3'}
    ];
    for(let i of _){
        app.ui.visibleEntries.push(i);
    }
}


function entryID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}


/*keyboard events*/
function keyup_esc(e){
    if(app.new_session.modal_active){
        cancel_new_session_modal();
    }
}


/*application errors*/
function BlankDescript(){
    this.name = 'BlankDescript';
    this.message = 'Session description cannot be blank.';
    this.toString = function(){
        return `${this.name} - ${this.message}`;
    };
}


/*carousel shit*/


function registerCarouselFilter(){
    let filter = document.getElementById('entry-filter');
    document.addEventListener('filter-entries', function(e){
        if(carousel.filterQuery !== null){
            window.clearTimeout(carousel.filterQuery);
        }
        let q = document.getElementById('entry-filter').value;
        if(q.length > 0){
            window.setTimeout(filterQuery, carousel.fliterDelay, q);
        }else{
            resetFilter();
        }
    });
    document.addEventListener('input', function(e){
        if(e.target.id === 'entry-filter'){
            let f = new Event('filter-entries');
            document.getElementById('entry-filter').dispatchEvent(f);
        }
    });
}

function filterQuery(query){
    app.ui.visibleEntries.length = 0;
    for(let i of app.entries){
        if(i.captain.includes(query) ||
            i.tournament_id.toString().includes(query) ||
            i.entry_id.toString().includes(query)
        ){
            app.ui.visibleEntries.push(i);
        }
    }
}

function resetFilter(){
    document.getElementById('entry-filter').value = "";
    app.ui.visibleEntries.length = 0;
    if(app.entries.length <= carousel.maxItems){
        for(let i of app.entries){
            app.ui.visibleEntries.push(i);
        }
    }else{
        for(let i = 0; i < carousel.maxItems; i++){
            app.ui.visibleEntries.push(app.entries[i]);
        }
    }
}

function carouselNavHandler(e){
    e.preventDefault();
}


/*
function registerCarouselEventHandlers(){
    let navs = document.getElementsByClassName('carousel-nav');
    console.log(navs);
    for(let n of navs){
        console.log(n);
        n.addEventListener('click', carouselNavHandler);
    }
}

function carouselInit(){
    if(!carousel.properties.initComplete){
        window.setTimeout(function(){
            console.log('setting container');
            carousel.properties.container = document.getElementsByClassName('carousel')[0];
            carousel.properties.items = carousel.properties.container.getElementsByTagName('ul')[0];
            registerCarouselEventHandlers();
            carousel.properties.items.addEventListener('transitionend', carouselAniComplete);
            if(carousel.properties.items.children.length > 0){
                carousel.properties.initComplete = true;
                let itemStyle = window.getComputedStyle(
                    carousel.properties.items.children[0], null) || carousel.properties.items.children[0].currentStyle;
                carousel.properties.width = parseInt(itemStyle.getPropertyValue('width'),10);
                carousel.properties.marginRight = parseInt(itemStyle.getPropertyValue('margin-right'), 10);
            }
            carouselChangeOrdinal();
        }, 335);
    }
}

function carouselAniComplete(){
    if(carousel.animating){
        carousel.animating = false;
        carousel.properties.container.classList.remove('animate');
        carouselChangeOrdinal();
        carousel.properties.items.style.marginLeft = `-${carousel.properties.width}px`;
    }
}

function carouselChangeOrdinal(){
    if(carousel.properties.initComplete){
        let len = carousel.properties.items.children.length,
            ord = 0,
            index = carousel.active - 1;
        if(index < 0){
            index = len - 1;
        }
        while(ord < len){
            ord++;
            let i = carousel.properties.items.children[index];
            if(i && i.style){
                i.style.order = ord;
            }
            if(index < (len - 1)){
                index++;
            }else{
                index = 0;
            }
        }
    }else{
        carouselInit();
    }
}

function carouselNavHandler(e){
    e.preventDefault();
    console.log('Received navigation command');
    if(!carousel.animating){
        let target = e.target || e.srcElement,
            next = target.classList.contains('carousel-next'),
            margin = 0;
        carousel.properties.container.classList.add('animate');
        carousel.animating = true;
        if(next){
            margin = -((carousel.properties.width * 2) + carousel.properties.marginRight);
            if(carousel.active < carousel.properties.items.children.length - 1){
                carousel.active++;
            }else{
                carousel.active = 0;
            }
        }else{
            margin = carousel.properties.marginRight;
            if(carousel.active > 0){
                carousel.active--;
            }else{
                carousel.active = carousel.properties.items.children.length - 1;
            }
        }
        carousel.properties.items.style.marginLeft = `${margin}px`;
    }
}
*/


})();

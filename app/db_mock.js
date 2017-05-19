(function(){
'use strict';

let storage_keys;

const $http = axios.create(
    {
        baseURL: 'http://hub.saginawcontrol.com:8019',
        maxContentLength: 20000,
        timeout: 2000
    }
);

const db = {
    mock: {
        get_results: mock_get_results,
        get_session: mock_get_session,
        get_sessions: mock_get_sessions,
        new_session_id: new_session_id,
        save_data: mock_save_data,
        save_new_session: mock_save_new_session
    },
    actual: {
        get_sessions: actual_get_sessions,
        get_session_entries: actual_get_session_entries,
        save_entry: save_entry,
        save_new_session: actual_save_new_session
    }
};

function is_session_descript_similar(a, b){
    return a.replace(/\s/g, '').toLowerCase() === b.replace(/\s/g, '').toLowerCase();
}

function mock_save_data(session_id, data_obj){
    let session_data;
    let session_data_string = window.localStorage.getItem('session_data');
    if(session_data_string === null){
        session_data = {};
    }else{
        session_data = window.JSON.parse(session_data_string);
    }
    if(session_id in session_data){
        session_data[session_id].entries.push(data_obj);
    }else{
        session_data[session_id] = {entries: [data_obj]};
    }
    window.localStorage.setItem('session_data',
        window.JSON.stringify(session_data)
    );
    mock_update_session_meta_data(session_id, session_data[session_id]);
}

function mock_get_results(){

}

function mock_get_session(session_id){
    let session_data_string = window.localStorage.getItem('session_data');
    let session_data = window.JSON.parse(session_data_string)[session_id];
    if(typeof session_data === 'undefined'){
        throw new NoSessionFoundError(session_id);
    }
    console.log(session_data);
}

function mock_get_sessions(){
    let str_sessions = window.localStorage.getItem('saved_sessions');
    if(str_sessions === null){
        window.localStorage.setItem('saved_sessions',
            window.JSON.stringify({session_list: []})
        );
        return [];
    }else{
        return window.JSON.parse(str_sessions).session_list;
    }
}

function actual_get_sessions(callback){
    $http(
        {
            url: '/bwmt/sessions',
            method: 'GET'
        }
    ).then(
        function(response){
            console.log(response);
            callback(response.data);
        }
    );
}

function save_entry(data, callback){
    $http(
        {
            url: '/bwmt/sessions',
            method: 'POST',
            data: data
        }
    ).then(
        function(response){
            console.log(response);
            callback(response.data);
        }
    );
}

function mock_save_new_session(session_data){
    let sessions = window.JSON.parse(
        window.localStorage.getItem('saved_sessions')
    );
    for(let sess of sessions.session_list){
        if(is_session_descript_similar(sess.descript, session_data.descript)){
            throw new SessionCollisionError(session_data.descript);
        }
    }
    sessions.session_list.push(session_data);
    window.localStorage.setItem('saved_sessions',
        window.JSON.stringify(sessions)
    );
}

function actual_save_new_session(desc, callback){
    let ts = new Date().valueOf();
    $http(
        {
            method: 'POST',
            url: '/bwmt/new_session',
            data: {
                description: desc,
                timestamp: ts
            }
        }
    ).then(
        function(response){
            console.log(response);
            callback(response.data);
        }
    );
}

function actual_get_session_entries(session_id, callback){
    $http(
        {
            method: 'GET',
            url: `/bwmt/entries/${session_id}`,
        }
    ).then(
        function(response){
            console.log(response);
            callback(response.data);
        }
    );
}

function mock_update_session_meta_data(session_id, session_data){
    let sessions = window.JSON.parse(
        window.localStorage.getItem('saved_sessions')
    );
}

function new_session_id(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

/*db error declarations*/
function KeyError(){
    this.message = "Object lacks 'id' field";
    this.name = 'KeyError';
    this.toString = function(){
        return `${this.name} - ${this.message}`
    };
}

function NoSessionFoundError(session_id){
    this.name = 'NoSessionFoundError';
    this.session_id = session_id;
    this.toString = function(){
        return `${this.name} - No session with ID ${this.session_id} found.`;
    }
}

function SessionCollisionError(val){
    this.name = 'SessionCollisionError';
    this.collision = val;
    this.toString = function(){
        return `${this.name} - session with description ${this.collision} already exists.`;
    };
}

/*register to global namespace for import into other modules*/
window.Q7x$GTCyRg8uYuB = db;
})();

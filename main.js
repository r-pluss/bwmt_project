'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const debug = false;
const vue_dev_tools_path = '/User Data/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/3.1.2_0';

if(debug){
    BrowserWindow.addDevToolsExtension(vue_dev_tools_path);
}


var mainWindow;

app.on('ready', function(){
    mainWindow = new BrowserWindow({
        height: electron.screen.getPrimaryDisplay().size.height,
        width: electron.screen.getPrimaryDisplay().size.width,
        webPreferences: {
            nodeIntegration: true
        }
    });
    //mainWindow.setFullScreen(true);
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
});

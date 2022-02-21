const { app, Menu, Tray, clipboard, Notification, dialog } = require('electron');
require("dotenv").config();
const axios = require('axios').default;
const fs = require("fs");
const FormData = require('form-data');

function validFormat(formats) {
  const FORMATS = ["image/png", "image/jpeg"]
  return formats.map(i => FORMATS.includes(i)).reduce((x,y) => x || y);
}

let tray = null
async function upload(menuItem, browserWindow, event){
  let image = clipboard.readImage();
  if (!validFormat(clipboard.availableFormats("clipboard"))) {
    dialog.showMessageBox({type: "warning", title:"Error", detail:"No image on clipboard!"})
    return;
  }
  image = image.toPNG();

  if (!fs.existsSync("./temp")) {
    fs.mkdirSync("temp")
  }
  
  fs.writeFile("./temp/temp.png", image, async (err) => {
    if (err) {
      console.log(err);
      return;
    }
    tray.setImage("./upload.ico")
    const form = new FormData();
    await form.append("file", fs.createReadStream("./temp/temp.png"));
    const url = `${process.env.URL}/upload`;
    const res = await axios.post(url, form, {headers: form.getHeaders()});
    fs.rmSync("./temp/temp.png");
    tray.setImage("./icon.ico")
    if (res.status == 200) {
      clipboard.writeText(`${process.env.URL}/${res.data.fileName}`, "clipboard")
      let notification = new Notification({
        title: "URL copied to clipboard!"
      })
      notification.show();
    }
  });
}

function apiKey(menuItem, browserWindow, event){
    console.log("api key")
}

app.whenReady().then(() => {
  tray = new Tray('./icon.ico')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Upload clipboard', type: 'normal', click: upload},
    { label: 'Set API key', type: 'normal', click: apiKey}
  ])
  tray.setToolTip('Upload clipboard')
  tray.setContextMenu(contextMenu)
  tray.on("click", upload)
})
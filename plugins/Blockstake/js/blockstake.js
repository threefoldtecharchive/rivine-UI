'use strict'

// Library for communicating with Rivine-UI
const electron = require('electron')
require("request")

RivineAPI.call("/wallet", (err,result) => {
  if(err){
    RivineAPI.showError("Error",err.toString())
    ipcRenderer.sendToHost("Notification", err.toString(), "error")
  }
  document.getElementById("amount").innerHTML = result.blockstakebalance
})

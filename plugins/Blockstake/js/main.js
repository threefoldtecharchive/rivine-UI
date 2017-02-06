'use strict'
// Library for communicating with Rivine-UI
const electron = require('electron')

RivineAPI.call("/WalletBlockStakeStatsGET", (err,result) => {
  if(err){
    RivineAPI.showError("Error",err.toString())
    ipcRenderer.sendToHost("Notification", err.toString(), "error")
  }
  document.getElementById("amount").innerHTML = result.TotalActiveBlockStake
})

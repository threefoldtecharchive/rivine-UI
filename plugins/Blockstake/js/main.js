const electron = require('electron')

RivineAPI.call("/wallet/blockstakestats", (err,result) => {
  if(err){
    RivineAPI.showError("Error",err.toString())
    ipcRenderer.sendToHost("Notification", err.toString(), "error")
  }
  document.getElementById("amount").innerHTML = result.totalactiveblockstake

  var table = document.getElementById("table");



  for(var i = 0; i < result.blockstakestate.length; i++){
      var row = table.insertRow(i+1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        cell1.innerHTML = result.blockstakestate[i]
        cell2.innerHTML = result.blockstakenumof[i]
        cell3.innerHTML = result.blockstakeage[i]
        cell4.innerHTML = result.blockstakeblockcreation[i]
        cell5.innerHTML = result.blockstakefee[i]
        cell6.innerHTML = result.blockstakebclastweek[i]
        cell7.innerHTML = result.blockstakebclastweekt[i]
      }
})

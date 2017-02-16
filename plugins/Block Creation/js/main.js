const electron = require('electron');

// addCommasToNumber adds commas to a number at the thousands places.
function addCommasToNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// readableCoins converts a number of hastings into a more readable volume of
// coins.
function readableCoins(hastings) {
	if (hastings < 1000000000000000000000000000000000) {
		return addCommasToNumber((hastings / 1000000000000000000000000).toFixed(3)) + " coins";
	} else {
		return addCommasToNumber((hastings / 1000000000000000000000000000000000).toFixed(3)) + " billion coins";
	}
}

//request to the deamon for statitistics of the blockstakes
RivineAPI.call("/wallet/blockstakestats", (err,result) => {
  if(err){
    RivineAPI.showError("Error",err.toString())
    ipcRenderer.sendToHost("Notification", err.toString(), "error")
  }

  //setting the total of the blockstakes in the header
  document.getElementById("amount").innerHTML = "Currently " + result.totalactiveblockstake + " blockstake active"
  //document.getElementById("totalBlockAge").innerHTML = "Total blockage: " + result.blockstakeage[result.blockstakestate.length -1]
  document.getElementById("totalBlocksCreated").innerHTML = result.totalblockstake + " active by this account"
  document.getElementById("totalBlocksfee").innerHTML = ""
  document.getElementById("totalBlockasActive").innerHTML = "Total blocks created " + result.totalbclast1000 + " / " + result.blockcount +" ( " + result.totalbclast1000t + " theoretical ) with fee of " + readableCoins(result.totalfeelast1000);


  var table = document.getElementById("table");

  //loop for how many objects there are in the json object
  for(var i = 0; i < result.blockstakestate.length; i++){
      var row = table.insertRow(i+1);

      //create a cell for each value
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      //var cell4 = row.insertCell(3);
      //var cell5 = row.insertCell(4);
      //var cell6 = row.insertCell(5);

      //setting the cells value to what's in the json object
      cell2.innerHTML = result.blockstakenumof[i]
      cell3.innerHTML = result.blockstakeutxoaddress[i]

      //cell4.innerHTML = result.blockstakeblockcreation[i]
      //cell5.innerHTML = result.blockstakefee[i]
      //cell6.innerHTML = result.blockstakebclastweek[i] + "/" + result.blockstakebclastweekt[i]

      //checking wheter the row is Deactive (if deactive = light-dark-grey else light-grey)
      if(result.blockstakestate[i] == 0){
        cell1.innerHTML = "Deactive"
        cell1.style.backgroundColor = "#c8c8c8";
        cell2.style.backgroundColor = "#c8c8c8";
        cell3.style.backgroundColor = "#c8c8c8";
        //cell4.style.backgroundColor = "#c8c8c8";
        //cell5.style.backgroundColor = "#c8c8c8";
        //cell6.style.backgroundColor = "#c8c8c8";
      }
      else{
        cell1.innerHTML = "Active"
        cell1.style.backgroundColor = "#efefef";
        cell2.style.backgroundColor = "#efefef";
        cell3.style.backgroundColor = "#efefef";
        //cell4.style.backgroundColor = "#efefef";
        //cell5.style.backgroundColor = "#efefef";
        //cell6.style.backgroundColor = "#efefef";
      }
    }
})

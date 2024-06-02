// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const ipc = require('electron').ipcRenderer


// var outputdata = [];

var stringbuffer = "";
var HOLDFLAG = false;

// form
const form = document.querySelector('form')

// buttons
const check = document.getElementById('connection')
const searchbtn = document.getElementById('searchbtn')
const copymsg = document.getElementById('copymsg')
const clearconsole = document.getElementById('clearconsole')
const alertboxbtn=document.querySelector('#closealert')

//  Inputs
const region = document.querySelector("#region")
const profile = document.querySelector("#profile")
const sqsqueue = document.querySelector("#sqsqueue")
const msgno = document.querySelector("#msgno")
const filter = document.querySelector("#filterbox")
const searchbox = document.querySelector("#searchbox")
const outbox = document.querySelector("#outbox")


check.addEventListener('click',checkconnection);
searchbtn.addEventListener('click', searchText);

function resetByNames(...names){
    names.forEach(name => {
        name.value = ""
    });
}

function checkconnection(c){
    c.preventDefault();
    // Check the value of region and profile and if anything is empty then throw an alert
    if(region.value == '' || profile.value == '')
    {
        // put the focus back to the empty field
        if(region.value == '')
        {
            region.focus()
            // change the color of the border
            region.style.boxShadow = "0 0 10px crimson";
        }
        else
        {
            profile.focus()
            // nod effect
            profile.style.boxShadow = "0 0 10px crimson";
        }
    }
    else
    {   
        // Remove the focus and the border color
        region.style.boxShadow = "0 0 0px";
        profile.style.boxShadow = "0 0 0px";

        // clear the output box
        outbox.textContent = "";

        ipc.send('connectivity', region.value, profile.value)

        // hide the connection button
        check.setAttribute('hidden', true)
        
        // disable the region and profile fields
        region.setAttribute('disabled', true)
        profile.setAttribute('disabled', true)
        
        resetByNames(msgno,filter,searchbox,outbox,sqsqueue)
        
    }
    
  }

// list.addEventListener('click',getallqueues);

function getallqueues(q){
  const region = document.querySelector("#region").value
  const profile = document.querySelector("#profile").value
  ipc.send('getqueueslist', region, profile)
  ////console.log(region,profile)
}

// to search the text in the output box
function searchText(s) {
    console.log("Search has come",s)
    const search = document.getElementById('searchbox').value;
    const outbox = document.getElementById('outbox');
    const instance = new Mark(outbox);
    instance.unmark(); // remove any previous marks
    instance.mark(search);
}

form.addEventListener('submit',submitform);

function submitform(e){
  e.preventDefault();
  const msgno = document.querySelector("#msgno").value
  const sqsqueue = document.querySelector("#sqsqueue").value
  const region = document.querySelector("#region").value
  const profile = document.querySelector("#profile").value
  const filter = document.querySelector("#filterbox").value

  // if the values are empty then highlight the fields with red border shadow
    if(msgno == '' || sqsqueue == '' || sqsqueue == 'Select Queue')
    {
        if(sqsqueue == '' || sqsqueue == 'Select Queue')
        {
            document.querySelector("#sqsqueue").focus()
            // change the color of the border
            document.querySelector("#sqsqueue").style.boxShadow = "0 0 10px crimson";
        }
        // put the focus back to the empty field
        else if(msgno == '')
            {
                document.querySelector("#msgno").focus()
                // change the color of the border
                document.querySelector("#msgno").style.boxShadow = "0 0 10px crimson";
            }
    }
    else
    {
        // Remove the focus and the border color
        document.querySelector("#msgno").style.boxShadow = "0 0 0px";
        document.querySelector("#sqsqueue").style.boxShadow = "0 0 0px";
    } 
    ipc.send('listqueue', msgno, sqsqueue, region, profile, filter)
}

const shell = require('electron').shell;

$(document).on('click', 'a[href^="http"]', function(event) {
  event.preventDefault();
  shell.openExternal(this.href);
});

function pageScroll() {
    window.scrollBy(0,100);
    // scrolldelay = setTimeout(pageScroll,10);
}

function resetAll(){
    $("#sqsqueue").html('<option selected>Select Queue</option>')
    $("#getqueues").attr('hidden', true)
    $("#selectqueue").attr('hidden', true)
    $("#noofmessages").attr('hidden', true);
    $("#actionbtn").attr('hidden', true);
    $("#barprogress").attr('hidden', true);
    $("#filter").attr('hidden', true);
    $("#outbox").html("");
    $("#connection").attr('hidden', false)
    $("#searchbox").val("");
    $("#noofmessages").val("");
    $("#filterbox").val("");
    $("#msgno").val("");
    $("#profile").val("");

    // enable the region and profile fields
    $("#region").removeAttr('disabled');
    $("#profile").removeAttr('disabled');
}


$( document ).ready(function() {
    ////console.log( "Renderer is ready!" );
    const regions=['us-east-1','us-east-2','us-west-1','us-west-2','af-south-1','ap-east-1','ap-south-1','ap-northeast-3','ap-northeast-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ca-central-1','eu-central-1','eu-west-1','eu-west-2','eu-south-1','eu-west-3','eu-north-1','me-south-1','sa-east-1']
    regions.forEach((e,index) => {
        $("#region").append(
            '<option class="region">Select Queue</option>'
        );
        $(".region").last().text(e.toString());
      });
});

ipc.on('exception',function(event, data){
    if(data == "Error: Could not load credentials from any providers")
    {
        $("#alertsection").html(
            '<div class="alert alert-danger alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Error!</strong> <span class="alerttext"></span></div>'
            );
            $(".alerttext").last().text("No profile exists with the given name");
            pageScroll()
    }
    else if(data == "Error: The security token included in the request is invalid.")
    {
        $("#alertsection").html(
            '<div class="alert alert-danger alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Error!</strong> <span class="alerttext"></span></div>'
            );  
            $(".alerttext").last().text("Security token in invalid. Please select another Region.");
    }
    else
    {
        $("#alertsection").html(
            '<div class="alert alert-danger alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Error!</strong> <span class="alerttext"></span></div>'
            );  
            $(".alerttext").last().text(data);
    }
    
    resetAll()
    //$(".alerttext").last().text(data.toString());

})

ipc.on("connectivity", function(event, data){
    if(data.httpStatusCode == 200)
    {
        // $("#getqueues").removeAttr('hidden');
        $("#alertsection").html(
            '<div class="alert alert-success alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Hurray!</strong> <span class="alerttext">sometext</span></div>'
            );
        $(".alerttext").last().text("Connection Established");
    }
    // call getallqueues
    getallqueues(event);
})

ipc.on("queueinfo", function(event, data){
    ////console.log("QueueInfo has come",data)
    $("#alertsection").html(
        '<div class="alert alert-info alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Queue Stats!</strong> <span class="alerttext">sometext</span></div>'
        );
    $(".alerttext").last().text(data);
})
ipc.on("noMessages", function(event, data){
    alert(data);
})

ipc.on("barProgress", function(event, data){
    ////console.log(data);
    $("#barprogress").attr('hidden', false);
    $("#barprogress").html('<div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div>')
    $(".progress-bar").attr('style', data);
    $(".progress-bar").last().text(data.replace( /^\D+/g, ''));
    // disable alert box
    $("#alertsection").html("");
})

ipc.on("getqueueslist", function(event, data){
    $("#sqsqueue").empty();
    if(typeof(data)=='undefined')
    {
        $("#alertsection").html(
            '<div class="alert alert-danger alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Error!</strong> <span class="alerttext"></span></div>'
            );
            $(".alerttext").last().text("There are no Queues to list !!!");
    }
    else {
        $("#sqsqueue").append('<option class="queue">Select Queue</option>');
        data.forEach((e,index) => {
            $("#sqsqueue").append(
              '<option class="queue">Select Queue</option>'
            );
            $(".queue").last().text(e.slice(e.lastIndexOf("/") + 1).toString());
          });
          $("#selectqueue").removeAttr('hidden');
          $("#noofmessages").removeAttr('hidden');
          $("#actionbtn").removeAttr('hidden');
          $("#filter").removeAttr('hidden');
    }
})

ipc.on("finalList", function(event, data){
    //console.log("Final List has come",data)
    $("#alertsection").html(
        '<div class="alert alert-success alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Queue Stats!</strong> <span class="alerttext">sometext</span></div>'
        );
    $(".alerttext").last().text(data);
})

no_of_times_called = 1

ipc.on('listqueue', function(event, response){
            
            // Initialize the string buffer
            stringbuffer = "";
            stringbuffer+="\n-----------------------------------"
            stringbuffer+="\nQueue Name :"+sqsqueue.value
            stringbuffer+="\nRegion     :"+region.value
            stringbuffer+="\nprofile    :"+profile.value
            if (filter.value != ""){
                stringbuffer+="\nfilter     :"+filter.value
                stringbuffer+="\nMessages Matching Filters: "+response['messages'].length 
            }
            stringbuffer+="\nTotal Messages in the Queue: "+response['stats']['TotalMessages']
            stringbuffer+="\nMessages On Transit: "+response['stats']['OnTransit']
            stringbuffer+="\nNo of Messages requested: "+document.querySelector("#msgno").value
            stringbuffer+="\n-----------------------------------"
            

            resetAll()

            if(response['messages'].length === 0)
            {
                
                stringbuffer+="\n There are no messages matching the filter criteria or the queue is empty"
            }
            else
            {
                let data = response['messages'];

                data.forEach((e, index) => {
                    msgcount=index+1
                    //console.log(e);
                    //console.log("Message Count:"+msgcount)
                    stringbuffer+="\n-----------------------------------"
                    stringbuffer+="\nMessage Number => "+msgcount
                    stringbuffer+="\n-----------------------------------\n"
                    // outputdata.push(JSON.parse(e.Body).Message);
                    ////console.log(JSON.stringify(outputdata, replacer))
                    //console.log(typeof(e));
                    //console.log(e); // it is always a String
            
                    if (IsJsonString(e.Body) || typeof(e.Body) == 'object'){
                        ////console.log(JSON.stringify(JSON.parse(e.Body), undefined, 2))
                        stringbuffer+="\nSender ID: "+e.Attributes.SenderId
                        stringbuffer+="\nMessage ID: "+e.MessageId
                        stringbuffer+="\nMessage Body: "+JSON.stringify(JSON.parse(e.Body), undefined, 2)
                        stringbuffer+="\n-----------------------------------"
                        stringbuffer+="\n\n"
                    }
                    else{
                        //console.log(e.Body)
                        stringbuffer+="\nSender ID: "+e.Attributes.SenderId
                        stringbuffer+="\nMessage ID: "+e.MessageId
                        stringbuffer+="\nMessage Body: "+e.Body
                        stringbuffer+="\n-----------------------------------"
                        stringbuffer+="\n\n"
                    }
                
                });
            }   

                outbox.textContent=stringbuffer

            // oldcontent=outbox.textContent
            

})



//To validate if Message is a JSON data
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function replacer(key, value) {
    //console.log(value.toString())
    return value.toString()
    //return value.toString().replace(/[^\w\s]/gi, '');
}


// //console.log(ipc.sendSync('synchronous-message', 'ping')) // prints "pong"

// ipc.on('asynchronous-reply', (event, arg) => {
//   //console.log(arg) // prints "pong"
// })
// ipc.send('asynchronous-message', 'ping')

$('div.alert.close').on('click', function() {
    //console.log("clicked")
    $(this).parent().alert('close'); 
 });

 $('#clearconsole').on('click',function(){
    outbox.textContent=""
    location.reload()
 })


  
 $('#copymsg').on('click',function(){

    const copyText = document.getElementById("outbox").textContent;

    if(copyText){
        const textArea = document.createElement('textarea');
        textArea.textContent = copyText;
        document.body.append(textArea);
        textArea.select();
        document.execCommand("copy");

        $("#alertsection").html(
            '<div class="alert alert-info alert-dismissible" id="exception"><button type="button" class="close" data-dismiss="alert" id="closealert">&times;</button><strong>Info!</strong> <span class="alerttext"></span></div>'
            );
            $(".alerttext").last().text("Content Copied to the clipboard");
    }
    else {
        alert("There is no messages to copy right now")
    }
 })
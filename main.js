const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const AWS = require('@aws-sdk/client-sqs');
const AWS_EC2 = require('@aws-sdk/client-ec2');
const { StaleIpPermission } = require('@aws-sdk/client-ec2');

let mainWindow;
let QURL;

function startTimer() {
  timer.start();
  setTimeout(stopTimer, 60);
}

function stopTimer() {
  timer.stop();
}

function createWindow() {

  // Get the screen size
  const { screen } = require('electron');
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    // set the height to 80% of the screen height
    height: 767,
    // set the width to 80% of the screen width
    width: 1040,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: !app.isPackaged,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Open URLS external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // config.fileProtocol is my custom file protocol
    if (url.startsWith(config.fileProtocol)) {
      return { action: 'allow' };
    }
    // open url in a browser and prevent default
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function onLoad() {
  //console.log('server process is ready');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  onLoad();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
ipcMain.on('connectivity', function (event, region, profile) {
  try {
    const sqs = new AWS.SQS({ region: region, profile: profile });
    var params = {
      MaxResults: 1,
    };
    sqs.listQueues(params, function (err, data) {
      if (err) {
        mainWindow.webContents.send('exception', err); // Send the response to the renderer
      } // an error occurred
      else {
        mainWindow.webContents.send('connectivity', data.$metadata);
      } // successful response
    });
  } catch (error) {
    mainWindow.webContents.send('exception', err); // Send the response to the renderer
  }
});

ipcMain.on('getqueueslist', function (event, region, profile) {
  try {
    const sqs = new AWS.SQS({ region: region, profile: profile });
    var params = {
      MaxResults: 1000,
    };
    sqs.listQueues(params, function (err, data) {
      if (err) {
        //console.log('Error in SQS GetQueueURL');
        mainWindow.webContents.send('exception', err); // Send the response to the renderer
      } // an error occurred
      else {
        ////console.log(data);
        mainWindow.webContents.send('getqueueslist', data.QueueUrls);
      } // successful response
    });
  } catch (error) {
    //console.log('Inside getqueueslist Catch');
    mainWindow.webContents.send('exception', err); // Send the response to the renderer
  }
});

ipcMain.on('queueStats', function (event, region, profile) {

});
ipcMain.on('listqueue', function (event, msgno, sqsqueue, region, profile, filter) {
  var NoOfMessages;
  var payload;
  try {
    const sqs = new AWS.SQS({ region: region, profile: profile });
    var queuename = sqsqueue.replace(/\s+/g, ' ').trim();
    var params = {
      QueueName: queuename,
    };
    sqs.getQueueUrl(params, function (err, data) {
      if (err) {
        //console.log('Error in SQS GetQueueURL');
        mainWindow.webContents.send('exception', err); // Send the response to the renderer
      } else {
        QURL = data.QueueUrl;
        var para = {
          AttributeNames: ['All'],
          MaxNumberOfMessages: 10,
          MessageAttributeNames: ['All'],
          QueueUrl: QURL,
          WaitTimeSeconds: 20, // Long Polling Enabled
        };
        try {
          sqs.getQueueAttributes(para, async function (err, data) {
            if (err) {
              //console.log('Error Getting Queue Attributes');
              mainWindow.webContents.send('exception', err); // Send the response to the renderer
            } else {
              NoOfMessages = data.Attributes.ApproximateNumberOfMessages;
              approx_notvisible = data.Attributes.ApproximateNumberOfMessagesNotVisible;
              message = 'Approximate Messages Can be read/Visible:' + NoOfMessages + '\nApproximate Messages In Transit/Not Visible:' + approx_notvisible;
              mainWindow.webContents.send('queueinfo', message); // Send the response to the renderer
              // wait for 2 seconds
              await new Promise(r => setTimeout(r, 2000));

              var stats = {
                "OnTransit": approx_notvisible,
                "TotalMessages": NoOfMessages
              };


              //  Case1: If the queue is empty
              if (parseInt(NoOfMessages) == 0 && approx_notvisible == 0) {
                message = 'Queue must be empty, No messages in Transit or available state';
                mainWindow.webContents.send('noMessages', message);
              }

              //  Case2: If the queue has messages but not visible
              else if (parseInt(NoOfMessages) == 0 && approx_notvisible > 0) {
                message = 'Your messages are in Transit state : ' + approx_notvisible + '\n\nYou need to wait until the Default visibilty timeout, Default 30s';
                mainWindow.webContents.send('noMessages', message);
              }

              //  Case3: If the queue has messages less than the requested number
              else if (parseInt(NoOfMessages) < parseInt(msgno)) {

                // set the message number to the number of messages in the queue
                msgno = parseInt(NoOfMessages);

                var TotalReceivedCount = 0;
                payload = {};

                // Add the Approx Not Visible count and the visible messages count to the payload
                payload['stats'] = stats;
                payload['messages'] = [];

                var barWidth = 'width: 0%';
                while (parseInt(TotalReceivedCount) < parseInt(NoOfMessages)) {
                  TotalReceivedCount += 1;
                  try {
                    const data = await sqs.receiveMessage(para);
                    if (data) {
                      barWidth = 'width: ' + (payload['messages'].length / msgno) * 100 + '%';
                      mainWindow.webContents.send('barProgress', barWidth);
                      
                      data.Messages.forEach((e, index) => {
                        payload['messages'].push(data.Messages[index]);
                      });
                      if (payload['messages'].length == parseInt(NoOfMessages)) {
                        message = 'Queue has less messages than you asked, So printing all the messages available.';
                        mainWindow.webContents.send('finalList', message);
                        barWidth = 'width: 100%';
                        mainWindow.webContents.send('barProgress', barWidth);

                        // Applying the filter
                        if (filter != '') {
                          var filteredPayload = [];
                          payload['messages'].forEach((e, index) => {
                            if (payload['messages'][index].Body.includes(filter)) {
                              filteredPayload.push(payload['messages'][index]);
                            }
                          });
                          payload['messages'] = filteredPayload;
                        }
                        console.log('Payload',payload);
                        mainWindow.webContents.send('listqueue', payload);
                        TotalReceivedCount = 10;
                        return;
                      } else {
                        //console.log('Enters Else');
                      }
                    }
                  } catch (error) {
                    mainWindow.webContents.send('exception', err); 
                    break;
                  }
                }
              }

              // Case 4: If the queue has messages more than the requested number
              else {
                var TotalReceivedCount = 0;
                payload = {};

                payload['stats'] = stats;
                payload['messages'] = [];

                // payload.push(stats);
                var barWidth = 'width: 0%';
                while (parseInt(TotalReceivedCount) < parseInt(NoOfMessages)) {
                  TotalReceivedCount += 1;
                  try {
                    const data = await sqs.receiveMessage(para);
                    if (data) {
                      barWidth = 'width: ' + (payload['messages'].length / msgno) * 100 + '%';
                      mainWindow.webContents.send('barProgress', barWidth);
                      data.Messages.forEach((e, index) => {
                        payload['messages'].push(data.Messages[index]);
                      });
                      if (payload['messages'].length >= msgno) {
                        barWidth = 'width: 100%';
                        mainWindow.webContents.send('barProgress', barWidth);
                        // Applying the filter
                        if (filter != '') {
                          var filteredPayload = [];
                          payload['messages'].forEach((e, index) => {
                            // console.log("Searching for: " + filter + " in " + payload[index].Body);
                            if (payload['messages'][index].Body.includes(filter)) {
                              filteredPayload.push(payload['messages'][index]);
                            }else{
                              // console.log('Not a match')
                            }
                          });
                          payload['messages'] = filteredPayload;
                        }

                        mainWindow.webContents.send('listqueue', payload);
                        
                        TotalReceivedCount = 10;
                        return;
                      } else {
                        //console.log('Enters Else');
                      }
                    }
                  } catch (error) {
                    mainWindow.webContents.send('exception', "Unexpected Error has occured. Possibly due to less number of messages"); // Send the response to the renderer
                    break;
                  }
                } //Close While loop
              }
            }
          });
        } catch (error) {
          mainWindow.webContents.send('exception', error); // Send the response to the renderer
        }
      }
    });
  } catch (error) {
    mainWindow.webContents.send('exception', err); // Send the response to the renderer
  }
});

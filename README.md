# QueueB - A Cloud Queue Manager
![Apache license](https://img.shields.io/badge/License-Apache%202.0-greeb.svg)![Version](https://img.shields.io/badge/version-1.0.0-blue)


QueueB is created with a motive to provide a client application to browse and manage Queue services of various cloud providers. 

To begin with, the application is built to browse and manage AWS SQS queues. The application is built on Electron and Bootstrap and is designed to be self-hosted. 

The application is built to help engineers and developers to easily browse and manage their AWS SQS queues.


### Features

- Browse and manage your AWS SQS queues right from your desktop
- Self hosted, no need to share your AWS credentials with any third party
- Use your own AWS credentials to access your SQS queues - Profile based
- Unlimited number of messages can be downloaded/fetched from the queue
- Choose the number of messages to be fetched in a single request
- Filter the messages and consume only the messages you are interested in using keywords or regular expressions(TODO)
- Delete messages from the queue (TODO)
- Search for a text in the rich text message body
- Copy the message body to clipboard


### Installation
&nbsp;

You can install the application using the installer available in the [releases] section. The installer is available for Windows, Mac and Linux.  or you can build the application from the source code.

**Releases**
1. Download the installer from the [releases] section
2. Install the application
3. Run the application from the installed location

&nbsp;

**Build from Source**
1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm start` to start the application
4. You can also package the application using `npm run package-win` or `npm run package-mac` or `npm run package-linux` based on your OS
5. The packaged application will be available in the `dist` folder
6. Run the application from the executable file
7. You can also install the application using the installer generated in the `dist` folder


### How to use

**Connect to your AWS**

1. Open the application
2. Choose the `region` from the dropdown
3. Enter the name of your aws `profile` if you have multiple profiles in your `~/.aws/credentials` file (or) leave it blank if you have only one profile - Default profile will be used
4. Click on `connect` button

**Browse the queues**

1. Once connected, you will see the list of queues available in your AWS account - choose the queue from the dropdown
2. Enter the `number of messages` you want to fetch in a single request - Default is 10
3. Enter the `filter` text to filter the messages based on the text in the message body
4. Click on `browse` button to fetch the messages from the queue
   
**View the messages**
1. You will see the list of messages fetched from the queue - on the right side - Rich text message body will be displayed


### TODO

- Implement delete message functionality
- Support of filtering messages using regular expressions
- Ability to send messages to the queue
- Feature to delete messages from the queue

### License
Apache 2.0

### For Contributions and Issues
Please raise an issue or create a pull request for any feature requests or issues you find in the application. 

### Leave a star
:star: :star: :star: :star: :star:
Please star the repository if you like the application. It will help me to keep motivated and improve the application further.
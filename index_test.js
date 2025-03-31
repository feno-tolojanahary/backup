const cron = require("node-cron");

// running every day for default
const task = cron.schedule('* * * * *', () => { 
    console.log("call every minute");
})

task.start();

function yourScript() {
  // Your main code goes here
  console.log('Running the Node.js script...');
  
  // Use setTimeout to repeat the script after a delay
  setTimeout(yourScript, 5000);
}

yourScript();  // Start the script

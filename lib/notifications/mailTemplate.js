function jobFailedTemplate({ jobName, date }) {
  return {
    subject: "Backup Failed",
    text: `Hello,
 
We wanted to inform you that your scheduled backup has failed.

Backup Name: ${jobName}
Date: ${date}

Please check your backup system or logs to identify the issue and run the backup again if necessary.

Backup Notification Service`
  };
}

module.exports = { jobFailedTemplate };

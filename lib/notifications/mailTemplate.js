function backupFailedTemplate({ backupName, backupDate }) {
  return {
    subject: "Backup Failed",
    text: `Hello,
 
We wanted to inform you that your scheduled backup has failed.

Backup Name: ${backupName}
Date: ${backupDate}

Please check your backup system or logs to identify the issue and run the backup again if necessary.

Backup Notification Service`
  };
}

module.exports = { backupFailedTemplate };

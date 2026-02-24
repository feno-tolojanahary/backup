DONE:
Operating system on linux:
- Backup mongodb database
- send backup to wasabi
- set up backup retention
- get list of database backup
- delete specified backup (ssh, wasabi) 
- store all configuration inside a file

TODO:
- add a log of backup
- get list of backup; add an id of each backup
- delete specified backup
- restore specified backup  
- restore specified backup from ssh

WASABI
- synchronise backup into local
- remove old backup data    
- list all on wasabi

SSH:
- synchronise info into local
- send backup to ssh
- list all on ssh
- specify a backup to restore

GLOBAL:
- Assure that the backup log is synchronised with the wasabi and on the server


LOG/INTERFACE:
- (impr) list all the configurations
- find a way to synchronise the log of local data with the online

BACKUP MANAGEMENT:
- create an archive file
-    RESTORE:
    - Possibility of restoring a specific selected version of database from wasabi or cloud

- add a date for the process log
- add a specific name of the output backup (--tag)
- Add a specific scheduling time for backup
- add a specific name of the output backup (--tag)
-----------
IN PROGRESS

SECURITY:
- encrypting database

NOTIFICATION:
- Add an history of successfull or failed backup

BACKUP:
- Support of local storage
- Synchronisation of wasabi file
- Support of multiple hosts

- create a job: check source, check destination

- granularity retention

- add a local type of the destination storage

- Config management improvement

---> Add a dashboard

S3 file - synchronisation:
- replication between two bucket (cron job)
- have local data replication (multiple storage file destination)


-----------
LATER

BACKUP MANAGEMENT:
- Make the config file too friendly

WASABI:
s3:
- migrate sdk2 to sdk3
- lock uploaded object

SSH:
- define a quota of disk usage and delete old
    
GLOBAL:
- Health monitoring, check all status of server connexion

LOG/INTERFACE:
- add a command for local config
- add an error handling

LATER 2:
- A feature that duplicate the bucket in one wasabi into an another
- Role based access management
- Save multiple type of data for an enterprise

FINDING SOLUTION:
- Find a solution if it's possible to make an instant backup so we make a backup if the user try to add a script to the database

---------- 

TO DO:

USER MANAGEMENT:
SSO - integration
OIDC

SECURITY:
- Make data immutable

DUMP and RESTORE:
- Encrypt backup before uploading using AES-256 or GPG.
- Integrity check: Generate a checksum per backup

BACKUP:
- Add a prevision of storage usage
- Exclude table for backup

APP MONITORING:
- detect if the application is running correctly
    - send a notification if the app is down
- If possible track cpu usage and detect which request is consuming ressources

NEXT MOVE:
- Add a system tools administration

GOAL:   
- Security of the data of an application
-> add a incremental backup for the app
- Monitore the app, which is launched in pm2 and served by Nginx
- Send an alert if the cpu usage is up
- Identify which part of the app has trigger the cpu or the ram

- Find a way to make an incremental backup using package

- Create an alternative of pm2

DATABASE:
- Redis
- InfluxDB

Futur:
- Suggest an improvement if the app is a MongoDB: an usage of index and key
- Generate a server architecture


Suggest a securisation for the app:
- Build a ready 

FUTUR GOOD FEATURE:
- Detect backup anomalie
- Cost tracking
- Self backup


DIFFICULTY FOR AN ENTERPRISE:
- Having track or their running systeme for simple mern app
- Backup of database and file

- Monitoring systeme - notification
- Scan anomalie on a server
- Scan anomalie in a app server, integration
- Performance of app
Operating system on linux:
- Backup mongodb database

- send backup to wasabi

- set up backup retention

- get list of database backup


add COMMAND:
- delete specified backup (ssh, wasabi) 

LITLE FEATURE:
- store all configuration inside a file

TODO:
- add a log of backup
- get list of backup; add an id of each backup
- delete specified backup
- restore specified backup  
- restore specified backup from ssh


WASABI:
- synchronise backup into local
- remove old backup data    
- list all on wasabi
s3:
- migrate sdk2 to sdk3

SSH:
- synchronise info into local
- send backup to ssh
- list all on ssh
- define a quota of disk usage and delete old
- specify a backup to restore

GLOBAL:
- Assure that the backup log is synchronised with the wasabi and on the server
- Health monitoring, check all status of server connexion


LOG/INTERFACE:
- add a date for the process log
- (impr) list all the configurations
- find a way to synchronise the log of local data with the online


BACKUP MANAGEMENT:
- create an archive file
-    RESTORE:
    - Possibility of restoring a specific selected version of database from wasabi or cloud

- Add a specific scheduling time for backup
- add a specific name of the output backup (--tag)


DUMP and RESTORE:
- Encrypt backup before uploading using AES-256 or GPG.
- Integrity check: Generate a checksum per backup


- detect if the application is running correctly
    - send a notification if the app is down
- If possible track cpu usage and detect which request is consuming ressources

SECURITY:
- encrypting database


NEXT MOVE:
- Add a system tools administration

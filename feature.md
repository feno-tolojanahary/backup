Operating system on linux:
- Backup mongodb database

- send backup to wasabi

- set up backup retention
- detect if the application is running correctly
    - send a notification if the app is down
- If possible track cpu usage and detect which request is consuming ressources

- get list of database backup

RESTORE:
- Possibility of restoring a specific selected version of database from wasabi or cloud

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

SSH:
- synchronise info into local
- send backup to ssh
- list all on ssh
- define a quota of disk usage and delete old
- specify a backup to restore


1 databasename wasabi
restore 1 --to databasename
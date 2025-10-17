Operating system on linux:
- Backup mongodb database

- send backup to wasabi
- send backup to ssh

- set up backup retention
- detect if the application is running correctly
    - send a notification if the app is down
- If possible track cpu usage and detect which request is consuming ressources

- get list of database backup

RESTORE:
- Possibility of restoring a specific selected version of database from wasabi or cloud


LITLE FEATURE:
- store all configuration inside a file

TODAY:
- add a log of backup
- get list of backup; add an id of each backup
- delete specified backup
- restore specified backup  



1 databasename wasabi
restore 1 --to databasename
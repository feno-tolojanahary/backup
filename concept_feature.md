ENTITY STRUCTURE:
proposed of the new data structure:
    backup ID
    date
    size
    encryption: yes/no
    compression type
    integrity checksum
    storage locations (local, wasabi, ssh)
    version tag



PROPOSITIONS:
More advanced retention policies:

    Keep daily backups for 7 days

    Keep weekly backups for 4 weeks

    Keep monthly backups for 12 months



Allow limiting:
    bandwidth
    CPU
    disk parallelism
    Example:
        backup-cli backup --max-bandwidth 2MB/s


        
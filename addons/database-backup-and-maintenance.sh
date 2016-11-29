#!/bin/bash
#
# Database maintenance and backup
#
# - Move entries older than a month from locationlog to locationlog_archive
# - Optimize tables on sunday
# - compressed mysqldump to $BACKUP_DIRECTORY, rotate and clean
# - archive locationlog_archive entries older than a year the first day of each month
#
# Copyright (C) 2005-2016 Inverse inc.
#
# Author: Inverse inc. <info@inverse.ca>
#
# Licensed under the GPL
#
# Installation: make sure you have locationlog_archive (based on locationlog) and edit DB_PWD to fit your password.

NB_DAYS_TO_KEEP_DB=7
NB_DAYS_TO_KEEP_FILES=7
DB_USER=$(perl -I/usr/local/pf/lib -Mpf::db -e 'print $pf::db::DB_Config->{user}');
DB_PWD=$(perl -I/usr/local/pf/lib -Mpf::db -e 'print $pf::db::DB_Config->{pass}');
DB_NAME=$(perl -I/usr/local/pf/lib -Mpf::db -e 'print $pf::db::DB_Config->{db}');
DB_HOST=$(perl -I/usr/local/pf/lib -Mpf::db -e 'print $pf::db::DB_Config->{host}');
PF_DIRECTORY='/usr/local/pf/'
BACKUP_DIRECTORY='/root/backup/'
BACKUP_DB_FILENAME='packetfence-db-dump'
BACKUP_PF_FILENAME='packetfence-files-dump'
ARCHIVE_DIRECTORY=$BACKUP_DIRECTORY
ARCHIVE_DB_FILENAME='packetfence-archive'
PERCONA_XTRABACKUP_INSTALLED=0
BACKUPRC=1

# For replication
ACTIVATE_REPLICATION=0
REPLICATION_USER=''
NODE1_HOSTNAME=''
NODE2_HOSTNAME=''
NODE1_IP=''
NODE2_IP=''

# Create the backup directory
if [ ! -d "$BACKUP_DIRECTORY" ]; then
    mkdir -p $BACKUP_DIRECTORY
    echo -e "$BACKUP_DIRECTORY , created. \n"
else
    echo -e "$BACKUP_DIRECTORY , folder already created. \n"
fi

PF_USED_SPACE=`du -s $PF_DIRECTORY --exclude=logs --exclude=var | awk '{ print $1 }'`
BACKUPS_AVAILABLE_SPACE=`df --direct $BACKUP_DIRECTORY | awk 'NR == 2 { print $4  }'`

if ((  $BACKUPS_AVAILABLE_SPACE > (( $PF_USED_SPACE / 2 )) )); then 
    # Backup complete PacketFence installation except logs
    current_tgz=$BACKUP_DIRECTORY/$BACKUP_PF_FILENAME-`date +%F_%Hh%M`.tgz
    if [ ! -f $BACKUP_DIRECTORY$BACKUP_PF_FILENAME ]; then
        tar -czf $current_tgz $PF_DIRECTORY --exclude=$PF_DIRECTORY'logs/*' --exclude=$PF_DIRECTORY'var/*' --exclude=$PF_DIRECTORY'.git/*'
        echo -e $BACKUP_PF_FILENAME "have been created in  $BACKUP_DIRECTORY \n"
        find $BACKUP_DIRECTORY -name "packetfence-files-dump-*.tgz" -mtime +$NB_DAYS_TO_KEEP_FILES -print0 | xargs -0r rm -f
        echo -e "$BACKUP_PF_FILENAME older than $NB_DAYS_TO_KEEP_FILES days have been removed. \n"
    else
        echo -e $BACKUP_DIRECTORY$BACKUP_PF_FILENAME ", file already created. \n"
    fi
else 
    echo "ERROR: There is not enough space in $BACKUP_DIRECTORY to safely backup files. Skipping the backup." >&2
fi 

# Is the database run on the current server?
if [ -f /var/run/mysqld/mysqld.pid ] || [ -f /var/run/mariadb/mariadb.pid ]; then

    /usr/local/pf/addons/database-cleaner.pl --table=radacct --date-field=acctstarttime --older-than="1 WEEK" --additionnal-condition="acctstoptime IS NOT NULL"
    
    /usr/local/pf/addons/database-cleaner.pl --table=radacct_log --date-field=timestamp --older-than="1 WEEK"

    /usr/local/pf/addons/database-cleaner.pl --table=locationlog_archive --date-field=end_time --older-than="1 MONTH"
    
    # Check to see if Percona XtraBackup is installed
    if hash innobackupex 2>/dev/null; then
        echo -e "Percona XtraBackup is available. Will proceed using it for DB backup to avoid locking tables and easier recovery process. \n"
        PERCONA_XTRABACKUP_INSTALLED=1
    fi

    BACKUPS_AVAILABLE_SPACE=`df --direct $BACKUP_DIRECTORY | awk 'NR == 2 { print $4  }'`
    MYSQL_USED_SPACE=`du -s /var/lib/mysql | awk '{ print $1 }'`
    if (( $BACKUPS_AVAILABLE_SPACE > (( $MYSQL_USED_SPACE /2 )) )); then 
        if [ $PERCONA_XTRABACKUP_INSTALLED -eq 1 ]; then
            find $BACKUP_DIRECTORY -name "$BACKUP_DB_FILENAME-innobackup-*.xbstream.gz" -mtime +$NB_DAYS_TO_KEEP_DB -delete
            echo "----- Backup started on `date +%F_%Hh%M` -----" >> /usr/local/pf/logs/innobackup.log
            innobackupex --user=$DB_USER --password=$DB_PWD  --no-timestamp --stream=xbstream  /tmp/ 2>> /usr/local/pf/logs/innobackup.log | gzip - > $BACKUP_DIRECTORY/$BACKUP_DB_FILENAME-innobackup-`date +%F_%Hh%M`.xbstream.gz
            tail -1 /usr/local/pf/logs/innobackup.log | grep 'completed OK!'
            BACKUPRC=$?
            if (( $BACKUPRC > 0 )); then 
                echo "innobackupex was not successful." >&2
            else
                touch /usr/local/pf/var/run/last_backup
            fi
        else
            find $BACKUP_DIRECTORY -name "$BACKUP_DB_FILENAME-*.sql.gz" -mtime +$NB_DAYS_TO_KEEP_DB -delete
            current_filename=$BACKUP_DIRECTORY/$BACKUP_DB_FILENAME-`date +%F_%Hh%M`.sql.gz
            mysqldump --opt -h $DB_HOST -u $DB_USER -p$DB_PWD $DB_NAME --ignore-table=$DB_NAME.locationlog_archive --ignore-table=$DB_NAME.iplog_archive | gzip > ${current_filename}
            BACKUPRC=$?
            if (( $BACKUPRC > 0 )); then 
                echo "mysqldump returned  error code: $?" >&2
            else 
                touch /usr/local/pf/var/run/last_backup
            fi
        fi
    else 
        echo "There is not enough space in $BACKUP_DIRECTORY to safely backup the database. Skipping backup." >&2
    fi
fi

# Replicate the db backups between both servers
if [ $ACTIVATE_REPLICATION == 1 ]; then
  if [ $HOSTNAME == $NODE1_HOSTNAME ]; then
    replicate_to=$NODE2_IP
  elif [ $HOSTNAME == $NODE2_HOSTNAME ]; then
    replicate_to=$NODE1_IP 
  else
    echo "Cannot recognize hostname. This script is made for $NODE1_HOSTNAME and $NODE2_HOSTNAME. Exiting" >&2
    exit 1
    fi;
  eval "rsync -auv -e ssh --delete --include '$BACKUP_DB_FILENAME*' --exclude='*' $BACKUP_DIRECTORY $REPLICATION_USER@$replicate_to:$BACKUP_DIRECTORY"
fi

exit $BACKUPRC


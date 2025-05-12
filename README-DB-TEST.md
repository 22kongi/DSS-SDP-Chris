# Database Connection Test Guide

This document provides step-by-step instructions to test your PostgreSQL database connection and verify the required tables for the secure wellbeing blog.

## Prerequisites

1. PostgreSQL installed and running (either locally or via Docker)
2. Node.js installed
3. Project dependencies installed (`npm install`)
4. Properly configured `.env` file

## Step 1: Verify PostgreSQL is running

### If using local PostgreSQL installation

Check if PostgreSQL is running on your system:

```bash
# For Linux/Mac
sudo service postgresql status
# or
pg_ctl status -D /path/to/your/postgresql/data

# For Windows (via Command Prompt as Administrator)
sc query postgresql
```

If not running, start it:

```bash
# For Linux/Mac
sudo service postgresql start

# For Windows
net start postgresql
```

### If using Docker

Check if your PostgreSQL container is running:

```bash
docker ps | grep postgres
```

If the container isn't running, start it:

```bash
docker start your_postgres_container_name
```

Or create a new container if you don't have one:

```bash
docker run --name postgres-db -e POSTGRES_PASSWORD=23Benedict:) -p 5500:5432 -d postgres
```

## Step 2: Run the database check script

```bash
node check-tables.js
```

### Interpreting the results

1. **Successful connection**: You'll see a message confirming connection to PostgreSQL
2. **Table listing**: The script will list all tables in your database
3. **Required tables check**: It will verify if the required tables exist

## Step 3: Creating missing tables (if needed)

If the script shows that required tables are missing, you can create them using the SQL commands provided in the `DATABASE.md` file.

Using psql:
```bash
psql -U postgres -d postgres -p 5500 -f create-tables.sql
```

Or using pgAdmin:
1. Open pgAdmin
2. Connect to your database
3. Open the Query Tool
4. Paste the SQL from DATABASE.md
5. Execute the query

## Step 4: Verify database configuration in your app

Check that your application is using the correct database configuration by reviewing these files:

1. `.env` file - Contains database connection parameters
2. `backend/utils/dbConfig.js` - Contains the database connection pool configuration

## Common Issues and Solutions

### Connection refused (ECONNREFUSED)

- Verify PostgreSQL is running
- Confirm port number is correct (5500 in our case)
- Check if a firewall is blocking the connection

### Authentication failed

- Verify the password in your `.env` file
- Ensure the PostgreSQL user has proper permissions

### Database doesn't exist

- Create the database:
  ```sql
  CREATE DATABASE postgres;
  ```

### Tables don't exist

- Run the SQL commands in DATABASE.md to create the missing tables
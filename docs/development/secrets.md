# Docker Secrets Configuration

This directory contains example templates for Docker secrets used in production.

## Setup Instructions

1. Copy this `secrets.example` directory to `secrets` in the project root:
   ```bash
   cp -r secrets.example secrets
   ```

2. Update the secret files with your actual values:
   - `db_password.txt`: PostgreSQL password
   - `db_user.txt`: PostgreSQL username  
   - `db_name.txt`: PostgreSQL database name

3. Ensure proper file permissions (optional but recommended):
   ```bash
   chmod 600 secrets/*.txt
   ```

## Important Security Notes

- The `secrets/` directory is ignored by git to prevent accidental commits
- In production, consider using external secret management services
- Never commit actual secrets to version control
- Use strong, unique passwords for database access

## Docker Compose Integration

The production `docker-compose.yml` file references these secrets:

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  db_user:
    file: ./secrets/db_user.txt
  db_name:
    file: ./secrets/db_name.txt
```

Services can access these secrets at `/run/secrets/secret_name` inside containers.

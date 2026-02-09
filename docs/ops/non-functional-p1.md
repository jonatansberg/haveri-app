# P1 Non-Functional Runbook

## Data Residency (EU)
- Fly app region: `fra` (`fly.toml` `primary_region`).
- Database: must be provisioned in an EU region.
- Blob storage: must be provisioned in an EU region.

Validation command:
```bash
DATABASE_URL="postgres://..." \\
AZURE_STORAGE_REGION="westeurope" \\
npm run ops:check-residency
```

## Backup and Recovery
Daily backup with 30-day retention:
```bash
DATABASE_URL="postgres://..." ./src/scripts/ops/backup-postgres.sh
```

### Restore drill
1. Restore backup to a temporary database.
2. Run core integrity checks:
```sql
SELECT COUNT(*) FROM incidents;
SELECT COUNT(*) FROM incident_events;
SELECT COUNT(*) FROM follow_ups;
```
3. Verify a sampled incident can be opened in the dashboard and timeline events are present.

Recommended cadence:
- Backups: daily (UTC 02:00).
- Restore drill: weekly.

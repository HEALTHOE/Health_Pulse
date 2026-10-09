# HealthPulse Database

## ER Diagram (Mermaid)

```mermaid
erDiagram
    DISTRICTS ||--o{ BLOCKS : "1-N"
    BLOCKS ||--o{ FACILITIES : "1-N"
    FACILITIES ||--o{ HEALTH_RECORDS : "1-N"
    DISTRICTS ||--o{ USERS : scopes
    BLOCKS ||--o{ USERS : scopes
    INDICATORS ||--o{ INDICATOR_VALUES : computes
    DISTRICTS ||--o{ INDICATOR_VALUES : district_level
    BLOCKS ||--o{ INDICATOR_VALUES : block_level
    FACILITIES ||--o{ INDICATOR_VALUES : facility_level
    INDICATORS ||--o{ ALERTS : triggers
    DISTRICTS ||--o{ ALERTS : area
    BLOCKS ||--o{ ALERTS : area
    USERS ||--o{ DATA_UPLOADS : uploads
    USERS ||--o{ AUDIT_LOGS : acts

    DISTRICTS {
        int id PK
        string name UK
        string code UK
    }
    BLOCKS {
        int id PK
        string name
        string code
        int district_id FK
    }
    FACILITIES {
        int id PK
        string name
        string facility_type
        int block_id FK
    }
    USERS {
        int id PK
        string email UK
        string hashed_password
        string role
        int district_id FK_NULL
        int block_id FK_NULL
        bool is_active
    }
    HEALTH_RECORDS {
        int id PK
        int facility_id FK
        date period
    }
    INDICATORS {
        int id PK
        string code UK
        string name
        float target
        float warning_threshold
        float critical_threshold
    }
    INDICATOR_VALUES {
        int id PK
        int indicator_id FK
        date period
        string level
        float numerator
        float denominator
        float value_NULL
    }
    ALERTS {
        int id PK
        int indicator_id FK_NULL
        string severity
        string status
        float current_value
        float threshold
        date period_NULL
    }
    DATA_UPLOADS {
        int id PK
        string filename
        int uploaded_by FK_NULL
        int total_rows
        int valid_rows
        int invalid_rows
        string status
    }
    AUDIT_LOGS {
        int id PK
        int user_id FK_NULL
        string action
        string resource
        datetime timestamp
    }
```

## Tables

| Table | Purpose | Important fields / constraints |
|-------|---------|-------------------------------|
| `districts` | District master | `name` UNIQUE, `code` UNIQUE |
| `blocks` | Block master under a district | UNIQUE(`district_id`,`name`), FK → districts CASCADE |
| `facilities` | PHC/CHC/SC under a block | UNIQUE(`block_id`,`name`), FK → blocks CASCADE |
| `users` | Login + RBAC scope | `email` UNIQUE, `role` enum ADMIN/DHO/BLOCK, nullable `district_id`/`block_id`, `is_active` |
| `health_records` | Raw monthly HMIS numerators/denominators per facility | UNIQUE(`facility_id`,`period`), `period` = first day of month; counts ≥ 0 |
| `indicators` | Central registry (formula + thresholds live here, never frontend) | `code` UNIQUE, `target`, `warning_threshold`, `critical_threshold`, `direction` HIGHER/LOWER_IS_BETTER |
| `indicator_values` | Cached computed values per period/level | UNIQUE(`indicator_id`,`period`,`level`,`district_id`,`block_id`,`facility_id`); aggregate numerators then divide |
| `alerts` | Threshold + persistence alerts | `severity` INFO/WARNING/CRITICAL, `status` ACTIVE/ACK/RESOLVED, `period`, timestamps |
| `data_uploads` | Upload audit per file | `total/valid/invalid_rows`, `status` COMPLETED/PARTIAL/FAILED, `error_summary` |
| `audit_logs` | Who did what | `user_id`, `action`, `resource`, `timestamp` |

## Relationships

- District 1-N Block 1-N Facility 1-N HealthRecord (facility has many monthly rows).
- User scope: ADMIN (`district_id=NULL, block_id=NULL`), DISTRICT_HEALTH_OFFICER (`district_id` set), BLOCK_OFFICER (`district_id` + `block_id` set).
- IndicatorValue.level ∈ FACILITY/BLOCK/DISTRICT determines which of `district_id/block_id/facility_id` is set.

## Migrations

Tables are created via `app.database.init_db()` (`Base.metadata.create_all`)
for dev/demo. **Recommended:** add Alembic when time permits for versioned
migrations in evaluation/production. Ask before switching — API stays the same.

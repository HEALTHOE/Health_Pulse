# HealthPulse

## District Health Monitoring & Analytics Dashboard

HealthPulse is a web-based Digital Health analytics platform designed to help district health officials monitor healthcare performance using HMIS-style health data.

The system aggregates, validates, processes, and analyzes health indicators at district and block levels. It provides interactive dashboards, trend analysis, performance comparisons, underperformance detection, and alerts to support data-driven healthcare planning and decision-making.

---

## Problem Statement

District health officials often need to analyze large amounts of healthcare data to identify underperforming areas and monitor key health indicators.

HealthPulse addresses this problem by providing a centralized dashboard that:

- Aggregates HMIS-style health data
- Monitors important healthcare indicators
- Provides district and block-level drill-down
- Identifies underperforming indicators
- Tracks trends over time
- Generates alerts for critical performance issues
- Supports data-driven decision-making

---

## Objectives

1. Build a centralized health analytics platform.
2. Process and validate HMIS-style healthcare data.
3. Calculate standardized health indicators.
4. Monitor district and block-level performance.
5. Identify underperforming areas.
6. Provide trend and comparative analysis.
7. Generate alerts based on predefined thresholds.
8. Implement secure authentication and role-based access.
9. Maintain data quality and auditability.

---

## Key Features

### Data Management
- CSV/Excel health-data upload
- Data validation
- Missing-value detection
- Duplicate detection
- Range and schema validation
- ETL pipeline

### Health Analytics
- Health indicator calculation
- KPI monitoring
- Trend analysis
- District comparison
- Block comparison
- Health-performance score

### Monitoring
- Underperformance detection
- Threshold-based alerts
- Persistent underperformance detection
- Alert acknowledgement and resolution

### Dashboard
- Interactive KPI cards
- Health indicator charts
- District-level dashboard
- Block-level drill-down
- Indicator-specific analytics
- Interactive filters
- Optional geographic visualization

### Security
- JWT authentication
- Password hashing
- Role-based access control
- Protected APIs
- Audit logging

---

## Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts / Chart.js
- Leaflet

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Pandas

### Database
- PostgreSQL

### Authentication
- JWT
- Password hashing

### Development
- Visual Studio Code
- Git
- GitHub

---

## System Architecture

```text
                    HMIS-Style Data
                          |
                          v
                 Data Ingestion Layer
                          |
                          v
                Validation / ETL Layer
                          |
                          v
                    PostgreSQL
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
        Indicator      Analytics     Alert
          Engine        Engine       Engine
              |           |           |
              +-----------+-----------+
                          |
                          v
                     FastAPI
                          |
                          v
                    React Frontend
                          |
                          v
                 HealthPulse Dashboard

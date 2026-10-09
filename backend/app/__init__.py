# HealthPulse backend
# Layer rules:
# - routers/  = API endpoints only (no business logic)
# - schemas/  = Pydantic request/response models
# - models/   = SQLAlchemy models
# - services/ = business logic
# - analytics/= indicator engine, scoring, trends, performance
# - auth/     = JWT, password hashing, RBAC dependencies
# - utils/    = reusable helpers

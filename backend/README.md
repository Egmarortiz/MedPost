## Tech Stack

Front-end: React Native, Emotion CSS library (WebApp if React Native doesn’t)
Back-end: Java, Python
Databases: PostgreSQL
API’s: FastAPI, Trulio SDK API
Additional resources: N8N Automation, Gradle Build Tool, Mermaid.js

## Tech Stack official documentation

PostgreSQL: https://www.postgresql.org/
SQLAlchemy2.0: https://docs.sqlalchemy.org/en/20/index.html#
Python: https://docs.python.org/3/
FastAPI: https://fastapi.tiangolo.com/

## Key design priciples for SQLAlquemy ORM

One-to-Many: One record in a table can be associated with multiple records in another table (e.g., one user can have many posts).
Many-to-Many: Multiple records in one table can be associated with multiple records in another table (e.g., many users can follow many other users). This often involves an intermediary "association table."
One-to-One: One record in a table is exclusively linked to one record in another table (e.g., a user might have one profile).

from sqlalchemy import create_engine, inspect
engine = create_engine("postgresql+psycopg://medpost:ChangeMe123!@127.0.0.1:5432/medpost_demo", future=True)
insp = inspect(engine)
print(insp.get_table_names())

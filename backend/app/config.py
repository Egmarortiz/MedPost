from pydantic import BaseSettings

class Settings(BaseSettings):
    authjwt_secret_key: str = "supersecretkey"

@AuthJWT.load_config
def get_config():
    return Settings()

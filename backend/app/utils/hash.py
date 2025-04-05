from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Kullanıcının şifresini güvenli bir şekilde hash'ler.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Kullanıcının girdiği şifre ile hash'li şifreyi karşılaştırır.
    """
    return pwd_context.verify(plain_password, hashed_password)

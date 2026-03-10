import re

env_local_file = ".env.local"
env_bot_file = "Discord Bot/.env"

def apply_fixes():
    with open(env_local_file, "r") as f:
        local_content = f.read()
    with open(env_bot_file, "r") as f:
        bot_content = f.read()

    # Eğer ipv4 local veya docker network uyumsuzluğu varsa düzeltebiliriz.
    # localhost yerine mac için ana ağ veya docker network kullanılıyor mu kontrol edelim.
    pass

apply_fixes()

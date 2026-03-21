
"""
@app.post("/user/")
async def users (USER_POINT: user_schema):
    user_data = USER_POINT.dict()

    ID_user = []

    for V in range(5):
        numeros_random = random.randint(1, 10)
        ID_user.append(numeros_random)

    user_data["id_user"] = ID_user

    with open ("user.json", "w") as archivo:
        json.dump(user_data, archivo, indent=4)
    
    return {
        "your info:" : user_data
    }
"""
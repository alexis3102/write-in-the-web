import random


# Definimos listas, no conjuntos
consonantes = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z']
vocales = ['a', 'e', 'i', 'o', 'u']

def generar_letra(tipo):
    if tipo == "V":
        return random.choice(vocales)
    elif tipo == "C":
        return random.choice(consonantes)
    else:
        # cualquier otra letra la usa tal cual
        return tipo


def name_estruc():
    nombre = []
    selector = random.randint(1, 3)

    match selector:
        # TRES LETRAS
        case 1:
            estructuras = [
                ["C", "V", "V"],
                ["C", "V", "C"]
            ]
            estructura = random.choice(estructuras)

        # CUATRO LETRAS
        case 2:
            estructuras = [
                ["V", "C", "V", "C"],
                ["C", "V", "C", "V"],
                ["C", "V", "V", "C"]
            ]
            estructura = random.choice(estructuras)

        # CINCO O MÁS LETRAS
        case 3:
            estructuras = [
                ["V", "C", "V", "C", "V"],
                ["C", "V", "C", "C", "V"],
                ["C", "V", "C", "V", "C", "V"]
            ]
            estructura = random.choice(estructuras)

    # Crear el nombre con la estructura
    for tipo in estructura:
        nombre.append(generar_letra(tipo))

    # Unimos las letras y retornamos el nombre capitalizado
    return "".join(nombre).capitalize()

# Probar generando varios nombres


#APELLIDOS

def last_name_people():
    last_name=[]

    last_nama_estruct = [
        ["V", "V", "l"],
        ["V", "V", "r"],
        ["V", "r", "s"],
        ["V", "s", "h"],
        ["y", "V", "r"],
        ["n", "V", "s"],
        ["v", "r", "v", "V"],
        ["n", "V", "n"],
        ["V", "r", "y"],
        ["c", "V", "V"],
        ["v", "V", "r", "n"],
        ["V", "r", "d"],
        ["V", "V", "t"],
        ["V", "l", "V", "s"],
        ["s", "V", "V", "l"],
        ["f", "V", "V", "n"],
        ["r", "V", "n"],
        ["d", "r", "V"],
        ["V", "l", "V"],
        ["V", "r", "t"],
        ["h", "V", "l"],
        ["v", "V", "y"],
        ["V", "l", "V", "n", "d"],
        ["V", "n", "V", "l"],
        ["n", "y", "r", "V"]
    ]
    
    estruct1 = random.choice(last_nama_estruct)
    estruct2 = random.choice(last_nama_estruct)

    estruct = estruct1 + estruct2

    #generae cada letra
    for last_tipo in estruct:
        last_name.append(generar_letra(last_tipo))

    return "".join(last_name).capitalize()


#RAZA

razas = [
    "Humano",
    "Elfo",
    "Enano",
    "Orco",
    "Semielfo",
    "Semiorco",
    "Semi-gato",
    "Semi-perro",
    "Semi-zorro",
    "Semi-lobo",
    "Ángel",
    "Demonio",
    "Hada"
]

pesos = [
    5,  # Humano — muy común
    3,  # Elfo — común, pero menos que el humano
    3,  # Enano — igual que el elfo
    2,  # Orco — un poco menos común
    2,  # Semielfo — mezcla común
    2,  # Semiorco — mezcla moderada
    1,  # Semi-gato — razas exóticas
    1,  # Semi-perro
    1,  # Semi-zorro
    1,  # Semi-lobo
    1,  # Ángel — rara
    1,  # Demonio — rara
    1   # Hada — muy rara
]

def generador_raza():
    La_Raza = []
    La_Raza.append(random.choices(razas, weights=pesos, k=1)[0])    
    return La_Raza

#EDAD

pesos_edad = [2,5,2,1]
eleccion = [1,2,3,4]

def generador_edad():
    EDAD=[]
    contorl1 = random.choices(eleccion, weights=pesos_edad, k=1)[0]
    if contorl1 == 1:
        edad = random.randint(12,16)

    elif contorl1 == 2:
        edad = random.randint(17,20)
        
    elif contorl1 == 3:
        edad = random.randint(21,35)
        
    elif contorl1 == 4:
        edad = random.randint(36,50)
    
    EDAD.append(edad)
    return edad


# ALTURA
alturas = [1.5, 1.6, 1.7, 1.8, 1.9]

def generador_altura():
    selecotor_altura = random.randint(0,4)
    if selecotor_altura == 0:
        control2 = random.randint(0,9)
        estatura =str(alturas[1]) + str(control2)
    
    elif selecotor_altura == 1:
        control2 = random.randint(0,9)
        estatura =str(alturas[1]) + str(control2)
    
    elif selecotor_altura == 2:
        control2 = random.randint(0,9)
        estatura =str(alturas[2]) + str(control2)
    
    elif selecotor_altura == 3:
        control2 = random.randint(0,9)
        estatura =str(alturas[3]) + str(control2)

    elif selecotor_altura == 4:
        control2 = random.randint(0,9)
        estatura =str(alturas[4]) + str(control2)
    
    return  estatura


#PESO

def generador_peso (fuerza):
    if fuerza in range(1,2):
        peso_result = "delgado"
    elif fuerza in range(3,4):
        peso_result = "acletico"
    elif fuerza in range(5):
        peso_result = "robusto"
    else:
        peso_result = "normal"
    
    return peso_result

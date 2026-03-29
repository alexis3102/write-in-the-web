// --- Lógica de la Interfaz ---
const toggleBtn = document.getElementById('toggle-panel-btn');
const closeBtn = document.getElementById('close-panel-btn');
const sidePanel = document.getElementById('chaterest-panel');
const writeContainer = document.querySelector('.write-container');

// Abrir y cerrar panel lateral
toggleBtn.addEventListener('click', () => {
    sidePanel.classList.add('open');
    // Opcional: empujar el contenido principal cuando se abre
    writeContainer.style.marginRight = '400px'; 
});

closeBtn.addEventListener('click', () => {
    sidePanel.classList.remove('open');
    writeContainer.style.marginRight = '0';
});


// --- Conexión con FastAPI ---
const API_URL = 'http://127.0.0.1:8000'; // Asegúrate de que FastAPI corre en este puerto

// Enviar formulario de Write
document.getElementById('write-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('write-title').value;
    const text = document.getElementById('write-text').value;

    try {
        const response = await fetch(`${API_URL}/write/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, text })
        });

        if (response.ok) {
            alert('Escrito guardado correctamente.');
            // Puedes limpiar el formulario aquí si lo deseas
        } else {
            console.error('Error al guardar el texto');
            alert('Hubo un error al guardar.');
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
});

// Enviar formulario de Chaterest
document.getElementById('chaterest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('char-name').value;
    const age = parseInt(document.getElementById('char-age').value);
    const personaly = document.getElementById('char-personality').value; // Usando el nombre exacto de tu backend
    const history = document.getElementById('char-history').value;

    try {
        const response = await fetch(`${API_URL}/chaterest/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                age, 
                personaly, 
                history 
            })
        });

        if (response.ok) {
            alert('Personaje creado y guardado en la base de datos.');
            document.getElementById('chaterest-form').reset();
            sidePanel.classList.remove('open');
            writeContainer.style.marginRight = '0';
        } else {
            console.error('Error al guardar el personaje');
            alert('Hubo un error al crear el personaje.');
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const form          = document.getElementById('writeForm');
    const statusMessage = document.getElementById('statusMessage');
    const textArea      = document.getElementById('text');
    const wordCount     = document.getElementById('wordCount');
    const submitBtn     = form.querySelector('.btn-submit');
 
    /* ── Contador de palabras ─────────────────── */
    textArea.addEventListener('input', () => {
        const words = textArea.value.trim()
            ? textArea.value.trim().split(/\s+/).length
            : 0;
        wordCount.textContent = `${words} ${words === 1 ? 'palabra' : 'palabras'}`;
    });
 
    /* ── Envío del formulario ─────────────────── */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
 
        const titleValue = document.getElementById('title').value;
        const textValue  = textArea.value;
 
        const payload = { title: titleValue, text: textValue };
 
        // Estado de carga
        submitBtn.classList.add('loading');
        submitBtn.querySelector('span').textContent = 'Guardando…';
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';
 
        try {
            const response = await fetch('http://localhost:8000/write/', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });
 
            if (response.ok) {
                statusMessage.textContent = '✦ Tu obra ha sido guardada en los registros.';
                statusMessage.className   = 'status-message success';
            } else {
                statusMessage.textContent = 'Hubo un error al guardar. Revisa la consola.';
                statusMessage.className   = 'status-message error';
                console.error('Error de servidor:', response.status);
            }
 
        } catch (error) {
            statusMessage.textContent = 'Error de conexión con el backend.';
            statusMessage.className   = 'status-message error';
            console.error('Error en la petición:', error);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.querySelector('span').textContent = 'Guardar en los Registros';
        }
    });
});
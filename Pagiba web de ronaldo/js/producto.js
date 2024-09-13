
// URL base del servidor
const baseUrl = 'http://localhost:3000/api/producto';

// Función para manejar la creación de un producto
document.getElementById('crear').addEventListener('click', async () => {
    const producto = {
        codigo: document.getElementById('codigo').value,
        descripcion: document.getElementById('descripcion').value,
        precio_compra: document.getElementById('precio-compra').value,
        precio_venta: document.getElementById('precio-venta').value,
        estado: document.querySelector('input[name="estado"]:checked')?.value
    };

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(producto)
        });

        const result = await response.json();
        alert('Producto creado: ' + JSON.stringify(result));
    } catch (error) {
        console.error('Error al crear el producto:', error);
        alert('Error al crear el producto');
    }
});

// Función para manejar la consulta de productos
document.getElementById('consultar').addEventListener('click', async () => {
    try {
        const response = await fetch(baseUrl);
        const productos = await response.json();
        console.log('Productos:', productos);
        alert('Productos consultados. Ver consola para detalles.');
    } catch (error) {
        console.error('Error al consultar los productos:', error);
        alert('Error al consultar los productos');
    }
});

// Funciones para modificar, inhabilitar, guardar, cancelar y salir pueden ser implementadas aquí

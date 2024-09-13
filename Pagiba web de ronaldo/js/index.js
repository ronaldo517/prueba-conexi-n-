const mysql = require("mysql2/promise");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Conexión a la base de datos
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "mydb",
    password: "123456789",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Configuración de Express
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Test de conexión a la base de datos
async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log('Conexión exitosa a la base de datos');
        connection.release();  // Libera la conexión cuando ya no sea necesaria
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        process.exit(1); // Detener la ejecución si no hay conexión
    }
}

testConnection();
// ENDPOINTS

// Obtener todos los productos
app.get('/api/producto', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM producto");
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

// Verificar si un código de producto ya existe
app.get('/api/producto/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const [rows] = await db.query("SELECT Cod_prod FROM producto WHERE Cod_prod = ?", [codigo]);

        if (rows.length > 0) {
            // Si se encuentra el código del producto, retornamos un código 200 con un mensaje indicando que ya existe
            return res.status(200).json({ exists: true, message: 'El código del producto ya existe en la tabla producto.' });
        } else {
            // Si no se encuentra el código del producto, retornamos un código 404
            return res.status(404).json({ exists: false, message: 'El código del producto no existe en la tabla producto.' });
        }
    } catch (error) {
        console.error('Error al verificar el producto:', error);
        res.status(500).json({ error: 'Error al verificar el producto' });
    }
});

// Crear un nuevo producto
app.post('/api/producto', async (req, res) => {
    const { codigo, descripcion, precioCompra, precioVenta, estado } = req.body;

    if (!codigo || !descripcion || !precioCompra || !precioVenta || estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        // Verificar si el código ya existe antes de crear el producto
        const [existingProduct] = await db.query("SELECT Cod_prod FROM producto WHERE Cod_prod = ?", [codigo]);

        if (existingProduct.length > 0) {
            return res.status(409).json({ error: 'El código del producto ya existe en la tabla producto.' });
        }

        // Si no existe, procedemos a crear el producto
        await db.query(
            "INSERT INTO producto (Cod_prod, Descr_pro, Preci_com, Preci_vent, Estado) VALUES (?, ?, ?, ?, ?)",
            [codigo, descripcion, precioCompra, precioVenta, estado]
        );
        res.status(201).json({ message: 'Producto creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

// Actualizar un producto
app.put('/api/producto/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { descripcion, precioCompra, precioVenta, estado } = req.body;

    if (!descripcion || !precioCompra || !precioVenta || estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const [result] = await db.query(
            "UPDATE producto SET Descr_pro = ?, Preci_com = ?, Preci_vent = ?, Estado = ? WHERE Cod_prod = ?",
            [descripcion, precioCompra, precioVenta, estado, codigo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.status(200).json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// Eliminar un producto
app.delete('/api/producto/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const [result] = await db.query("DELETE FROM producto WHERE Cod_prod = ?", [codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});
// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

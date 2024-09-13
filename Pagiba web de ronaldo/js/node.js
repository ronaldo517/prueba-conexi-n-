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

let departamentos = [];
// Configuración de Express
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

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
///////////////////////////////////////////////////////////////////////////////////////////////////
// Crear un nuevo inventario
// Crear un nuevo inventario
app.post('/api/inventario', async (req, res) => {
    const { Cod_prod, Canti, Stockmin, Stockmax, Estado } = req.body;
    if (!Cod_prod || !Canti || !Stockmin || !Stockmax || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        await db.query(
            "INSERT INTO inventario (Cod_prod, Canti, Stockmin, Stockmax, Estado, producto_Cod_prod) VALUES (?, ?, ?, ?, ?, ?)",
            [Cod_prod, Canti, Stockmin, Stockmax, Estado, Cod_prod]
        );
        res.status(201).json({ message: 'Inventario creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el inventario:', error);
        res.status(500).json({ error: 'Error al crear el inventario', details: error.message });
    }
});

// Actualizar un inventario
app.put('/api/inventario/:Cod_prod', async (req, res) => {
    const { Cod_prod } = req.params;
    const { Canti, Stockmin, Stockmax, Estado } = req.body;
    if (!Canti || !Stockmin || !Stockmax || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        await db.query(
            "UPDATE inventario SET Canti = ?, Stockmin = ?, Stockmax = ?, Estado = ?, producto_Cod_prod = ? WHERE Cod_prod = ?",
            [Canti, Stockmin, Stockmax, Estado, Cod_prod, Cod_prod]
        );
        res.status(200).json({ message: 'Inventario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el inventario:', error);
        res.status(500).json({ error: 'Error al actualizar el inventario', details: error.message });
    }
});

// Eliminar un inventario
app.delete('/api/inventario/:Cod_prod', async (req, res) => {
    const { Cod_prod } = req.params;
    try {
        await db.query("DELETE FROM inventario WHERE Cod_prod = ?", [Cod_prod]);
        res.status(200).json({ message: 'Inventario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el inventario:', error);
        res.status(500).json({ error: 'Error al eliminar el inventario', details: error.message });
    }
});

// Obtener todos los inventarios
app.get('/api/inventario', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM inventario");
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los inventarios:', error);
        res.status(500).json({ error: 'Error al obtener los inventarios', details: error.message });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
// Crear un nuevo registro de producción
app.post('/api/produccion', async (req, res) => {
    const { Cod_prod, Fecha_pro, Canti_pro, Estado } = req.body;

    // Validación de los datos
    if (!Cod_prod || !Fecha_pro || !Canti_pro || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        // Inserción en la base de datos
        await db.query(
            "INSERT INTO produccion (Cod_prod, Fecha_pro, Canti_pro, Estado, producto_Cod_prod) VALUES (?, ?, ?, ?, ?)",
            [Cod_prod, Fecha_pro, Canti_pro, Estado, Cod_prod] // Sincronizamos Cod_prod con producto_Cod_prod
        );
        res.status(201).json({ message: 'Producción creada exitosamente' });
    } catch (error) {
        console.error('Error al crear la producción:', error);
        res.status(500).json({ error: 'Error al crear la producción', details: error.message });
    }
});

// Actualizar un registro de producción
app.put('/api/produccion/:Cod_prod', async (req, res) => {
    const { Cod_prod } = req.params;
    const { Fecha_pro, Canti_pro, Estado } = req.body;

    // Validación de los datos
    if (!Fecha_pro || !Canti_pro || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        // Actualización en la base de datos
        const [result] = await db.query(
            "UPDATE produccion SET Fecha_pro = ?, Canti_pro = ?, Estado = ?, producto_Cod_prod = ? WHERE Cod_prod = ?",
            [Fecha_pro, Canti_pro, Estado, Cod_prod, Cod_prod] // Sincronizamos Cod_prod con producto_Cod_prod
        );

        // Verificar si se encontró la producción
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producción no encontrada' });
        }

        res.status(200).json({ message: 'Producción actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar la producción:', error);
        res.status(500).json({ error: 'Error al actualizar la producción', details: error.message });
    }
});

// Eliminar un registro de producción
app.delete('/api/produccion/:Cod_prod', async (req, res) => {
    const { Cod_prod } = req.params;

    try {
        // Eliminación en la base de datos
        const [result] = await db.query("DELETE FROM produccion WHERE Cod_prod = ?", [Cod_prod]);

        // Verificar si se encontró la producción
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producción no encontrada' });
        }

        res.status(200).json({ message: 'Producción eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la producción:', error);
        res.status(500).json({ error: 'Error al eliminar la producción', details: error.message });
    }
});

// Obtener todos los registros de producción
app.get('/api/produccion', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM produccion");
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener las producciones:', error);
        res.status(500).json({ error: 'Error al obtener las producciones', details: error.message });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Obtener todos los países
app.get('/api/pais', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM pais");
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los países:', error);
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

// Crear un nuevo país
app.post('/api/pais', async (req, res) => {
    const { Cod_pais, Nomb, Estado } = req.body;

    if (!Cod_pais || !Nomb || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        await db.query(
            "INSERT INTO pais (Cod_pais, Nomb, Estado) VALUES (?, ?, ?)",
            [Cod_pais, Nomb, Estado]
        );
        res.status(201).json({ message: 'País creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el país:', error);
        res.status(500).json({ error: 'Error al crear el país' });
    }
});

// Actualizar un país
app.put('/api/pais/:Cod_pais', async (req, res) => {
    const { Cod_pais } = req.params;
    const { Nomb, Estado } = req.body;

    if (!Nomb || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const [result] = await db.query(
            "UPDATE pais SET Nomb = ?, Estado = ? WHERE Cod_pais = ?",
            [Nomb, Estado, Cod_pais]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'País no encontrado' });
        }

        res.status(200).json({ message: 'País actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el país:', error);
        res.status(500).json({ error: 'Error al actualizar el país' });
    }
});

// Eliminar un país
app.delete('/api/pais/:Cod_pais', async (req, res) => {
    const { Cod_pais } = req.params;
    try {
        const [result] = await db.query("DELETE FROM pais WHERE Cod_pais = ?", [Cod_pais]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'País no encontrado' });
        }

        res.status(200).json({ message: 'País eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el país:', error);
        res.status(500).json({ error: 'Error al eliminar el país' });
    }
});
///////////////////////////////////////////////////////////////////////////////////////////////

// Ruta para crear un departamento
app.post('/api/departamento', async (req, res) => {
    const { Cod_depa, Cod_pais, Nomb, Estado } = req.body;

    if (!Cod_depa || !Cod_pais || !Nomb || Estado === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const query = 'INSERT INTO departamento (Cod_depa, Cod_pais, Nomb, Estado, pais_Cod_pais) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.execute(query, [Cod_depa, Cod_pais, Nomb, Estado, Cod_pais]); // Usa Cod_pais para pais_Cod_pais
        res.status(201).json({ message: 'Departamento creado exitosamente' });
    } catch (error) {
        console.error('Error al crear departamento:', error);
        res.status(500).json({ message: 'Error al crear departamento', error: error.message });
    }
});

// Ruta para modificar un departamento
app.put('/api/departamento/:codigo', async (req, res) => {
    const codigo = req.params.codigo;
    const { Nomb, Estado, Cod_pais } = req.body;

    if (!Nomb || Estado === undefined || !Cod_pais) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const query = 'UPDATE departamento SET Nomb = ?, Estado = ?, Cod_pais = ?, pais_Cod_pais = ? WHERE Cod_depa = ?';
        const [result] = await db.execute(query, [Nomb, Estado, Cod_pais, Cod_pais, codigo]); // Usa Cod_pais para pais_Cod_pais

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado' });
        }

        res.status(200).json({ message: 'Departamento modificado exitosamente' });
    } catch (error) {
        console.error('Error al modificar departamento:', error);
        res.status(500).json({ message: 'Error al modificar departamento', error: error.message });
    }
});

// Ruta para eliminar un departamento
app.delete('/api/departamento/:codigo', async (req, res) => {
    const codigo = req.params.codigo;

    try {
        const query = 'DELETE FROM departamento WHERE Cod_depa = ?';
        const [result] = await db.execute(query, [codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado' });
        }

        res.status(200).json({ message: 'Departamento eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar departamento:', error);
        res.status(500).json({ message: 'Error al eliminar departamento', error: error.message });
    }
});

// Ruta para listar todos los departamentos
app.get('/api/departamento', async (req, res) => {
    try {
        const query = 'SELECT * FROM departamento';
        const [departamentos] = await db.execute(query);
        res.status(200).json(departamentos);
    } catch (error) {
        console.error('Error al obtener los departamentos:', error);
        res.status(500).json({ message: 'Error al obtener los departamentos', error: error.message });
    }
});

// Ruta para obtener todos los países para el desplegable en la gestión de departamentos
app.get('/api/paises', async (req, res) => {
    try {
        const query = 'SELECT Cod_pais, Nomb FROM pais'; // Suponiendo que tienes una tabla `pais`
        const [paises] = await db.execute(query);
        res.status(200).json(paises);
    } catch (error) {
        console.error('Error al obtener los países:', error);
        res.status(500).json({ message: 'Error al obtener los países', error: error.message });
    }
});
// Ruta para obtener todos los clientes
app.get('/api/cliente', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cliente');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////
// Ruta para crear una ciudad
// Ruta para crear una ciudad
app.post('/api/ciudad', async (req, res) => {
    const { Cod_ciudad, Cod_depa, Nombr, Estado } = req.body;

    if (!Cod_ciudad || !Cod_depa || !Nombr || Estado === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const query = 'INSERT INTO ciudad (Cod_ciudad, departamento_Cod_depa, Nombr, Estado) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [Cod_ciudad, Cod_depa, Nombr, Estado]);
        res.status(201).json({ message: 'Ciudad creada exitosamente' });
    } catch (error) {
        console.error('Error al crear ciudad:', error);
        res.status(500).json({ message: 'Error al crear ciudad', error: error.message });
    }
});

// Ruta para modificar una ciudad
app.put('/api/ciudad/:codigo', async (req, res) => {
    const codigo = req.params.codigo;
    const { Cod_depa, Nombr, Estado } = req.body;

    if (!Cod_depa || !Nombr || Estado === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const query = 'UPDATE ciudad SET departamento_Cod_depa = ?, Nombr = ?, Estado = ? WHERE Cod_ciudad = ?';
        const [result] = await db.execute(query, [Cod_depa, Nombr, Estado, codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ciudad no encontrada' });
        }

        res.status(200).json({ message: 'Ciudad modificada exitosamente' });
    } catch (error) {
        console.error('Error al modificar ciudad:', error);
        res.status(500).json({ message: 'Error al modificar ciudad', error: error.message });
    }
});

// Ruta para eliminar una ciudad
app.delete('/api/ciudad/:codigo', async (req, res) => {
    const codigo = req.params.codigo;

    try {
        const query = 'DELETE FROM ciudad WHERE Cod_ciudad = ?';
        const [result] = await db.execute(query, [codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ciudad no encontrada' });
        }

        res.status(200).json({ message: 'Ciudad eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar ciudad:', error);
        res.status(500).json({ message: 'Error al eliminar ciudad', error: error.message });
    }
});

// Ruta para obtener todas las ciudades
app.get('/api/ciudad', async (req, res) => {
    try {
        const query = 'SELECT Cod_ciudad, departamento_Cod_depa AS Cod_depa, Nombr, Estado FROM ciudad';
        const [ciudades] = await db.execute(query);
        res.status(200).json(ciudades);
    } catch (error) {
        console.error('Error al obtener las ciudades:', error);
        res.status(500).json({ message: 'Error al obtener las ciudades', error: error.message });
    }
});

// Ruta para obtener todos los departamentos
app.get('/api/departamentos', async (req, res) => {
    try {
        const query = 'SELECT Cod_depa, Nomb FROM departamento'; // Suponiendo que tienes una tabla `departamento`
        const [departamentos] = await db.execute(query);
        res.status(200).json(departamentos);
    } catch (error) {
        console.error('Error al obtener los departamentos:', error);
        res.status(500).json({ message: 'Error al obtener los departamentos', error: error.message });
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Ruta para obtener todos los países
// Ruta para obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cliente');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).send('Error al obtener clientes');
    }
});

// Crear cliente
app.post('/api/cliente', async (req, res) => {
    const cliente = req.body;

    // Extraer valores
    const {
        identificacion_cliente,
        nombre1,
        nombre2,
        apellido1,
        apellido2,
        telefono,
        correo,
        direccion,
        Cod_pais,
        Cod_dpto,
        Cod_ciudad,
        estado
    } = cliente;

    // Verificar que los valores no sean nulos
    if (!Cod_pais || !Cod_dpto || !Cod_ciudad) {
        return res.status(400).send('Cod_pais, Cod_dpto y Cod_ciudad son requeridos');
    }

    // Query para insertar el cliente
    const sql = `
        INSERT INTO cliente (
            Idecliente, Nom1, Nom2, Apell1, Apell2, Telef, Correo, Direcc, pais_Cod_pais, departamento_Cod_depa, ciudad_Cod_ciudad, Estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        identificacion_cliente,
        nombre1,
        nombre2,
        apellido1,
        apellido2,
        telefono,
        correo,
        direccion,
        Cod_pais,         // Valor para pais_Cod_pais
        Cod_dpto,         // Valor para departamento_Cod_depa
        Cod_ciudad,       // Valor para ciudad_Cod_ciudad
        estado
    ];

    try {
        const [result] = await db.query(sql, values);
        res.status(201).send('Cliente creado exitosamente');
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).send('Error al crear cliente');
    }
});

// Modificar un cliente
app.put('/api/cliente/:id', async (req, res) => {
    const id = req.params.id;
    const {
        nombre1, nombre2, apellido1, apellido2, telefono, correo, direccion,
        Cod_pais, Cod_dpto, Cod_ciudad, estado
    } = req.body;

    try {
        await db.query(
            'UPDATE cliente SET Nom1 = ?, Nom2 = ?, Apell1 = ?, Apell2 = ?, Telef = ?, Correo = ?, Direcc = ?, pais_Cod_pais = ?, departamento_Cod_depa = ?, ciudad_Cod_ciudad = ?, Estado = ? WHERE Idecliente = ?',
            [nombre1, nombre2, apellido1, apellido2, telefono, correo, direccion, Cod_pais, Cod_dpto, Cod_ciudad, estado, id]
        );
        res.send('Cliente modificado con éxito');
    } catch (error) {
        console.error('Error al modificar cliente:', error);
        res.status(500).send('Error al modificar cliente');
    }
});

// Eliminar un cliente
app.delete('/api/cliente/:id', async (req, res) => {
    const id = req.params.id;

    try {
        await db.query('DELETE FROM cliente WHERE Idecliente = ?', [id]);
        res.send('Cliente eliminado con éxito');
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).send('Error al eliminar cliente');
    }
});

// Rutas para países, departamentos y ciudades
app.get('/api/pais', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pais');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener países:', error);
        res.status(500).send('Error al obtener países');
    }
});

app.get('/api/departamento', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM departamento');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener departamentos:', error);
        res.status(500).send('Error al obtener departamentos');
    }
});

app.get('/api/ciudad', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ciudad');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener ciudades:', error);
        res.status(500).send('Error al obtener ciudades');
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Obtener todas las ventas
app.get('/api/venta', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const query = `SELECT Cod_ven, Idecliente, Ven_total, Fecha_vent, Estado FROM venta`;
        const [ventas] = await connection.execute(query);
        connection.release();

        res.status(200).json(ventas);
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        res.status(500).json({ message: 'Error al obtener las ventas' });
    }
});

// Crear una nueva venta
app.post('/api/venta', async (req, res) => {
    const { Cod_ven, Idecliente, Ven_total, Fecha_vent, Estado } = req.body;

    // Deriva cliente_Idecliente a partir de Idecliente
    const cliente_Idecliente = Idecliente;

    if (!Cod_ven || !Idecliente || !Ven_total || !Fecha_vent || Estado === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const connection = await db.getConnection();
        const query = `
            INSERT INTO venta 
            (Cod_ven, Idecliente, Ven_total, Fecha_vent, Estado, cliente_Idecliente) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.execute(query, [
            Cod_ven, Idecliente, Ven_total, Fecha_vent, Estado, cliente_Idecliente
        ]);
        connection.release();

        res.status(201).json({ message: 'Venta creada exitosamente' });
    } catch (error) {
        console.error('Error al crear venta:', error);
        res.status(500).json({ message: 'Error al crear venta' });
    }
});

// Actualizar una venta existente
app.put('/api/venta/:Cod_ven', async (req, res) => {
    const { Cod_ven } = req.params;
    const { Idecliente, Ven_total, Fecha_vent, Estado } = req.body;

    const cliente_Idecliente = Idecliente;

    if (!Idecliente || !Ven_total || !Fecha_vent || Estado === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const connection = await db.getConnection();
        const query = `
            UPDATE venta 
            SET Idecliente = ?, Ven_total = ?, Fecha_vent = ?, Estado = ?, cliente_Idecliente = ?
            WHERE Cod_ven = ?
        `;
        const [result] = await connection.execute(query, [
            Idecliente, Ven_total, Fecha_vent, Estado, cliente_Idecliente, Cod_ven
        ]);
        connection.release();

        res.status(200).json({ message: 'Venta actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar venta:', error);
        res.status(500).json({ message: 'Error al actualizar venta' });
    }
});

// Eliminar una venta
app.delete('/api/venta/:Cod_ven', async (req, res) => {
    const { Cod_ven } = req.params;

    try {
        const connection = await db.getConnection();
        const query = `
            DELETE FROM venta WHERE Cod_ven = ?
        `;
        const [result] = await connection.execute(query, [Cod_ven]);
        connection.release();

        res.status(200).json({ message: 'Venta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar venta:', error);
        res.status(500).json({ message: 'Error al eliminar venta' });
    }
});

// Iniciar el servidor
//////////////////////////////////////////////////// detalle_venta


// Ruta para crear un nuevo detalle de venta
// Ruta para crear un nuevo detalle de venta
// Obtener todos los detalles de venta
app.get('/api/detalle_venta', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM detalle_venta");
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los detalles de venta:', error);
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

// Crear un detalle de venta
app.post('/api/detalle_venta', async (req, res) => {
    const { Cod_ven, Cod_prod, Cant, ValorUnit, Estado } = req.body;

    if (!Cod_ven || !Cod_prod || Cant === undefined || ValorUnit === undefined || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        await db.query(
            "INSERT INTO detalle_venta (Cod_ven, Cod_prod, Cant, ValorUni, Estado) VALUES (?, ?, ?, ?, ?)",
            [Cod_ven, Cod_prod, Cant, ValorUnit, Estado]
        );
        res.status(201).json({ message: 'Detalle de venta creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el detalle de venta:', error);
        res.status(500).json({ error: 'Error al crear el detalle de venta' });
    }
});

// Actualizar un detalle de venta
app.put('/api/detalle_venta/:Cod_ven/:Cod_prod', async (req, res) => {
    const { Cod_ven, Cod_prod } = req.params;
    const { Cant, ValorUnit, Estado } = req.body;

    if (Cant === undefined || ValorUnit === undefined || Estado === undefined) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const [result] = await db.query(
            "UPDATE detalle_venta SET Cant = ?, ValorUni = ?, Estado = ? WHERE Cod_ven = ? AND Cod_prod = ?",
            [Cant, ValorUnit, Estado, Cod_ven, Cod_prod]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Detalle de venta no encontrado' });
        }

        res.status(200).json({ message: 'Detalle de venta actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el detalle de venta:', error);
        res.status(500).json({ error: 'Error al actualizar el detalle de venta' });
    }
});

// Eliminar un detalle de venta
app.delete('/api/detalle_venta/:Cod_ven/:Cod_prod', async (req, res) => {
    const { Cod_ven, Cod_prod } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM detalle_venta WHERE Cod_ven = ? AND Cod_prod = ?",
            [Cod_ven, Cod_prod]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Detalle de venta no encontrado' });
        }

        res.status(200).json({ message: 'Detalle de venta eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el detalle de venta:', error);
        res.status(500).json({ error: 'Error al eliminar el detalle de venta' });
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////






app.post('/usuario', async (req, res) => {
    const { Id_usuar, Cod_perfil, Nom1, Nom2, Apell1, Apell2, Correo, Contrase, Estado } = req.body;

    try {
        const query = `
            INSERT INTO usuario (Id_usuar, Cod_perfil, Nom1, Nom2, Apell1, Apell2, Correo, Contrase, Estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [Id_usuar, Cod_perfil, Nom1, Nom2, Apell1, Apell2, Correo, Contrase, Estado]);

        console.log('Resultado de la inserción:', result);
        res.json({ id: result.insertId });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { Id_usuar, Contrase } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM usuario WHERE Id_usuar = ? AND Contrase = ?', [Id_usuar, Contrase]);

        if (rows.length > 0) {
            // Credenciales correctas
            res.json({ message: 'Inicio de sesión exitoso' });
        } else {
            // Credenciales incorrectas
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////7

// Rutas para manejar las solicitudes
// Rutas para manejar las solicitudes
// Rutas para manejar las solicitudes
// Ruta para obtener todos los perfiles
app.get('/perfil', async (req, res) => {
    try {
        const [result] = await db.execute('SELECT * FROM perfil');
        res.json(result);
    } catch (error) {
        console.error('Error al obtener perfiles:', error);
        res.status(500).json({ message: 'Error al obtener perfiles', error: error.message });
    }
});

// Ruta para crear un perfil
app.post('/perfil/create', async (req, res) => {
    const { cod_perfi, descricion, estado, usuario_Id_usuar } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO perfil (Cod_perfi, Descricion, Estado, usuario_Id_usuar) VALUES (?, ?, ?, ?)',
            [cod_perfi, descricion, estado, usuario_Id_usuar]
        );
        res.json({ message: 'Perfil creado con éxito' });
    } catch (error) {
        console.error('Error al crear perfil:', error);
        res.status(500).json({ message: 'Error al crear perfil', error: error.message });
    }
});

// Ruta para actualizar un perfil
app.post('/perfil/update', async (req, res) => {
    const { cod_perfi, descricion, estado, usuario_Id_usuar } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE perfil SET Descricion = ?, Estado = ?, usuario_Id_usuar = ? WHERE Cod_perfi = ?',
            [descricion, estado, usuario_Id_usuar, cod_perfi]
        );
        res.json({ message: 'Perfil actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
    }
});

// Ruta para eliminar un perfil
app.post('/perfil/delete', async (req, res) => {
    const { cod_perfi } = req.body;
    try {
        const [result] = await db.execute(
            'DELETE FROM perfil WHERE Cod_perfi = ?',
            [cod_perfi]
        );
        res.json({ message: 'Perfil eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar perfil:', error);
        res.status(500).json({ message: 'Error al eliminar perfil', error: error.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
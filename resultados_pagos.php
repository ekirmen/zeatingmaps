<?php
session_start();
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== true) {
    header("Location: admin_login.php");
    exit;
}
include 'config.php';

// --- LÓGICA DE BÚSQUEDA ---
$termino_busqueda = isset($_GET['busqueda']) ? trim($_GET['busqueda']) : '';
$where_sql = "";
$params = array();
$types = "";

if (!empty($termino_busqueda)) {
    $where_sql = " WHERE (localizador_reserva LIKE ? OR correo LIKE ? OR numero_referencia LIKE ?)";
    $search_param = "%" . $termino_busqueda . "%";
    $params = array($search_param, $search_param, $search_param);
    $types = "sss";
}

// --- LÓGICA DE PAGINACIÓN ---
$registros_por_pagina = 20;
$pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
if ($pagina_actual < 1) {
    $pagina_actual = 1;
}
$inicio = ($pagina_actual - 1) * $registros_por_pagina;

// Obtener el total de registros (considerando la búsqueda)
$sql_total = "SELECT COUNT(*) AS total FROM pagos" . $where_sql;
$stmt_total = $conexion->prepare($sql_total);
if (!empty($params)) {
    // CORRECCIÓN PARA PHP 5.4
    $bind_params_total = array();
    $bind_params_total[] = &$types;
    for ($i = 0; $i < count($params); $i++) {
        $bind_params_total[] = &$params[$i];
    }
    call_user_func_array(array($stmt_total, 'bind_param'), $bind_params_total);
}
$stmt_total->execute();
$resultado_total = $stmt_total->get_result();
$total_registros = $resultado_total->fetch_assoc()['total'];
$total_paginas = ceil($total_registros / $registros_por_pagina);
$stmt_total->close();
// --- FIN DE LA LÓGICA ---
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Resultados de Pagos</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 20px; background-color: #f8f9fa; color: #212529; }
        .container { max-width: 1400px; margin: auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h2 { border-bottom: 2px solid #dee2e6; padding-bottom: 10px; }
        .header-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
        .search-container { margin-bottom: 20px; }
        .search-container input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 300px; }
        .search-container button, .search-container a { padding: 9px 15px; margin-left: 5px; }
        .logout-btn { color: #dc3545; text-decoration: none; font-weight: bold; }
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #dee2e6; padding: 12px; text-align: left; vertical-align: middle; white-space: nowrap; }
        th { background-color: #f8f9fa; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .btn { padding: 5px 10px; border: none; border-radius: 4px; color: white; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-edit { background-color: #007bff; }
        .btn-save { background-color: #28a745; }
        .btn-delete { background-color: #6c757d; }
        tr.validado { background-color: #d1e7dd; }
        td input[type="checkbox"] { transform: scale(1.5); cursor: pointer; }
        td input[type="text"], td input[type="number"], td input[type="date"], td input[type="email"] { width: 100%; box-sizing: border-box; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
        .pagination { margin-top: 20px; text-align: center; }
        .pagination a { color: #007bff; text-decoration: none; padding: 8px 16px; border: 1px solid #dee2e6; margin: 0 4px; border-radius: 4px; }
        .pagination a.active { background-color: #007bff; color: white; border-color: #007bff; }
        .pagination a:hover:not(.active) { background-color: #f2f2f2; }
        .tasa-field { font-weight: bold; color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-controls">
            <h2>Registros de Pagos Guardados</h2>
            <a href="logout.php" class="logout-btn">Cerrar Sesión</a>
        </div>
        
        <div class="search-container">
            <form method="GET" action="">
                <input type="text" name="busqueda" placeholder="Buscar por localizador, correo o referencia..." value="<?php echo htmlspecialchars($termino_busqueda); ?>">
                <button type="submit" class="btn btn-edit">Buscar</button>
                <a href="?" class="btn btn-delete">Limpiar</a>
            </form>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Validado</th>
                        <th>Referencia</th>
                        <th>Banco</th>
                        <th>Monto ($)</th>
                        <th>Tasa del día</th>
                        <th>Localizador</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Fecha del pago</th>
                        <th>Fecha de Registro</th> 
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="pagos-tbody">
                    <?php
                    // Prepara los parámetros y tipos para la consulta principal
                    $main_params = $params;
                    $main_params[] = $inicio;
                    $main_params[] = $registros_por_pagina;
                    $main_types = $types . "ii";

                    $sql = "SELECT id, validado, numero_referencia, banco_receptor, monto_pagado, tasa_cambio, localizador_reserva, correo, telefono, fecha_pago, fecha_registro FROM pagos" . $where_sql . " ORDER BY id DESC LIMIT ?, ?";
                    $stmt = $conexion->prepare($sql);

                    // CORRECCIÓN PARA PHP 5.4
                    $bind_params_main = array();
                    $bind_params_main[] = &$main_types;
                    for ($i = 0; $i < count($main_params); $i++) {
                        $bind_params_main[] = &$main_params[$i];
                    }
                    call_user_func_array(array($stmt, 'bind_param'), $bind_params_main);
                    
                    $stmt->execute();
                    $resultado = $stmt->get_result();

                    if ($resultado->num_rows > 0) {
                        while ($fila = $resultado->fetch_assoc()) {
                            $claseFila = $fila['validado'] ? 'class="validado"' : '';
                            echo "<tr data-id=\"{$fila['id']}\" $claseFila>";
                            echo '<td><input type="checkbox" class="validado-check" ' . ($fila['validado'] ? 'checked' : '') . '></td>';
                            echo "<td data-field=\"numero_referencia\">" . htmlspecialchars($fila['numero_referencia']) . "</td>";
                            echo "<td data-field=\"banco_receptor\">" . htmlspecialchars($fila['banco_receptor']) . "</td>";
                            echo "<td data-field=\"monto_pagado\">" . htmlspecialchars($fila['monto_pagado']) . "</td>";
                            
                            // Mostrar la tasa del día con formato
                            $tasa_formateada = '';
                            if (!empty($fila['tasa_cambio']) && $fila['tasa_cambio'] > 0) {
                                $tasa_formateada = number_format($fila['tasa_cambio'], 2, ',', '.') . ' Bs';
                            } else {
                                $tasa_formateada = 'N/A';
                            }
                            echo "<td class=\"tasa-field\">" . htmlspecialchars($tasa_formateada) . "</td>";
                            
                            echo "<td data-field=\"localizador_reserva\">" . htmlspecialchars($fila['localizador_reserva']) . "</td>";
                            echo "<td data-field=\"correo\">" . htmlspecialchars($fila['correo']) . "</td>";
                            echo "<td data-field=\"telefono\">" . htmlspecialchars($fila['telefono']) . "</td>";
                            echo "<td data-field=\"fecha_pago\">" . htmlspecialchars($fila['fecha_pago']) . "</td>";

                            try {
                                $fecha_utc = new DateTime($fila['fecha_registro'], new DateTimeZone('UTC'));
                                $fecha_utc->setTimezone(new DateTimeZone('America/Caracas'));
                                $fecha_formateada = $fecha_utc->format('Y-m-d H:i:s');
                            } catch (Exception $e) {
                                $fecha_formateada = $fila['fecha_registro'];
                            }
                            echo "<td>" . htmlspecialchars($fecha_formateada) . "</td>";

                            echo '<td>
                                    <button class="btn btn-edit">Modificar</button>
                                    <a href="eliminar_pago.php?id=' . $fila['id'] . '" class="btn btn-delete" style="background-color: #dc3545;" onclick="return confirm(\'¿Estás seguro?\');">Eliminar</a>
                                  </td>';
                            echo "</tr>";
                        }
                    } else {
                        echo "<tr><td colspan='11' style='text-align: center;'>No se encontraron registros.</td></tr>";
                    }
                    $stmt->close();
                    $conexion->close();
                    ?>
                </tbody>
            </table>
        </div>
        
        <div class="pagination">
            <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                <a href="?pagina=<?php echo $i; ?>&busqueda=<?php echo urlencode($termino_busqueda); ?>" class="<?php if ($i == $pagina_actual) echo 'active'; ?>">
                    <?php echo $i; ?>
                </a>
            <?php endfor; ?>
        </div>
    </div>
<script>
// Tu script de JavaScript existente no necesita cambios para esta funcionalidad.
document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('pagos-tbody');

    tbody.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            const editButton = e.target;
            const row = editButton.closest('tr');
            
            row.querySelectorAll('td[data-field]').forEach(cell => {
                const fieldName = cell.dataset.field;
                let fieldType = 'text';
                if (fieldName === 'monto_pagado') fieldType = 'number';
                if (fieldName === 'fecha_pago') fieldType = 'date';
                if (fieldName === 'correo') fieldType = 'email';
                
                const currentValue = cell.textContent;
                cell.innerHTML = `<input type="${fieldType}" value="${currentValue}" data-field="${fieldName}" />`;
            });

            editButton.textContent = 'Guardar';
            editButton.classList.remove('btn-edit');
            editButton.classList.add('btn-save');
        }
        
        else if (e.target.classList.contains('btn-save')) {
            const saveButton = e.target;
            const row = saveButton.closest('tr');
            const pagoId = row.dataset.id;
            
            const formData = new FormData();
            formData.append('id', pagoId);
            
            row.querySelectorAll('input[data-field]').forEach(input => {
                formData.append(input.dataset.field, input.value);
            });

            fetch('modificar_pago.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    row.querySelectorAll('td[data-field]').forEach(cell => {
                        const input = cell.querySelector('input');
                        cell.textContent = input.value;
                    });
                    
                    saveButton.textContent = 'Modificar';
                    saveButton.classList.remove('btn-save');
                    saveButton.classList.add('btn-edit');
                    alert('¡Registro actualizado!');
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

    tbody.addEventListener('change', function(e) {
        if (e.target.classList.contains('validado-check')) {
            const checkbox = e.target;
            const pagoId = checkbox.closest('tr').dataset.id;
            const nuevoEstado = checkbox.checked ? 1 : 0;

            fetch('actualizar_estado.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `id=${pagoId}&estado=${nuevoEstado}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    checkbox.closest('tr').classList.toggle('validado', nuevoEstado === 1);
                } else {
                    alert('Error: ' + data.message);
                }
            });
        }
    });
});
</script>

</body>
</html> 
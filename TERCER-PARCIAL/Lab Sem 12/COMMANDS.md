# Guía de Ejecución y Comandos — Laboratorio Sem 12

**Tema:** Blockchain Privadas: Consorcio vs. Red Pública (Hyperledger Fabric vs. Ethereum)
**Materia:** Blockchain y Bases de Datos Distribuidas
**Estudiante:** Ángel Santiago Cruz Rodríguez

---

## 📌 Guía Paso a Paso con Puntos de Captura

---

### Paso 0: Ancla de Sesión e Inicialización de Entorno

**1. Comando a ejecutar:**
En Bash (Linux/macOS/Git Bash):

```bash
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | HOST: $(hostname) | USUARIO: $(whoami) | PID: $$" | tee sesion.txt
```

En PowerShell:

```powershell
$fecha = Get-Date -Format "yyyyMMdd_HHmmss"
$node = node --version
$hostName = [System.Net.Dns]::GetHostName()
$user = [System.Environment]::UserName
"SESION: $fecha | NODE: $node | HOST: $hostName | USUARIO: $user" | Tee-Object -FilePath sesion.txt
```

> 📸 **[TOMAR CAPTURA DE PANTALLA]**
>
> * **¿Qué capturar?:** La pantalla de la terminal mostrando la ejecución del comando de ancla de sesión y la salida generada.
> * **Guardar en:** `EVIDENCIAS/PARTE1/ancla_sesion.png`

---

### Paso 1: Parte 1 — Investigación y Refutación Teórica

**Pasos a seguir:**

1. Consultar la documentación oficial de Hyperledger Fabric (v2.5).
2. Responder a las preguntas sobre Permissioned vs Permissionless, MSP, Canales y Ordering Service en `REPORTE_LAB.md`.
3. Refutar la afirmación *"Fabric es un Ethereum privado que mina y paga gas"* listando 3 errores concretos.

---

### Paso 2: Parte 2 — Modelado de la Red de Consorcio

**1. Comando a ejecutar (Validación de JSON):**

```bash
node -e "console.log(JSON.stringify(require('./red-consorcio.json'), null, 2))"
```

> 📸 **[TOMAR CAPTURA DE PANTALLA #1]**
>
> * **¿Qué capturar?:** La terminal mostrando el contenido de `red-consorcio.json` formateado correctamente.
> * **Guardar en:** `EVIDENCIAS/PARTE2/red_consorcio_json.png`

**2. Diagrama de Flujo de Transacciones:**

> 📸 **[TOMAR CAPTURA DE PANTALLA #2]**
>
> * **¿Qué capturar?:** El diagrama del flujo **Execute-Order-Validate** con sus 7 fases anotadas (`propuesta`, `endorsement`, `recolección`, `envío a orderer`, `bloque`, `validación de política`, `commit`).
> * **Guardar en:** `EVIDENCIAS/PARTE2/flujo_execute_order_validate.png`

---

### Paso 3: Parte 3 — Evaluación de Políticas de Endorsement

**1. Comando a ejecutar (Script Evaluador):**

```bash
node evaluar-politica.js
```

**2. Comando para guardar log oficial:**

```bash
node evaluar-politica.js > EVIDENCIAS/PARTE3/salida_evaluador.txt
```

> 📸 **[TOMAR CAPTURA DE PANTALLA #1]**
>
> * **¿Qué capturar?:** La terminal ejecutando `node evaluar-politica.js` mostrando la salida de la Política 1 (`OutOf(2, ...)`) y la Política Alternativa (`AND(los tres)`).
> * **Guardar en:** `EVIDENCIAS/PARTE3/salida_evaluador_base.png`

> 📸 **[TOMAR CAPTURA DE PANTALLA #2]**
>
> * **¿Qué capturar?:** La sección de la consola mostrando la ejecución de la **Política 3 (Personalizada)** donde la firma de `BancoAzulMSP` es obligatoria.
> * **Guardar en:** `EVIDENCIAS/PARTE3/salida_evaluador_personalizada.png`

---

### Paso 4: Parte 4 — Contraste Directo con Sepolia (Ethereum)

**1. Navegación en Etherscan:**
Abrir en el navegador la dirección del contrato `BovedaSegura`:🔗 [https://sepolia.etherscan.io/address/0xCa83C7073f2AB9BF65d200DA974ba8b344Ec99db](https://sepolia.etherscan.io/address/0xCa83C7073f2AB9BF65d200DA974ba8b344Ec99db)

> 📸 **[TOMAR CAPTURA DE PANTALLA]**
>
> * **¿Qué capturar?:** La vista de la pestaña **Transactions** en Etherscan mostrando que todas las transacciones, remitentes, montos y métodos son públicos para cualquier usuario sin restricciones.
> * **Guardar en:** `EVIDENCIAS/PARTE4/etherscan_transacciones.png`

---

### Paso 5: Parte 5 — Matriz de Decisión de Arquitectura

**Pasos a seguir:**

1. Completar la tabla comparativa de 6 casos empresariales en `REPORTE_LAB.md`.
2. Formular la regla general de decisión de arquitectura en 1 o 2 oraciones.

---

### Paso 6: Parte 6 — Reflexión Final y Auditoría del Reporte

**Pasos a seguir:**

1. Responder las 3 preguntas finales de reflexión técnica con base en los resultados empíricos.
2. Verificar el **Checklist de Cierre** antes de la entrega final.

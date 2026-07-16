# Laboratorio — Modelos de Amenazas en Blockchain
**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Análisis de riesgos sobre la capa de aplicación y vectores de ataque externos

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Construir un diagrama de flujo de datos (DFD) de tu dApp e identificar sus fronteras de confianza
- Aplicar STRIDE sobre cada frontera para enumerar amenazas
- Mapear tu contrato contra el OWASP Smart Contract Top 10 (edición 2026)
- Analizar vectores de ataque externos usando el OWASP Alternate Top 15 y priorizar por pérdida real

**Caso guía:** Tu protocolo va a recibir depósitos de usuarios reales. El comité de riesgos no acepta "el contrato pasó Slither" como evidencia suficiente: exige un modelo de amenazas formal que cubra el contrato, el frontend, la wallet, el nodo RPC y las claves administrativas. Tu tarea es producir ese documento con datos verificables, no con opiniones.

---

## Requisitos

- El proyecto Hardhat con `BovedaSegura` (laboratorio de despliegue)
- El frontend con ethers.js (laboratorio de dApps)
- Navegador con acceso a las fuentes oficiales de OWASP
- Papel/herramienta de diagramación (draw.io, Excalidraw o papel escaneado)

**Fuentes oficiales que usarás — todas gratuitas:**

- OWASP Smart Contract Top 10 (2026): `https://scs.owasp.org/sctop10/`
- OWASP Alternate Top 15 — Web3 Attack Vectors: `https://scs.owasp.org/sctop10/Web3-Attack-Vectors-Top15/`
- OWASP SCWE (Smart Contract Weakness Enumeration): `https://scs.owasp.org/SCWE/`
- Metodología y fuentes de datos: `https://scs.owasp.org/sctop10/methodology/`

**Advertencia de vigencia:** la edición 2025 del Top 10 está archivada y sus categorías cambiaron. Si consultas material que menciona "SC05:2025 Reentrancy" o "SC09:2025 Insecure Randomness", estás leyendo la lista anterior. Verifica siempre contra la URL oficial que la numeración corresponda a **2026**.

---

## Ancla de sesión

```bash
echo "SESION: $(date '+%Y%m%d_%H%M%S') | HOST: $(hostname) | USUARIO: $(whoami) | COMMIT: $(git rev-parse --short HEAD 2>/dev/null || echo 'sin-repo')"
```

Copia la línea en la primera página de tu reporte. Entregas sin este valor son inválidas.

---

## Parte 1 — Construye el DFD y marca las fronteras de confianza

Un modelo de amenazas sin diagrama es una lista de deseos. El primer paso de STRIDE es delimitar el sistema.

**Paso 1.1 — Enumera los elementos de tu sistema**

Tu dApp de los laboratorios anteriores tiene estos componentes. Complétala con los datos reales de tu implementación:

| Elemento | Tipo | Valor real en tu sistema |
|---|---|---|
| Frontend (Vite + ethers.js) | Proceso | Corre en: |
| MetaMask | Actor externo / almacén de claves | Cuenta: |
| Nodo RPC (Alchemy) | Proceso externo | Endpoint: |
| Contrato BovedaSegura | Proceso en la EVM | Dirección: |
| Storage del contrato | Almacén de datos | Slot de `saldos`: |
| Cuenta propietaria (deployer) | Actor con privilegios | Dirección: |

**Paso 1.2 — Dibuja el DFD**

Construye un diagrama que incluya:

- Los seis elementos de tu tabla
- Los flujos de datos entre ellos (con dirección)
- **Las fronteras de confianza** dibujadas como líneas punteadas

Una frontera de confianza es donde los datos cruzan de un dominio de control a otro. En tu sistema hay al menos cuatro. Identifícalas tú: piensa en dónde termina el control de un actor y empieza el de otro.

Antes de continuar, responde en tu reporte: ¿cuántas fronteras de confianza identificaste y cuáles son? Para cada una, ¿quién controla cada lado?

**Paso 1.3 — Identifica el activo más valioso**

Consulta el balance real de tu contrato:

```bash
npx hardhat run scripts/verifica-saldo.js --network sepolia
```

O consulta en `https://sepolia.etherscan.io/address/TU_DIRECCION`.

Anota: ¿cuánto ETH custodia tu contrato ahora mismo? Ese es el activo que el modelo de amenazas protege. Todo el análisis debe justificarse contra ese activo, no contra amenazas abstractas.

> Evidencia obligatoria: el DFD con las fronteras de confianza marcadas y el balance real de tu contrato en Sepolia.

---

## Parte 2 — Aplica STRIDE sobre las fronteras

STRIDE clasifica amenazas en seis categorías: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.

Antes de aplicarlo, investiga y responde: STRIDE fue diseñado por Microsoft para software tradicional. ¿Qué característica de un sistema blockchain hace que la categoría **Repudiation** se comporte de forma distinta a como se comporta en una aplicación web centralizada? Argumenta con lo que sabes de inmutabilidad y firma criptográfica.

**Paso 2.1 — Enumera amenazas por frontera**

Para cada frontera de confianza que identificaste en la Parte 1, completa esta tabla. Debes producir **al menos una amenaza por cada letra de STRIDE** a lo largo de todo el sistema — no todas aplican a todas las fronteras.

| Frontera | Categoría STRIDE | Amenaza concreta en TU sistema | Activo afectado |
|---|---|---|---|
| Ejemplo: Usuario → MetaMask | Spoofing | Un sitio de phishing imita tu dApp y solicita la firma de una transacción de `approve` ilimitado | Fondos del usuario |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

Las amenazas deben ser específicas de tu implementación, con nombres de funciones y direcciones reales. "Alguien podría atacar el contrato" no es una amenaza: "un atacante llama `retirar()` con un contrato malicioso en `receive()` para reentrar antes de que `saldos` se actualice" sí lo es.

**Paso 2.2 — Verifica una amenaza contra el código**

Elige **una** amenaza de tu tabla que aplique al contrato. Abre `contracts/BovedaSegura.sol` y responde:

- ¿Qué línea de código específica mitiga esa amenaza? Cítala textualmente.
- Si esa línea no existiera, ¿qué ocurriría? Describe la secuencia exacta de la explotación.

---

## Parte 3 — Mapea tu contrato contra el OWASP Smart Contract Top 10 (2026)

**Paso 3.1 — Consulta la lista oficial**

Abre `https://scs.owasp.org/sctop10/` y registra en tu reporte los diez títulos de categoría exactos de la edición **2026**, con su código (SC01 a SC10).

Verifica que estás en la edición correcta: la 2026 incluye una categoría llamada **Proxy & Upgradeability Vulnerabilities** que no existía antes, y **Business Logic Vulnerabilities** aparece en segundo lugar. Si tu lista no coincide, estás leyendo el archivo de 2025.

**Paso 3.2 — Audita categoría por categoría**

Para cada una de las diez categorías, abre su página oficial y evalúa tu contrato. Completa la tabla:

| Código | Categoría (título oficial 2026) | ¿Aplica a BovedaSegura? | Evidencia en tu código (línea/función) | Mitigación presente |
|---|---|---|---|---|
| SC01 | | | | |
| SC02 | | | | |
| SC03 | | | | |
| SC04 | | | | |
| SC05 | | | | |
| SC06 | | | | |
| SC07 | | | | |
| SC08 | | | | |
| SC09 | | | | |
| SC10 | | | | |

Para las categorías que marques como "no aplica", justifica **por qué** no aplica. "No aplica" sin justificación es una respuesta inválida en una auditoría real: significa que no la analizaste.

**Paso 3.3 — Vincula con el SCWE**

Elige la categoría del Top 10 que consideres de mayor riesgo para tu contrato. Abre `https://scs.owasp.org/SCWE/` y localiza al menos **dos** entradas SCWE específicas que correspondan a esa categoría. Anota sus códigos y títulos exactos.

¿Por qué OWASP mantiene tanto un Top 10 como un catálogo SCWE separado con más de 150 entradas? Investiga la diferencia de propósito entre ambos documentos.

**Afirmación para refutar o confirmar:** *"Como BovedaSegura usa ReentrancyGuard de OpenZeppelin y Solidity 0.8.20, las categorías SC08 (Reentrancy) y SC09 (Integer Overflow) quedan completamente cubiertas y pueden marcarse como riesgo cero."*

Con lo que leíste en las páginas oficiales de SC08 y SC09, refuta o confirma. Presta atención a lo que cada página dice sobre los casos que las mitigaciones estándar **no** cubren.

> Evidencia obligatoria: captura de la página oficial de OWASP mostrando la lista 2026, y tu tabla de mapeo completa.

---

## Parte 4 — Vectores de ataque externos: el Alternate Top 15

Aquí está el punto central del laboratorio. OWASP publica un catálogo separado porque, según su propia documentación, muchas de las mayores pérdidas de Web3 durante 2025 provienen de amenazas **off-chain y operacionales**, no de bugs en el código del contrato: manipulación y secuestro de multisig, ataques a la cadena de suministro, malware drainer, entrevistas falsas, phishing y brechas de exchanges.

**Paso 4.1 — Consulta el catálogo oficial**

Abre `https://scs.owasp.org/sctop10/Web3-Attack-Vectors-Top15/` y registra los quince vectores con sus títulos exactos.

Antes de continuar, responde: tu contrato podría tener cero vulnerabilidades según los diez puntos de la Parte 3 y aun así perder todos sus fondos. Nombra al menos tres vectores del Alternate Top 15 que lo harían posible y explica el mecanismo de cada uno.

**Paso 4.2 — Audita tu propio entorno de desarrollo**

Los vectores externos apuntan a ti, no a tu código. Audita tu entorno real:

```bash
# ¿Tu llave privada está expuesta en el repositorio?
git log --all --full-history -- .env 2>/dev/null && echo "ALERTA: .env aparece en el historial de git" || echo "OK: .env no está en el historial"

# ¿Está .env correctamente ignorado?
git check-ignore -v .env 2>/dev/null || echo "ALERTA: .env NO está en .gitignore"

# Dependencias con vulnerabilidades conocidas
npm audit --production
```

Anota en tu reporte:
- ¿`.env` aparece en el historial de git? (Este es el resultado de **tu** repositorio, no un ejemplo)
- ¿Cuántas vulnerabilidades reportó `npm audit` y de qué severidad?
- ¿Cuántos paquetes tiene tu proyecto en total? Ejecuta `npm ls --all --depth=0 2>/dev/null | wc -l` y anota el número.

Con ese número de dependencias, responde: cada paquete de npm es código de terceros que se ejecuta en tu máquina con tus permisos. Si uno solo de ellos fuera comprometido y leyera tu archivo `.env`, ¿qué obtendría el atacante? ¿Qué vector del Alternate Top 15 describe exactamente ese escenario?

**Paso 4.3 — Analiza el eslabón administrativo**

Tu contrato tiene un propietario. Consulta quién es:

```bash
npx hardhat console --network sepolia
```

```javascript
const boveda = await ethers.getContractAt("BovedaSegura", "TU_DIRECCION");
// Si tu contrato tiene función de propietario, consúltala.
// Si no la tiene, verifica quién lo desplegó en Etherscan.
```

O consulta el campo "Contract Creator" en Etherscan.

Anota la dirección del creador. Responde:
- ¿Esa dirección es una EOA controlada por una sola llave privada o un multisig?
- Si un atacante obtuviera esa llave privada, ¿qué podría hacer con tu contrato? Sé específico sobre las funciones que quedarían expuestas.
- Consulta la entrada SCWE relacionada con administración por EOA única en `https://scs.owasp.org/SCWE/` y anota su código y título.

> Evidencia obligatoria: salida de la auditoría de tu entorno (`git check-ignore`, `npm audit`) y captura del Alternate Top 15 oficial.

---

## Parte 5 — Matriz de riesgos anclada a datos reales

Un modelo de amenazas sin priorización es una lista. La priorización debe basarse en datos, no en intuición.

**Paso 5.1 — Consulta los datos empíricos de OWASP**

Abre `https://scs.owasp.org/sctop10/data-sources/` y `https://scs.owasp.org/sctop10/methodology/`. Registra en tu reporte:

- El número total de incidentes de smart contracts analizados para la edición 2026
- La pérdida total analizada en dólares
- El período que cubren esos datos

**Paso 5.2 — Construye tu matriz**

Toma las **cinco amenazas** de mayor riesgo que identificaste entre la Parte 2 (STRIDE), la Parte 3 (Top 10) y la Parte 4 (vectores externos). Completa la matriz:

| # | Amenaza | Origen (STRIDE / SC0X / Alt-Top15) | Probabilidad (1-5) | Impacto (1-5) | Riesgo (P×I) | Mitigación propuesta |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

Reglas de puntuación que debes seguir:

- **Impacto** se ancla al balance real de tu contrato que registraste en la Parte 1. Un impacto de 5 significa pérdida total de ese balance.
- **Probabilidad** se justifica con los datos de OWASP: una categoría con más incidentes documentados en 2025 tiene mayor probabilidad que una con menos. Cita el dato.

Ordena la matriz de mayor a menor riesgo.

**Paso 5.3 — Contrasta con la percepción inicial**

Antes de este laboratorio, ¿cuál habrías dicho que era la mayor amenaza para tu dApp? Compara esa intuición con el resultado #1 de tu matriz.

¿Coinciden? Si no coinciden, ¿qué te hizo cambiar de opinión: un dato de OWASP, un hallazgo de tu auditoría de entorno, o el análisis STRIDE?

---

## Parte 6 — Reflexión final

Responde con base en lo que analizaste y verificaste. Las respuestas sin referencia a tus datos propios son inválidas.

1. En la Parte 1 registraste el balance real de tu contrato en Sepolia. En la Parte 5 registraste la pérdida total documentada por OWASP en incidentes de smart contracts durante 2025. Calcula qué porcentaje representa el balance de tu contrato frente a esa cifra. Ahora invierte la pregunta: si tu contrato custodiara el 1% de esa pérdida total, ¿cambiaría alguna de las puntuaciones de impacto de tu matriz? Justifica qué amenazas escalarían y cuáles no.

2. La documentación de OWASP indica que las mayores pérdidas de 2025 vinieron de amenazas off-chain, no de bugs en contratos. Sin embargo, la mayoría del presupuesto de seguridad de los protocolos se destina a auditorías de código. Con los hallazgos de tu auditoría de entorno en la Parte 4 (dependencias, `.env`, administración por EOA), argumenta si esa asignación de presupuesto es racional o si refleja un sesgo. Usa al menos dos datos concretos de tu propio análisis.

3. Tu contrato pasó Slither y Aderyn sin hallazgos críticos en el laboratorio de auditoría. En este laboratorio identificaste amenazas que ninguna de esas herramientas puede detectar. Nombra dos de esas amenazas de tu matriz y explica, para cada una, por qué un analizador estático es estructuralmente incapaz de encontrarlas. No es una crítica a las herramientas: es una pregunta sobre qué tipo de problema puede resolver el análisis automatizado y cuál no.

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Ancla de sesión en la primera página del reporte
- [ ] Tabla de elementos del sistema con direcciones y endpoints reales
- [ ] DFD con las fronteras de confianza marcadas (diagrama)
- [ ] Balance real de tu contrato en Sepolia registrado
- [ ] Tabla STRIDE con al menos una amenaza por cada letra, específica de tu código
- [ ] Amenaza verificada contra la línea de código exacta que la mitiga
- [ ] Los diez títulos del Top 10 **2026** registrados desde la fuente oficial (captura)
- [ ] Tabla de mapeo SC01–SC10 completa, con justificación de los "no aplica"
- [ ] Dos entradas SCWE localizadas y citadas
- [ ] Afirmación sobre ReentrancyGuard y Solidity 0.8 refutada o confirmada
- [ ] Los quince vectores del Alternate Top 15 registrados (captura)
- [ ] Auditoría de entorno ejecutada: `git check-ignore`, `npm audit`, conteo de dependencias
- [ ] Dirección del creador del contrato identificada y evaluada (EOA vs multisig)
- [ ] Datos empíricos de OWASP registrados: incidentes, pérdida total, período
- [ ] Matriz de riesgos con cinco amenazas priorizadas y probabilidad justificada con datos
- [ ] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con el DFD, las tablas STRIDE y de mapeo OWASP, la matriz de riesgos, capturas de las fuentes oficiales y de tu auditoría de entorno, y declaración de uso de IA.

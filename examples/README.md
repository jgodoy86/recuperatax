# Archivos de ejemplo para pruebas locales

## factura-ejemplo.xml
Factura electrónica UBL 2.1 de prueba (vehículo BYD Yuan Pro, IVA $19.159.664, comprador cédula 52123456).

Para que la validación automática dé **APROBADO**, el caso debe coincidir con la factura:
- Cliente registrado con cédula `52123456`
- Caso con IVA pagado `19159664`, factura `FE-999`, fecha `2026-06-01`

Si registras el caso con otros datos, verás cómo el validador detecta las inconsistencias
(comprador distinto → REQUIERE_CORRECCIÓN, IVA diferente → REVISIÓN_HUMANA).

## flota-ejemplo.csv
CSV de cargue masivo con 6 filas: 4 válidas (incluye un MHEV que queda NO_APTO)
y 2 con errores (año inválido, tipo GASOLINA) para ver el reporte fila a fila.

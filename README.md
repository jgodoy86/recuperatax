# RecuperaTax

Plataforma digital para que personas y empresas recuperen impuestos pagados de más y gestionen beneficios tributarios en Colombia — empezando por la **devolución de IVA de vehículos eléctricos e híbridos** (certificado UPME + devolución DIAN).

> El nombre "RecuperaTax" es provisional y se puede cambiar en `app/layout.tsx` y `app/page.tsx`.

## Módulos implementados (MVP)

| Módulo | Dónde |
|---|---|
| Landing comercial (WhatsApp, proceso, FAQ, servicios) | `app/page.tsx` |
| Simulador tributario inteligente | `app/simulador` + `lib/simulator.ts` |
| Motor de reglas de elegibilidad (BEV/HEV/PHEV, excluye MHEV, IVA discriminado, plazos, uso contable) | `lib/eligibility.ts` |
| Registro de clientes (persona natural / empresa) y autenticación por roles | `app/registro`, `app/login`, `lib/auth.ts` |
| Gestión de casos con código de referencia (RTX-AAAA-NNNN) | `app/api/cases` |
| Firma digital (contrato, habeas data, mandato, veracidad, no garantía — hash SHA-256 + IP + timestamp) | `app/api/cases/[id]/sign` |
| Carga documental (PDF/imagen/XML, 15 MB máx.) | `app/api/cases/[id]/documents` |
| Validación IA de documentos (Claude API con visión/PDF + salida estructurada; fallback heurístico) | `lib/ai/validator.ts` |
| Generador de expedientes UPME y DIAN (memorial, relación de facturas, checklist) | `lib/expediente.ts` |
| Backoffice de gestores (bandeja con filtros, revisión documental, estados, radicación, notas) | `app/admin` |
| Dashboard del cliente (estado, próximo paso, historial, notificaciones) | `app/app` |
| Notificaciones WhatsApp + correo (cola en BD, proveedor conectable) | `lib/notifications.ts` |
| Panel para concesionarios (referidos + comisión) | `app/concesionarios` |
| Integración UPME/DIAN de **doble canal: API + bot RPA** | `lib/integrations/` + `scripts/worker.ts` |

## Automatización UPME / DIAN (doble canal)

Hoy no existe API pública de UPME ni DIAN, así que la radicación funciona con **tres canales intercambiables** detrás de la misma interfaz (`lib/integrations/types.ts`):

- **`BOT`** (por defecto): la radicación entra a la cola `Submission`; el worker RPA (`npm run worker`, Playwright) radica por los portales web oficiales y reporta el radicado vía `POST /api/webhooks/submissions`. Si falla 3 veces, alerta al gestor y pasa a manual.
- **`API`**: listo para conectarse el día que exista API o convenio (configurar `UPME_API_URL`/`DIAN_API_URL` + keys).
- **`MANUAL`**: el gestor radica y registra el radicado desde el backoffice.

Se elige con `UPME_CHANNEL` y `DIAN_CHANNEL` en `.env`.

## Cómo correr

```bash
npm install
cp .env.example .env        # ajustar secretos
npm run db:push             # crea la base (SQLite en dev)
npm run db:seed             # usuarios demo
npm run dev                 # http://localhost:3000
npm run worker              # (opcional) worker RPA de radicaciones
```

### Usuarios demo (seed)

| Usuario | Clave | Rol |
|---|---|---|
| `admin@recuperatax.co` | `demo1234` | Backoffice (admin) |
| `gestor@recuperatax.co` | `demo1234` | Backoffice (gestor) |
| `cliente@demo.co` | `demo1234` | Dashboard cliente |

### Variables de entorno clave

- `ANTHROPIC_API_KEY` — activa la validación documental con IA (visión + PDF). Sin clave, los documentos pasan a revisión humana.
- `WHATSAPP_API_URL` / `WHATSAPP_API_TOKEN` — WhatsApp Cloud API (Meta). Sin credenciales las notificaciones quedan en cola (`Notification.status = PENDIENTE`).
- `UPME_CHANNEL` / `DIAN_CHANNEL` — `BOT` | `API` | `MANUAL`.
- `UPME_PORTAL_USER/PASS`, `DIAN_PORTAL_USER/PASS` — credenciales del bot RPA.

## Flujo completo

Cliente simula → se registra → se crea el caso con diagnóstico automático → firma digital (5 documentos) → carga documental → IA valida cada documento → gestor revisa y aprueba → expediente UPME generado y radicado (bot/API) → certificado aprobado → expediente DIAN generado → radicación de devolución → seguimiento → devolución pagada. Cada transición dispara notificaciones y queda en el historial auditable del caso (`CaseEvent`).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 + SQLite (dev; cambiar `datasource` a PostgreSQL en producción) · Claude API (`claude-opus-4-8`) para validación documental · JWT (jose) + bcrypt.

## Roadmap sugerido

1. Bots RPA reales contra los portales UPME/DIAN (calibrar selectores en `scripts/worker.ts`).
2. Módulo de pagos de honorarios (Wompi/PayU/Stripe).
3. Cargue masivo de facturas para flotas (CSV/XLSX) y matriz de beneficios.
4. Reportes gerenciales exportables.
5. Parser XML de factura electrónica DIAN (UBL) para validación exacta del IVA.
6. Migración a PostgreSQL + almacenamiento de archivos en S3/GCS.

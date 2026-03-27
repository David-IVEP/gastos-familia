# Gastos Familia 🌿

App de control de gastos e ingresos familiares para David, Silvia, Aniol y Tanit.

## Acceso

🌐 **App en vivo:** https://david-ivep.github.io/gastos-familia/

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | La app completa (HTML + CSS + JS en un solo archivo) |
| `manifest.json` | Permite instalar la app en el móvil como PWA |
| `Code.gs` | Script de Google Apps Script (backend / API) |

## Configuración del backend (Google Sheets)

1. Abre el Google Sheet de referencia
2. **Extensiones → Apps Script**
3. Borra el código existente y pega el contenido de `Code.gs`
4. Guarda con Ctrl+S
5. **Desplegar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la URL que aparece
7. En la app, pulsa ⚙ → pega la URL → Guardar y probar conexión

## Instalar en el móvil (PWA)

**iPhone:** Safari → compartir ⬆ → "Añadir a pantalla de inicio"  
**Android:** Chrome → menú ⋮ → "Añadir a pantalla de inicio"

## Bot de WhatsApp (Make.com)

El script `Code.gs` ya incluye el endpoint webhook para recibir gastos desde Make.com.  
El bot envía un POST a la URL del Web App con el gasto parseado por Claude API.

Formato esperado:
```json
{
  "action": "add",
  "collection": "gastos",
  "entry": {
    "id": "1234567",
    "amount": 87.5,
    "desc": "Mercadona",
    "cat": "alimentacion",
    "person": "silvia",
    "month": 2,
    "year": 2026,
    "ts": 1234567890000
  }
}
```

## Categorías disponibles

### Gastos
- **Hogar:** hipoteca, suministros, internet, seguros, alimentacion
- **Hijos:** colegio, material, comedor, extraesc, ropa_h, ocio_h, salud_h
- **Transporte:** combustible, transporte_h, coche_mant, coche_seg
- **Estilo de vida:** restaurantes, vacaciones, ocio_fam, suscripciones
- **Personal:** ropa_d/s, ocio_d/s, formacion_d/s, salud_d/s
- **Finanzas:** prestamos, tarjetas, impuestos
- **Ahorro:** ahorro_fam, ahorro_h, inversion

### Ingresos
- sal_d, sal_s, extra_d, extra_s, bonus, alquiler, inv_ing, ayudas, puntual

### Personas
- david, silvia, familia, aniol, tanit

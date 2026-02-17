# Calculadora DAK - Negociadora

Calculadora web basada en la información transcrita de las imágenes en la carpeta `datos/`.

## Estructura del Proyecto

- `index.html` - Interfaz principal de la calculadora
- `styles.css` - Estilos con tema oscuro
- `calculator.js` - Lógica de cálculo
- `data.js` - Datos transcritos de las imágenes

## Datos Transcritos

### 1. Servicios Base (SERVICIOS_BASE)
Precios por servicio y nivel de dificultad:

| Servicio | Fácil | Medio | Difícil |
|----------|-------|-------|---------|
| Video corto | 120 | 200 | 350 |
| Video largo | 250 | 400 | 700 |
| Sesión fotos | 100 | 180 | 300 |
| Portada FB | 50 | 90 | 150 |

### 2. Perfiles de Cliente (PERFILES_CLIENTE)
Multiplicadores por perfil:

- **Bajo**: 1.0
- **Medio**: 1.2
- **Alto**: 1.5

### 3. Factores Extra (FACTORES_EXTRA)
Costos adicionales:

- **Urgencia 48h**: 150
- **Grabación fuera zona**: 200
- **Revisión extra**: 80
- **Drone adicional**: 120

## Funcionalidad

La calculadora realiza los siguientes cálculos:

1. **Subtotal base**: Suma de servicios seleccionados (videos cortos + fotos)
2. **Aplicar multiplicador**: Multiplica el subtotal por el multiplicador del perfil de cliente
3. **Sumar extras**: Agrega los factores extra seleccionados (actualmente solo urgencia)
4. **Total final**: Suma del subtotal con multiplicador + extras

## Uso

Simplemente abre `index.html` en tu navegador. La calculadora se actualiza automáticamente cuando cambias cualquier parámetro.

## Ejemplo de Cálculo

- Perfil Cliente: Alto (1.5)
- 3 Videos Cortos nivel Medio: 3 × 200 = 600
- 5 Fotos nivel Fácil: 5 × 100 = 500
- Subtotal base: 1,100
- Con multiplicador (Alto): 1,100 × 1.5 = 1,650
- Urgencia: +150
- **Total Final: 1,800**

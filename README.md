# toque. — Laboratorio de microinteracciones

Una pantalla Expo para probar diez microinteracciones: cambio de tema, favorito, Wi-Fi, carrito, calificación, copiar enlace, selector de cantidad, medidor de contraseña, notificaciones y deshacer. El interruptor general permite comparar las mismas acciones con animaciones activadas o apagadas. Todo se simula localmente.

## Instalación

Este repositorio usa pnpm:

```bash
pnpm install
```

## Abrir en Chrome

```bash
npx expo start --web
```

Abre en Chrome la dirección local que muestra Expo (normalmente `http://localhost:8081`).

Para generar la versión web estática:

```bash
npx expo export --platform web
```

## Recorrido de 30 segundos

1. Cambia entre tema claro y oscuro con el interruptor de la esquina superior.
2. Marca el corazón y observa cómo cambia el contador; prueba también el interruptor de Wi-Fi.
3. Califica con estrellas y cambia la cantidad con los botones − y +.
4. Escribe una contraseña para ver el medidor, y toca **Ver** para alternar su visibilidad.
5. Agrega al carrito: aparece la carga, el punto llega al carrito y el contador rebota.
6. Copia el enlace o activa las notificaciones; usa **Deshacer** en el aviso.
7. Apaga **Microinteracciones** y repite una acción para comparar el cambio instantáneo.

La opción de movimiento reducido del sistema desactiva las animaciones. No hay compras, persistencia ni envío de formularios.

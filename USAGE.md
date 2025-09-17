# GGPM - Global Guardian Package Manager

## Descripción

GGPM es un wrapper para gestores de paquetes (npm, yarn, pnpm, bun) que verifica la edad de los paquetes antes de instalarlos, ayudando a evitar la instalación de paquetes demasiado recientes que podrían ser inestables.

## Instalación Global

```bash
npm install -g ggpm
```

## Uso

Una vez instalado globalmente, puedes usar los siguientes comandos:

### Comando principal
```bash
ggpm install <paquete>
```

### Comandos específicos por gestor de paquetes
```bash
# Para npm
g/npm install <paquete>

# Para pnpm  
g/pnpm install <paquete>

# Para yarn
g/yarn add <paquete>

# Para bun
g/bun install <paquete>
```

## Configuración

Crea un archivo `.npmrc` en tu proyecto con la configuración de edad mínima:

```
minimum-release-age=365
```

Este valor representa los días mínimos que debe tener un paquete desde su publicación para ser considerado seguro para instalar.

## Características

- **Detección automática**: El comando `ggpm` detecta automáticamente qué gestor de paquetes usar basándose en los archivos de lock presentes
- **Verificación de edad**: Verifica que los paquetes tengan la edad mínima configurada antes de instalarlos
- **Soporte múltiple**: Compatible con npm, yarn, pnpm y bun
- **Configuración flexible**: Configurable a través de `.npmrc`

## Ejemplos

```bash
# Instalar un paquete usando detección automática
ggpm install express

# Usar específicamente npm
g/npm install express

# Usar específicamente yarn
g/yarn add express

# Usar específicamente pnpm
g/pnpm install express
```

## Desarrollo

Para desarrollar localmente:

```bash
# Instalar dependencias
npm install

# Compilar el proyecto
npm run bundle

# Ejecutar en modo desarrollo
npm run dev
```

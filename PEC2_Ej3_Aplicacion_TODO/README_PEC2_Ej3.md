# README PEC2 Ejercicio 3 - Aplicación TODO TypeScript MVC

## Comandos de Instalación

### 1. Instalar Dependencias

```bash
# Instalar todas las dependencias del proyecto
npm install
```

### 2. Verificar Instalación

```bash
# Verificar que TypeScript está correctamente instalado
npx tsc --version

# Verificar que Webpack está correctamente instalado
npx webpack --version
```

## Comandos de Transpilación

### Opción A: TypeScript Compiler (tsc)

```bash
# Transpilación única
npm run build

# Transpilación con modo watch (recompila automáticamente)
npm run watch

# Verificación de tipos sin generar archivos
npm run type-check
```

**Salida**: Los archivos compilados se generan en `dist/` manteniendo la estructura de carpetas.

### Opción B: Webpack (Recomendado)

```bash
# Build de producción - genera bundle.js optimizado
npm run build:webpack

# Build con watch mode - recompila en cambios
npm run watch:webpack

# Build completo - limpia, compila TypeScript y genera bundle
npm run build:all
```

**Salida**: Genera un único archivo `bundle.js` en `dist/` con toda la aplicación bundled.

## Comandos de Ejecución

### Desarrollo con TypeScript Compiler

```bash
# Opción 1: Desarrollo con recarga automática
npm run dev:tsc

# Opción 2: Iniciar servidor después de build
npm run build
npm run start
```

**URL**: http://localhost:3000

### Desarrollo con Webpack (Recomendado)

```bash
# Servidor de desarrollo con hot-reload
npm run dev

# O alternativamente
npm run start:webpack
```

**URL**: http://localhost:3000 (se abre automáticamente)

### Producción

```bash
# Build optimizado para producción
npm run build:webpack

# Servir archivos de producción
npm run start
```

## Configuración Webpack

El archivo `webpack.config.js` está optimizado para este proyecto con las siguientes características:

### Configuración de Entrada y Salida
```javascript
entry: "./src/app.ts"              // Punto de entrada TypeScript
output: {
  filename: "bundle.js",           // Bundle unificado
  path: path.resolve(__dirname, "dist"),
  clean: true                      // Limpia dist/ en cada build
}
```

### Resolución de Módulos
```javascript
resolve: {
  extensions: ['.ts', '.js', '.json'],
  alias: {                         // Aliases para imports limpios
    '@models': path.resolve(__dirname, 'src/models'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@views': path.resolve(__dirname, 'src/views'),
    '@controllers': path.resolve(__dirname, 'src/controllers')
  }
}
```

### Loaders Configurados
- **ts-loader**: Transpila TypeScript a JavaScript
- **css-loader + style-loader**: Procesa archivos CSS
- **asset/resource**: Maneja imágenes y assets

### Plugins Incluidos
- **HtmlWebpackPlugin**: Genera index.html automáticamente
- **Code Splitting**: Separa vendor libraries del código de aplicación

### DevServer
- Puerto: 3000
- Hot Reload: Habilitado
- Compresión: Habilitada
- Source Maps: Habilitados en desarrollo

## Flujo de Desarrollo Recomendado

### Para Desarrollo Rápido (Webpack)
```bash
# 1. Instalar dependencias (solo primera vez)
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# La aplicación se abre automáticamente en http://localhost:3000
# Los cambios en el código se reflejan inmediatamente
```

### Para Build de Producción
```bash
# 1. Build optimizado
npm run build:webpack

# 2. Verificar salida en dist/
ls -la dist/

# 3. Servir en producción
npm run start
```

### Para Debugging
```bash
# 1. Build con source maps
npm run dev

# 2. Abrir DevTools del navegador
# 3. Los archivos TypeScript originales están disponibles en Sources
```
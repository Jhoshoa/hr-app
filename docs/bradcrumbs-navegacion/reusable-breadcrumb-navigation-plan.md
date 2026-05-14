# Reusable Breadcrumb Navigation Plan

Fecha: 2026-05-14

## Contexto

Actualmente, cuando el usuario entra a una pagina hija como:

```text
/settings/company
```

la forma mas evidente de volver a:

```text
/settings
```

es hacer click nuevamente en `Settings` dentro del sidebar. Eso funciona, pero
no es una experiencia suficientemente clara para una aplicacion SaaS operativa.

Las paginas hijas necesitan una navegacion local que explique:

```text
donde estoy
de donde vengo
como vuelvo al nivel anterior
```

## Decision Recomendada

Implementar un componente reutilizable de breadcrumbs e integrarlo opcionalmente
en `PageHeader`.

Patron recomendado:

```tsx
<PageHeader
  breadcrumbs={[
    { label: "Settings", href: "/settings" },
    { label: "Company settings" }
  ]}
  title="Company settings"
  description="Manage tenant identity, localization, currency, and timezone defaults."
/>
```

No usar solo una flecha de "back" como patron principal. La flecha es util como
accion complementaria, pero el breadcrumb comunica mejor jerarquia y contexto.

## Objetivos

```text
1. Mejorar navegacion en paginas hijas.
2. Evitar que el usuario dependa del sidebar para volver a un nivel padre.
3. Establecer un patron reusable para todo el sistema.
4. Mantener consistencia visual entre Settings, Employees, Documents, Leave, etc.
5. Preparar el layout para jerarquias futuras mas profundas.
```

## Alcance Inicial

Aplicar primero en:

```text
/settings/company
/settings/organization
```

Luego extender a futuras paginas hijas:

```text
/settings/leave
/settings/documents
/settings/access
/employees/:id
/documents/:id
/leave/policies/:id
```

## Por Que Breadcrumbs

Ventajas:

```text
Muestran jerarquia.
Permiten volver al nivel padre con un click.
Escalan a mas de dos niveles.
Son faciles de entender.
No dependen del historial del navegador.
No dependen de que el usuario recuerde el sidebar.
```

Comparacion con flecha "Back":

```text
Flecha:
  buena para volver a la pagina anterior
  ambigua si el usuario entro desde otra ruta
  depende mentalmente del historial

Breadcrumb:
  vuelve a un destino explicito
  muestra jerarquia
  no depende del historial
```

Decision:

```text
Usar breadcrumb como navegacion principal de jerarquia.
Usar flecha solo si una pantalla necesita una accion clara de retorno contextual.
```

## Diseno De Componentes

### Componente Breadcrumbs

Archivo recomendado:

```text
apps/web/src/components/navigation/breadcrumbs.tsx
```

API:

```ts
export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface BreadcrumbsProps {
  readonly items: readonly BreadcrumbItem[];
}
```

Uso:

```tsx
<Breadcrumbs
  items={[
    { label: "Settings", href: "/settings" },
    { label: "Company settings" }
  ]}
/>
```

Comportamiento:

```text
items con href -> renderizar Link.
ultimo item sin href -> texto actual.
usar aria-label="Breadcrumb".
usar ol/li semantico.
separador visual con ChevronRight.
truncar textos largos.
mantener buen comportamiento mobile.
```

### Integracion Con PageHeader

Archivo actual:

```text
apps/web/src/components/app-shell/page-header.tsx
```

Extender props:

```ts
import type { BreadcrumbItem } from "@/components/navigation/breadcrumbs";

interface PageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
}
```

Render recomendado:

```tsx
{breadcrumbs?.length ? (
  <Breadcrumbs items={breadcrumbs} />
) : null}

<div className="...">
  <h1>{title}</h1>
  <p>{description}</p>
  {actions}
</div>
```

Esto mantiene `PageHeader` como el punto estandar para encabezados, sin obligar
a todas las paginas a usar breadcrumbs.

## Estilo Visual

Recomendacion:

```text
Breadcrumb pequeno arriba del titulo.
Texto 13px o text-sm.
Items padre en muted foreground con hover foreground.
Item actual en foreground, font-medium.
Separador ChevronRight de lucide-react.
Altura compacta.
Sin cards ni contenedores decorativos.
```

Ejemplo visual:

```text
Settings / Company settings

Company settings
Manage tenant identity, localization...
```

## Accesibilidad

Requisitos:

```text
nav aria-label="Breadcrumb"
ol/li para estructura
aria-current="page" en item actual
Links con texto legible
Foco visible por estilos existentes
No usar solo iconos sin texto
```

Ejemplo:

```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li>
      <Link href="/settings">Settings</Link>
    </li>
    <li aria-current="page">Company settings</li>
  </ol>
</nav>
```

## Reglas De Uso

Usar breadcrumbs en:

```text
Paginas hijas de Settings.
Detalle de entidades.
Flujos con jerarquia clara.
Pantallas edit/create que tienen un padre estable.
```

No usar breadcrumbs en:

```text
Dashboard principal.
Login/auth pages.
No-access pages.
Platform root pages si no hay jerarquia.
Paginas publicas simples.
```

## Convenciones De Labels

Labels deben ser cortos y consistentes:

```text
Settings
Company settings
Organization settings
Employees
Employee profile
Documents
Document requirements
Leave
Leave policies
Access
Users
```

No usar labels largos como:

```text
Manage all company identity and localization settings
```

El titulo de la pagina ya cumple ese rol.

## Multi-Tenant Considerations

Breadcrumbs no deben incluir el tenant como primer item si el tenant ya se ve en
navbar/sidebar.

Evitar:

```text
AssureSoft Demo / Settings / Company settings
```

Preferir:

```text
Settings / Company settings
```

Razon:

```text
El tenant activo ya se muestra en TenantIdentity/UserMenu.
Agregarlo en todos los breadcrumbs genera ruido.
```

Si en el futuro usamos subdominios, el breadcrumb no debe cambiar. La ruta sigue
siendo jerarquica dentro del tenant actual.

## Implementation Plan

### Fase 1: Componente Base

Tareas:

```text
1. Crear components/navigation/breadcrumbs.tsx.
2. Exportar BreadcrumbItem.
3. Usar next/link.
4. Usar ChevronRight de lucide-react.
5. Agregar estilos responsivos.
6. Agregar tests de rendering basico.
```

Tests:

```text
renderiza links para items con href
renderiza item actual con aria-current="page"
no renderiza separador despues del ultimo item
```

Definition of Done:

```text
Breadcrumbs reusable, accesible y testeado.
```

### Fase 2: Integracion Con PageHeader

Tareas:

```text
1. Extender PageHeader con breadcrumbs opcional.
2. Renderizar Breadcrumbs arriba del titulo.
3. Mantener compatibilidad con paginas existentes.
4. Agregar test si ya existe suite para PageHeader o crear una pequena.
```

Definition of Done:

```text
Paginas sin breadcrumbs no cambian comportamiento.
Paginas con breadcrumbs muestran jerarquia arriba del titulo.
```

### Fase 3: Aplicar En Settings

Tareas:

```text
1. Agregar breadcrumbs en CompanySettingsPage.
2. Agregar breadcrumbs en OrganizationSettingsPage.
3. Validar mobile/desktop.
4. Confirmar que Settings del breadcrumb vuelve a /settings.
```

Ejemplo:

```tsx
<PageHeader
  breadcrumbs={[
    { label: "Settings", href: "/settings" },
    { label: "Company settings" }
  ]}
  title="Company settings"
  description="Manage tenant identity, localization, currency, and timezone defaults."
/>
```

### Fase 4: Expandir A Futuras Paginas

Aplicar cuando existan:

```text
Settings / Leave
Settings / Documents
Settings / Access
Employees / Employee profile
Documents / Document detail
```

## Edge Cases

### Mobile

Breadcrumbs largos pueden overflow.

Solucion:

```text
usar min-w-0
truncate en labels
permitir wrap solo si se ve limpio
mantener title como fuente principal de contexto
```

### Item Actual Con Href

Evitar que el ultimo item sea link. Si se envia href por error, el componente
puede ignorarlo cuando es el ultimo item.

### Breadcrumb Dinamico

Para detalle de entidades:

```text
Employees / Ana Rojas
```

Si el nombre esta cargando:

```text
Employees / Loading...
```

Luego reemplazar por el valor real.

## Anti-Patterns

Evitar:

```text
Copiar breadcrumbs manualmente en cada pagina.
Usar flecha back como unico mecanismo.
Usar window.history.back para volver a settings.
Meter breadcrumbs dentro de cards.
Poner breadcrumbs gigantes o con descripciones.
Incluir tenant name en cada breadcrumb si ya aparece en el shell.
```

## Recomendacion Final

Implementar `Breadcrumbs` como componente independiente e integrarlo en
`PageHeader` mediante una prop opcional.

Aplicarlo inicialmente a:

```text
/settings/company
/settings/organization
```

Luego usar el mismo patron para toda pagina hija del sistema. Esto mejora la
navegacion sin cambiar arquitectura, y deja una base clara para futuras
pantallas mas profundas.


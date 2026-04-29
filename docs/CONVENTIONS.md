# Documentation Conventions (`docs/`)

## Folder structure

```text
docs/
  audits/      ← auditorías periódicas de calidad del repositorio           → YYYY-MM-DD_AUDIT.md
  plans/       ← planes de implementación (tarea a tarea, antes de tocar código) → YYYY-MM-DD-<feature>.md
  reviews/     ← registros de verificación y cierre de fase                 → YYYY-MM-DD_<tema>-review.md
  technical/   ← documentación técnica/arquitectura y decisiones de diseño  → v<semver>_TECHNICAL.md
  README.md    ← índice maestro con historial y deuda técnica abierta
```

## Reglas de vinculación entre documentos

Todo documento debe referenciar hacia adelante **y** hacia atrás:

- **Auditoría** → al final, sección "Planes generados" con links a cada plan y al review de cierre.
- **Plan** → en el header, link a la auditoría de origen + plan relacionado (si hay fixes) + review de cierre.
- **Review** → en el header, link a la auditoría y a todos los planes que verificó.
- **`docs/README.md`** → actualizar la tabla del historial y el árbol de ciclos cada vez que se crea un documento nuevo.

## Obligaciones al crear un documento nuevo

1. Usar el patrón de nombre de su carpeta.
2. Agregar la fila correspondiente en `docs/README.md`.
3. Agregar el link de retorno en los documentos a los que referencia.

## Commits de documentación

```text
docs(plans): add implementation plan for tarjetas module
docs(technical): add architecture decision for supabase migration
docs(audits): add quality audit for phase 3
```

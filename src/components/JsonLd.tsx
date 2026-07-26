// Inserta datos estructurados (JSON-LD) para que Google entienda el contenido
// y pueda mostrar resultados enriquecidos. Se renderiza server-side.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function extractId(idSlug: string): string {
  if (!idSlug) return "";

  // Canonical format in AcademyFind: `${institute.id}-${institute.slug}`
  // CUIDs are alphanumeric (typically 25 chars starting with 'c')
  const match = idSlug.match(/^([a-z0-9]{24,32})-(.+)$/i);
  if (match) {
    return match[1];
  }

  // If there is no cuid prefix, return idSlug intact (pure slug or direct ID)
  return idSlug;
}
import fs from "fs";
import path from "path";

const projectId = "ujhm14iw";
const dataset = "production";
const apiVersion = "2023-05-03";

const outDir = path.join(process.cwd(), "hugo-site", "data");
const outFile = path.join(outDir, "posts.json");

const groq = `
*[_type == "post" && defined(slug.current)] | order(publishDate desc) {
  title,
  "slug": slug.current,
  excerpt,
  publishDate,
  "heroImageUrl": heroImage.asset->url,
  "category": category->{
    title,
    "slug": slug.current,
    description
  },
  "author": author->{
    name,
    "slug": slug.current,
    bio,
    "profileImageUrl": profileImage.asset->url
  },
  body
}
`;

const query = encodeURIComponent(groq);
const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`;

async function main() {
  if (!projectId || projectId.includes("PASTE_")) {
    throw new Error("Set projectId in scripts/fetch-sanity.mjs");
  }

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data.result ?? [], null, 2), "utf8");

  console.log(`✅ Exported ${data.result?.length ?? 0} posts to ${outFile}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
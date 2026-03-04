import fs from "fs";
import path from "path";

const projectId = "ujhm14iw";
const dataset = "production";
const apiVersion = "2023-05-03";

const outDir = path.join(process.cwd(), "hugo-site", "data");
const outFile = path.join(outDir, "posts.json");

// Hugo content stubs (so /posts/<slug>/ routes exist)
const postsContentDir = path.join(process.cwd(), "hugo-site", "content", "posts");

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
  if (!projectId) throw new Error("projectId is missing");
  if (!dataset) throw new Error("dataset is missing");

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();
  const posts = data.result ?? [];

  // 1) Write JSON for Hugo data
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(posts, null, 2), "utf8");

  // 2) Generate stub markdown files for each post (routing)
  fs.mkdirSync(postsContentDir, { recursive: true });

  for (const p of posts) {
    const slug = p.slug;
    if (!slug) continue;

    const safeTitle = (p.title ?? "").replaceAll('"', '\\"');
    const mdPath = path.join(postsContentDir, `${slug}.md`);

    const md = `---\ntitle: "${safeTitle}"\nslug: "${slug}"\n---\n`;
    fs.writeFileSync(mdPath, md, "utf8");
  }

  console.log(`✅ Exported ${posts.length} posts to ${outFile}`);
  console.log(`✅ Generated ${posts.length} stub files in ${postsContentDir}`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
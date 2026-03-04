import fs from "fs";
import path from "path";

const projectId = "ujhm14iw";
const dataset = "production";
const apiVersion = "2023-05-03";

const root = process.cwd();

// Output folders
const dataDir = path.join(root, "hugo-site", "data");
const postsOut = path.join(dataDir, "posts.json");
const authorsOut = path.join(dataDir, "authors.json");
const categoriesOut = path.join(dataDir, "categories.json");

// Content stub folders (for Hugo routes)
const postsContentDir = path.join(root, "hugo-site", "content", "posts");
const authorsContentDir = path.join(root, "hugo-site", "content", "authors");
const categoriesContentDir = path.join(root, "hugo-site", "content", "categories");

const groq = `
{
  "posts": *[_type == "post" && defined(slug.current)] | order(publishDate desc) {
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
  },
  "authors": *[_type == "author" && defined(slug.current)] | order(name asc) {
    name,
    "slug": slug.current,
    bio,
    "profileImageUrl": profileImage.asset->url
  },
  "categories": *[_type == "category" && defined(slug.current)] | order(title asc) {
    title,
    "slug": slug.current,
    description
  }
}
`;

function slugify(text) {
  return (text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Simple Portable Text -> HTML + TOC + wordCount
function portableTextToHtml(blocks = []) {
  const toc = [];
  let html = "";
  let plainText = "";

  for (const b of blocks) {
    if (!b || b._type !== "block") continue;

    const style = b.style || "normal";
    const text = (b.children || [])
      .filter((c) => c && c._type === "span")
      .map((c) => c.text || "")
      .join("");

    plainText += " " + text;
    const safe = escapeHtml(text);

    if (style === "h2" || style === "h3") {
      const id = slugify(text);
      toc.push({ level: style, id, text });
      html += `<${style} id="${id}">${safe}</${style}>\n`;
    } else {
      html += `<p>${safe}</p>\n`;
    }
  }

  const words = plainText.trim().split(/\s+/).filter(Boolean).length;

  return { html, toc, words };
}

function writeStub(dir, title, slug) {
  const safeTitle = (title ?? "").replaceAll('"', '\\"');
  const mdPath = path.join(dir, `${slug}.md`);
  const md = `---\ntitle: "${safeTitle}"\nslug: "${slug}"\n---\n`;
  fs.writeFileSync(mdPath, md, "utf8");
}

async function main() {
  if (!projectId) throw new Error("Missing projectId");
  if (!dataset) throw new Error("Missing dataset");

  const query = encodeURIComponent(groq);
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();
  const result = data.result ?? {};

  const posts = result.posts ?? [];
  const authors = result.authors ?? [];
  const categories = result.categories ?? [];

  // Enrich posts with bodyHtml, toc, wordCount for Hugo
  const enrichedPosts = posts.map((p) => {
    const { html, toc, words } = portableTextToHtml(p.body || []);
    return {
      ...p,
      bodyHtml: html,
      toc,
      wordCount: words,
    };
  });

  // 1) Write Hugo data JSON
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(postsOut, JSON.stringify(enrichedPosts, null, 2), "utf8");
  fs.writeFileSync(authorsOut, JSON.stringify(authors, null, 2), "utf8");
  fs.writeFileSync(categoriesOut, JSON.stringify(categories, null, 2), "utf8");

  // 2) Generate stub pages for routing
  fs.mkdirSync(postsContentDir, { recursive: true });
  fs.mkdirSync(authorsContentDir, { recursive: true });
  fs.mkdirSync(categoriesContentDir, { recursive: true });

  // Clear old stubs (keeps clean)
  for (const dir of [postsContentDir, authorsContentDir, categoriesContentDir]) {
    for (const file of fs.readdirSync(dir)) {
      if (file !== "_index.md" && file.endsWith(".md")) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }

  for (const p of enrichedPosts) {
    if (!p.slug) continue;
    writeStub(postsContentDir, p.title, p.slug);
  }

  for (const a of authors) {
    if (!a.slug) continue;
    writeStub(authorsContentDir, a.name, a.slug);
  }

  for (const c of categories) {
    if (!c.slug) continue;
    writeStub(categoriesContentDir, c.title, c.slug);
  }

  console.log(`Exported: ${enrichedPosts.length} posts, ${authors.length} authors, ${categories.length} categories`);
  console.log(`Wrote JSON to: hugo-site/data/ (posts.json, authors.json, categories.json)`);
  console.log(`Generated stub pages for /posts/, /authors/, /categories/`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
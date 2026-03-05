# Navex Blog CMS (Sanity + Hugo)

## Overview

This project implements a lightweight Blog Content Management System using:

- Sanity Studio for content management
- Hugo for static site generation
- Netlify for deployment

Editors can create Blog Posts, Categories, and Authors in Sanity, and the content is rendered by Hugo templates to generate a static blog website.

The objective of this project is to demonstrate a clean CMS architecture where content management is separated from frontend rendering.

---

## Live Demo

https://navex-blog-cms-sanity-hugo.netlify.app/

---

## Architecture

Sanity CMS (content authoring)
↓
GROQ API Query
↓
Node.js script (fetch-sanity.mjs)
↓
JSON exported to Hugo data directory
↓
Hugo Templates render static pages
↓
Netlify builds and deploys the site

This architecture allows content editors to manage data independently while Hugo generates a fast static website.

---

## Features

### CMS (Sanity Studio)

Content editors can manage the following content types.

Blog Post
- title
- slug
- excerpt
- body (rich text)
- publish date
- hero image
- category reference
- author reference

Category
- title
- slug
- description (optional)

Author
- name
- slug
- bio
- profile image (optional)

Validation rules are applied to required fields such as title, slug, and publish date.

---

### Hugo Frontend

The Hugo frontend renders the following pages:

- Homepage listing blog posts
- Individual blog post page
- Category listing page
- Author listing page

Each blog post page includes:

- title
- publish date
- reading time calculation
- hero image
- author and category references
- table of contents generated from headings
- copy link / share button

---

## Styling and Accessibility

The website is styled using Sass (SCSS).

Key design considerations include:

- responsive layout for mobile and desktop
- semantic HTML structure
- accessible navigation
- alt text for images
- clean typography for blog readability

---

## Repository Structure

navex-blog-cms-sanity-hugo

sanity-studio  
Sanity CMS configuration and schemas

scripts  
fetch-sanity.mjs (fetches blog content from Sanity)

hugo-site  
layouts (Hugo templates)  
content (stub pages for routing)  
data (JSON data exported from Sanity)  
assets (Sass styles)  
static (static assets)

video  
walkthrough video

netlify.toml  
Netlify deployment configuration

---

## Software Requirements

The following tools are required to run the project locally.

Node.js 18+  
Hugo Extended 0.153+  
npm (comes with Node)  
Git

Recommended development tools:

Visual Studio Code  
Sanity CLI

---

## Local Development Setup

### Clone the repository

git clone <repository-url>
cd navex-blog-cms-sanity-hugo

---

### Install Sanity dependencies

cd sanity-studio
npm install

---

### Run Sanity Studio

npm run dev

Sanity Studio will start at:

http://localhost:3333

Editors can create and manage blog content here.

---

### Fetch content from Sanity

From the repository root run:

node scripts/fetch-sanity.mjs

This script executes a GROQ query to fetch blog content and exports JSON files into the Hugo data directory.

---

### Run Hugo locally

cd hugo-site
hugo server -D

The website will be available at:

http://localhost:1313

---

## Deployment

The project is deployed using Netlify.

Build configuration:

Base directory: hugo-site  
Build command: hugo --minify  
Publish directory: public

This configuration is defined in netlify.toml.

Netlify automatically builds and deploys the site when changes are pushed to GitHub.

---

## Sample Content

The CMS includes at least five sample blog posts.

Each post is linked to a category and an author, allowing testing of category and author listing pages.


## Walkthrough Video

A short walkthrough video demonstrating the system is available in:

video/walkthrough.mp4

The video shows:

- Sanity CMS content models
- data export script
- Hugo frontend rendering
- category and author pages
- Netlify deployment

---

## Author

Submission for Navex technical assessment.

Developer: Naveen
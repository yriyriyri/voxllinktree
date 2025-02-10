// pages/api/articles.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const articlesDir = path.join(process.cwd(), 'public', 'articles');
    const filenames = fs.readdirSync(articlesDir).filter(file =>
      file.endsWith('.html')
    );

    const articlesData = filenames.map((filename) => {
      const filePath = path.join(articlesDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const titleMatch = fileContent.match(
        /<div\s+class=["']title["']>\s*([\s\S]*?)\s*<\/div>/
      );
      const dateMatch = fileContent.match(
        /<div\s+class=["']date["']>\s*([\s\S]*?)\s*<\/div>/
      );
      const authorMatch = fileContent.match(
        /<div\s+class=["']submit["']>.*?submitted\s+by\s+([^<]+?)\s*<\/div>/
      );

      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
      const date = dateMatch ? dateMatch[1].trim() : '';
      const author = authorMatch ? authorMatch[1].trim() : '';
      const slug = filename.replace(/\.html$/, '');

      return { title, date, author, slug };
    });

    res.status(200).json(articlesData);
  } catch (error) {
    console.error('Error reading articles:', error);
    res.status(500).json([]);
  }
}
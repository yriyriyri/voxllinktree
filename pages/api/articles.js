// pages/api/articles.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const articlesDir = path.join(process.cwd(), 'public', 'articles');
    const filenames = fs
      .readdirSync(articlesDir)
      .filter((file) => file.endsWith('.html'));

    const articlesData = filenames.map((filename) => {
      const filePath = path.join(articlesDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const titleMatch = fileContent.match(
        /<div[^>]*class=["']title["'][^>]*>([\s\S]*?)<\/div>/i
      );
      const dateMatch = fileContent.match(
        /<div[^>]*class=["']date["'][^>]*>([\s\S]*?)<\/div>/i
      );
      const authorMatch = fileContent.match(
        /<div[^>]*class=["']submit["'][^>]*>[\s\S]*?submitted\s+by\s+([^<]+?)\s*<\/div>/i
      );

      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
      const date = dateMatch ? dateMatch[1].trim() : '';
      const author = authorMatch ? authorMatch[1].trim() : '';
      const slug = filename.replace(/\.html$/, '');

      let preview = '';
      const firstContentMatch = fileContent.match(
        /<div[^>]*class=["']content["'][^>]*>([\s\S]*?)<\/div>/i
      );

      if (firstContentMatch) {
        const firstContent = firstContentMatch[1].trim();
        const sentences = firstContent.match(/[^.!?]+[.!?]+/g);
        if (sentences && sentences.length > 0) {
          preview = sentences.slice(0, 4).join(' ').trim();
        } else {
          preview = firstContent;
        }
      }

      return { title, date, author, slug, preview };
    });

    const sortedArticlesData = articlesData.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    const topThreeArticles = sortedArticlesData.slice(0, 3);

    res.status(200).json(topThreeArticles);
  } catch (error) {
    console.error('Error reading articles:', error);
    res.status(500).json([]);
  }
}
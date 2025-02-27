// pages/api/articles.js

//test change
import qs from 'qs';

export default async function handler(req, res) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    const queryObj = {
      populate: {
        cover: { populate: '*' },
        author: { populate: '*' }
      }
    };

    const queryString = qs.stringify(queryObj, { encode: false });
    const cmsUrl = `${baseUrl}/api/articles?${queryString}`;
    console.log('Fetching articles from:', cmsUrl);

    const response = await fetch(cmsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles from CMS: ${response.status} ${response.statusText}`);
    }
    const cmsData = await response.json();
    console.log('CMS Data:', JSON.stringify(cmsData, null, 2));

    const articlesData = Array.isArray(cmsData.data) ? cmsData.data : [];
    const articles = articlesData.map(article => {
      const { title, publishedAt, description, slug, author } = article;
      const authorName = author?.name || '';
      return {
        title,
        date: publishedAt, 
        author: authorName,
        slug,
        preview: description 
      };
    });

    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(articles.slice(0, 3));
  } catch (error) {
    console.error('Error fetching devlog articles:', error);
    res.status(500).json([]);
  }
}
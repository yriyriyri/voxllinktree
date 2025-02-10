// pages/article-parser.tsx
import React from "react";
import { GetStaticProps } from "next";
import { load } from "cheerio";
import fs from "fs";
import path from "path";

export interface ArticleData {
  title: string;
  date: string;
  author: string;
  slug: string;
}

interface ArticleParserProps {
  articlesData: ArticleData[];
}

//debug render

export default function ArticleParser({ articlesData }: ArticleParserProps) {
  return (
    <div>
      <h1>Article Parser</h1>
      <ul>
        {articlesData.map((article) => (
          <li key={article.slug}>
            <strong>{article.title}</strong> – {article.date} – Submitted by{" "}
            {article.author}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const getStaticProps: GetStaticProps<ArticleParserProps> = async () => {
  const articlesDir = path.join(process.cwd(), "public", "articles");
  const filenames = fs.readdirSync(articlesDir);

  const articlesData: ArticleData[] = filenames.map((filename) => {
    const filePath = path.join(articlesDir, filename);
    const html = fs.readFileSync(filePath, "utf8");
    const $ = load(html);
    const title = $(".title").first().text().trim();
    const date = $(".date").first().text().trim();
    const submitText = $(".submit").first().text().trim();
    const authorMatch = submitText.match(/submitted by\s+(.*)/i);
    const author = authorMatch ? authorMatch[1].trim() : "";
    const slug = filename.replace(/\.html$/, "");
    return { title, date, author, slug };
  });

  return {
    props: {
      articlesData,
    },
  };
};
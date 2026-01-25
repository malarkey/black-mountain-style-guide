const { execSync } = require("child_process");
const rssPlugin = require("@11ty/eleventy-plugin-rss");
const Image = require("@11ty/eleventy-img");

// Filters
const dateFilter = require("./src/filters/date-filter.js");
const w3DateFilter = require("./src/filters/w3-date-filter.js");
const sortByDisplayOrder = require("./src/utils/sort-by-display-order.js");

// Async image shortcode
async function imageShortcode(src, alt, sizes = "(min-width: 1024px) 50vw, 100vw") {
  let metadata = await Image(src, {
    widths: [300, 600, 1200],
    formats: ["webp", "jpeg"],
    outputDir: "./dist/images/",
    urlPath: "/images/"
  });

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async"
  };

  return Image.generateHTML(metadata, imageAttributes);
}

// CSS inlining filter for Netlify CMS
function inlineFilter(path) {
  const fs = require("fs");
  const filepath = `dist${path}`;

  if (fs.existsSync(filepath)) {
    const buffer = fs.readFileSync(filepath);
    return buffer.toString('utf8').replace(/^\uFEFF/, '');
  }
  return `/* CSS file ${path} not found */`;
}

module.exports = function(eleventyConfig) {
  // Filters
  eleventyConfig.addFilter("dateFilter", dateFilter);
  eleventyConfig.addFilter("w3DateFilter", w3DateFilter);
  eleventyConfig.addFilter("sortByDisplayOrder", sortByDisplayOrder);
  eleventyConfig.addFilter("inline", inlineFilter);

  // SLUG FILTER (for URLs)
  eleventyConfig.addFilter("slug", function(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')       // Trim hyphens from start
      .replace(/-+$/, '');      // Trim hyphens from end
  });

  // THUMBNAILS FILTERS
  eleventyConfig.addFilter("filterThumbnailsByCategory", function(thumbnails, category) {
    console.log(`DEBUG: Filtering by category "${category}" from ${thumbnails.length} thumbnails`);
    const filtered = thumbnails.filter(item =>
      item.data.categories && item.data.categories.includes(category)
    );
    console.log(`DEBUG: Found ${filtered.length} items for category "${category}"`);
    return filtered;
  });

  eleventyConfig.addFilter("filterThumbnailsByTag", function(thumbnails, tag) {
    console.log(`DEBUG: Filtering by tag "${tag}" from ${thumbnails.length} thumbnails`);
    const filtered = thumbnails.filter(item =>
      item.data.tags && item.data.tags.includes(tag)
    );
    console.log(`DEBUG: Found ${filtered.length} items for tag "${tag}"`);
    return filtered;
  });

  eleventyConfig.addFilter("getUniqueThumbnailCategories", function(collection) {
    const allCategories = new Set();
    collection.forEach(item => {
      if (item.data.categories) {
        item.data.categories.forEach(cat => allCategories.add(cat));
      }
    });
    return Array.from(allCategories).sort();
  });

  eleventyConfig.addFilter("getUniqueThumbnailTags", function(collection) {
    const allTags = new Set();
    collection.forEach(item => {
      if (item.data.tags) {
        item.data.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  });

  // THUMBNAIL IMAGE SHORTCODE
  eleventyConfig.addNunjucksAsyncShortcode("thumbnailImage", async function(src, alt, caption = "") {
    let metadata = await Image(src, {
      widths: [150, 300, 600],
      formats: ["webp", "jpeg"],
      outputDir: "./dist/images/thumbnails/",
      urlPath: "/images/thumbnails/"
    });

    let imageAttributes = {
      alt,
      sizes: "(min-width: 768px) 33vw, 100vw",
      loading: "lazy",
      decoding: "async"
    };

    const imageHTML = Image.generateHTML(metadata, imageAttributes);

    if (caption) {
      return `<figure class="thumbnail">${imageHTML}<figcaption>${caption}</figcaption></figure>`;
    }

    return imageHTML;
  });

  // Plugins
  eleventyConfig.addPlugin(rssPlugin);

  // Shortcodes
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("._redirects");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  // COLLECTIONS

  // Thumbnails collection
  eleventyConfig.addCollection("thumbnails", function(collection) {
    const thumbnails = collection.getFilteredByGlob("./src/thumbnails/*.md")
      .sort((a, b) => {
        if (a.data.date && b.data.date) {
          return new Date(b.data.date) - new Date(a.data.date);
        }
        return 0;
      });

    console.log(`Thumbnails collection: ${thumbnails.length} items found`);
    return thumbnails;
  });

  // Thumbnail categories collection
  eleventyConfig.addCollection("thumbnailCategories", function(collectionApi) {
    const categories = new Set();
    const thumbnails = collectionApi.getFilteredByGlob("./src/thumbnails/*.md");

    thumbnails.forEach(item => {
      if (item.data.categories) {
        item.data.categories.forEach(cat => categories.add(cat));
      }
    });

    const categoryList = Array.from(categories).sort();
    console.log(`Thumbnail Categories: ${categoryList.length} categories found: ${JSON.stringify(categoryList)}`);
    return categoryList;
  });

  // Thumbnail tags collection
  eleventyConfig.addCollection("thumbnailTags", function(collectionApi) {
    const tags = new Set();
    const thumbnails = collectionApi.getFilteredByGlob("./src/thumbnails/*.md");

    thumbnails.forEach(item => {
      if (item.data.tags) {
        item.data.tags.forEach(tag => tags.add(tag));
      }
    });

    const tagList = Array.from(tags).sort();
    console.log(`Thumbnail Tags: ${tagList.length} tags found: ${JSON.stringify(tagList)}`);
    return tagList;
  });

  // REMOVED: thumbnailCategoryPages and thumbnailTagPages collections
  // These will be handled by pagination in template files

  // Use .eleventyignore, not .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Directory structure
  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  };
};
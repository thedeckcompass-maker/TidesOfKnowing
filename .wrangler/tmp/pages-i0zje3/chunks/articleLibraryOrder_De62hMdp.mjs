globalThis.process ??= {}; globalThis.process.env ??= {};
function isStandalone(a) {
  return !a.data.seriesName?.trim();
}
function sortWithinSeries(items) {
  return [...items].sort((a, b) => {
    const ao = a.data.seriesOrder ?? 9999;
    const bo = b.data.seriesOrder ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.data.publishDate.getTime() - b.data.publishDate.getTime();
  });
}
function buildUnits(articles) {
  const standalone = articles.filter(isStandalone);
  const inSeries = articles.filter((a) => !isStandalone(a));
  const byName = /* @__PURE__ */ new Map();
  for (const a of inSeries) {
    const k = a.data.seriesName.trim();
    const list = byName.get(k) ?? [];
    list.push(a);
    byName.set(k, list);
  }
  const units = [];
  for (const a of standalone) {
    const t = a.data.publishDate.getTime();
    units.push({
      items: [a],
      newestMs: t,
      oldestMs: t,
      tieSlug: a.data.slug
    });
  }
  for (const raw of byName.values()) {
    const items = sortWithinSeries(raw);
    const times = items.map((x) => x.data.publishDate.getTime());
    units.push({
      items,
      newestMs: Math.max(...times),
      oldestMs: Math.min(...times),
      tieSlug: items[0].data.slug
    });
  }
  return units;
}
function sortArticlesLibraryNewest(articles) {
  const units = buildUnits(articles);
  units.sort((u, v) => {
    if (v.newestMs !== u.newestMs) return v.newestMs - u.newestMs;
    return u.tieSlug.localeCompare(v.tieSlug);
  });
  return units.flatMap((u) => u.items);
}
function sortArticlesLibraryOldest(articles) {
  const units = buildUnits(articles);
  units.sort((u, v) => {
    if (u.oldestMs !== v.oldestMs) return u.oldestMs - v.oldestMs;
    return u.tieSlug.localeCompare(v.tieSlug);
  });
  return units.flatMap((u) => u.items);
}
function getChronologicallyNewestArticle(articles) {
  if (articles.length === 0) return void 0;
  return [...articles].sort((a, b) => {
    const diff = b.data.publishDate.getTime() - a.data.publishDate.getTime();
    if (diff !== 0) return diff;
    return a.data.slug.localeCompare(b.data.slug);
  })[0];
}
function getLibraryFeaturedArticles(articles, sortedNewest, fallbackCount) {
  const newest = getChronologicallyNewestArticle(articles);
  if (!newest) {
    return {
      featured: [],
      heading: "Latest articles",
      featuredHeadingId: "latest-heading",
      ogArticle: void 0
    };
  }
  const seriesName = newest.data.seriesName?.trim();
  if (seriesName) {
    const featured2 = articles.filter(
      (a) => a.data.seriesName?.trim() === seriesName
    );
    featured2.sort((a, b) => {
      const ao = a.data.seriesOrder ?? 9999;
      const bo = b.data.seriesOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      return b.data.publishDate.getTime() - a.data.publishDate.getTime();
    });
    return {
      featured: featured2,
      heading: "Latest series",
      featuredHeadingId: "latest-series-heading",
      ogArticle: newest
    };
  }
  const featured = sortedNewest.slice(0, fallbackCount);
  return {
    featured,
    heading: "Latest articles",
    featuredHeadingId: "latest-heading",
    ogArticle: featured[0]
  };
}

export { sortArticlesLibraryOldest as a, getLibraryFeaturedArticles as g, sortArticlesLibraryNewest as s };

globalThis.process ??= {}; globalThis.process.env ??= {};
function sortArticles(articles, sortBy = "newest") {
  const list = [...articles];
  switch (sortBy) {
    case "oldest":
      return list.sort(
        (a, b) => a.data.publishDate.getTime() - b.data.publishDate.getTime()
      );
    case "series":
      return list.sort((a, b) => {
        const an = a.data.seriesName ?? "￿";
        const bn = b.data.seriesName ?? "￿";
        if (an !== bn) return an.localeCompare(bn);
        const ao = a.data.seriesOrder ?? 9999;
        const bo = b.data.seriesOrder ?? 9999;
        if (ao !== bo) return ao - bo;
        return a.data.publishDate.getTime() - b.data.publishDate.getTime();
      });
    case "newest":
    default:
      return list.sort(
        (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime()
      );
  }
}

export { sortArticles as s };

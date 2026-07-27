import type { Category, Product } from "./types";

export function getPublishedCategories(categories: Category[]) {
  return categories
    .filter((category) => category.publicationStatus === "published")
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function getPublishedProducts(products: Product[]) {
  return products
    .filter((product) => product.publicationStatus === "published")
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function getCategoryChildren(
  categories: Category[],
  parentId: string | null,
) {
  return getPublishedCategories(categories).filter(
    (category) => category.parentId === parentId,
  );
}

export function getCategoryTrail(categories: Category[], categoryId: string) {
  const trail: Category[] = [];
  const visited = new Set<string>();
  let current = categories.find((category) => category.id === categoryId);

  while (current && !visited.has(current.id)) {
    trail.unshift(current);
    visited.add(current.id);
    current = current.parentId
      ? categories.find((category) => category.id === current?.parentId)
      : undefined;
  }

  return trail;
}

export function getCategoryAndDescendantIds(
  categories: Category[],
  categoryId: string,
) {
  const ids = new Set([categoryId]);
  let changed = true;

  while (changed) {
    changed = false;
    categories.forEach((category) => {
      if (
        category.parentId &&
        ids.has(category.parentId) &&
        !ids.has(category.id)
      ) {
        ids.add(category.id);
        changed = true;
      }
    });
  }

  return ids;
}

export function getRelatedProducts(
  products: Product[],
  product: Product,
  limit = 4,
) {
  return getPublishedProducts(products)
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categoryIds.some((categoryId) =>
          product.categoryIds.includes(categoryId),
        ),
    )
    .sort((first, second) => {
      const firstScore =
        Number(first.isRecommended) * 2 + Number(first.isBestseller);
      const secondScore =
        Number(second.isRecommended) * 2 + Number(second.isBestseller);
      return secondScore - firstScore || first.sortOrder - second.sortOrder;
    })
    .slice(0, limit);
}

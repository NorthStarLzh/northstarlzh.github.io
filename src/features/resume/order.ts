export function orderedByCmsOrder<T extends { order: number }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((left, right) => left.order - right.order);
}

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function collectPages<T>(loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>, pageSize = 500) {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

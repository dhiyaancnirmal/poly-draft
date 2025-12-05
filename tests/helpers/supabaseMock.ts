type TableRows = Record<string, any[]>

type FilterFn = (row: any) => boolean

function parseOrFilter(condition: string): FilterFn {
  const parts = condition.split(',').map((p) => p.trim()).filter(Boolean)
  const predicates = parts
    .map((part) => {
      const [lhs, rhs] = part.split('.eq.')
      if (!lhs || rhs === undefined) return null
      return (row: any) => row[lhs] === rhs
    })
    .filter(Boolean) as FilterFn[]
  return (row: any) => predicates.some((fn) => fn(row))
}

function makeQuery(table: string, getRows: () => any[], transform?: (rows: any[]) => any[]) {
  const filters: FilterFn[] = []
  let orderBy: { column: string; ascending: boolean } | null = null
  let limitCount: number | null = null

  const applyFilters = () => {
    let rows = [...getRows()]
    for (const f of filters) rows = rows.filter(f)
    if (transform) rows = transform(rows)
    if (orderBy) {
      const currentOrder = orderBy
      rows.sort((a, b) => {
        const av = a[currentOrder.column]
        const bv = b[currentOrder.column]
        if (av === bv) return 0
        return currentOrder.ascending ? (av > bv ? 1 : -1) : av > bv ? -1 : 1
      })
    }
    if (limitCount !== null) rows = rows.slice(0, limitCount)
    return rows
  }

  const builder: any = {
    select() {
      return builder
    },
    eq(column: string, value: any) {
      filters.push((row) => row[column] === value)
      return builder
    },
    neq(column: string, value: any) {
      filters.push((row) => row[column] !== value)
      return builder
    },
    in(column: string, values: any[]) {
      filters.push((row) => values.includes(row[column]))
      return builder
    },
    or(condition: string) {
      const predicate = parseOrFilter(condition)
      filters.push(predicate)
      return builder
    },
    order(column: string, opts?: { ascending?: boolean }) {
      orderBy = { column, ascending: opts?.ascending !== false }
      return builder
    },
    limit(count: number) {
      limitCount = count
      return builder
    },
    async maybeSingle() {
      const rows = applyFilters()
      return { data: rows[0] ?? null, error: null }
    },
    async single() {
      const rows = applyFilters()
      if (!rows[0]) return { data: null, error: { message: 'No row' } }
      return { data: rows[0], error: null }
    },
    then(resolve: any) {
      return resolve({ data: applyFilters(), error: null })
    },
  }

  return builder
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>

export function createSupabaseMock(config: { tables: TableRows; authUser?: any }) {
  const tableStore = new Map<string, any[]>()
  for (const [name, rows] of Object.entries(config.tables)) {
    tableStore.set(name, [...rows])
  }

  const inserts: Record<string, any[]> = {}
  const upserts: Record<string, any[]> = {}

  const getRows = (table: string) => tableStore.get(table) ?? []
  const setRows = (table: string, rows: any[]) => tableStore.set(table, rows)

  const supabase: any = {
    __inserts: inserts,
    __upserts: upserts,
    __getTable(name: string) {
      return [...getRows(name)]
    },
    auth: {
      async getUser(_token?: string) {
        if (config.authUser) return { data: { user: config.authUser }, error: null }
        return { data: { user: null }, error: null }
      },
    },
    from(table: string) {
      return {
        select() {
          const transform =
            table === 'picks'
              ? (rows: any[]) =>
                  rows.map((row) => {
                    const existingOutcome = (row as any).outcome ?? (row as any).outcomes
                    if (existingOutcome) return { ...row, outcome: existingOutcome }
                    const outcome = getRows('outcomes').find((o) => o.id === (row as any).outcome_id)
                    return outcome ? { ...row, outcome: { current_price: outcome.current_price } } : row
                  })
              : undefined
          return makeQuery(table, () => getRows(table), transform)
        },
        update(payload: any) {
          const filters: FilterFn[] = []
          const applyFilters = () => {
            let rows = [...getRows(table)]
            for (const f of filters) rows = rows.filter(f)
            return rows
          }

          const builder: any = {
            eq(column: string, value: any) {
              filters.push((row) => row[column] === value)
              return builder
            },
            in(column: string, values: any[]) {
              filters.push((row) => values.includes(row[column]))
              return builder
            },
            async single() {
              const res = await builder.then()
              return { data: res.data?.[0] ?? null, error: res.error }
            },
            async maybeSingle() {
              const res = await builder.then()
              return { data: res.data?.[0] ?? null, error: res.error }
            },
            then(resolve: any) {
              const rows = getRows(table)
              const targets = applyFilters()
              const updated = rows.map((row) => (targets.includes(row) ? { ...row, ...payload } : row))
              setRows(table, updated)
              return resolve({ data: targets.map((t) => ({ ...t, ...payload })), error: null })
            },
          }

          return builder
        },
        insert(payload: any) {
          const asArray = Array.isArray(payload) ? payload : [payload]
          const current = getRows(table)
          const inserted = asArray.map((r) => ({ ...r }))
          setRows(table, [...current, ...inserted])
          inserts[table] = [...(inserts[table] ?? []), ...inserted]
          const selector = {
            select() {
              return {
                async single() {
                  return { data: inserted[0] ?? null, error: null }
                },
                async maybeSingle() {
                  return { data: inserted[0] ?? null, error: null }
                },
              }
            },
            async single() {
              return { data: inserted[0] ?? null, error: null }
            },
            async maybeSingle() {
              return { data: inserted[0] ?? null, error: null }
            },
          }
          return selector
        },
        upsert(payload: any, _opts?: any) {
          const asArray = Array.isArray(payload) ? payload : [payload]
          const current = getRows(table)
          const next = [...current]
          for (const row of asArray) {
            const idx = row.id ? next.findIndex((r) => r.id === row.id) : -1
            if (idx >= 0) next[idx] = { ...next[idx], ...row }
            else next.push({ ...row })
          }
          setRows(table, next)
          upserts[table] = [...(upserts[table] ?? []), ...asArray]
          return Promise.resolve({ error: null })
        },
      }
    },
  }

  return supabase
}


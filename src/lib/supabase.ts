// Supabase client configuration
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null } }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (field: string, value: any) => ({
        order: (field: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
        }),
        data: [],
        error: null,
    }),
      data: [],
      error: null,
    }),
    insert: async (data: any) => ({ data: null, error: null }),
    update: async (data: any) => ({ data: null, error: null }),
    delete: async () => ({ error: null }),
  }),
};

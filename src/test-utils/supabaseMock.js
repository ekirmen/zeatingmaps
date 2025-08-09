// Test utility to mock @supabase/supabase-js createClient with chainable PostgREST-like API

const state = {
  auth: {
    async getUser() {
      return { data: { user: { id: 'test-user' } }, error: null };
    },
  },
  tables: {
    // tableName: { select: async () => ({ data, error }), delete: async () => ({ error }) }
  },
};

function resetSupabaseMock() {
  state.auth.getUser = async () => ({ data: { user: { id: 'test-user' } }, error: null });
  state.tables = {};
}

function setAuthGetUser(fn) {
  state.auth.getUser = fn;
}

function setTableHandlers(tableName, handlers) {
  state.tables[tableName] = handlers || {};
}

function getTableHandlers(table) {
  return state.tables[table] || {};
}

function buildClient() {
  return {
    auth: {
      getUser: (...args) => state.auth.getUser(...args),
    },
    from(table) {
      const handlers = getTableHandlers(table);
      return {
        select() {
          return {
            eq: async () => {
              if (handlers.select) return handlers.select();
              return { data: null, error: null };
            },
            in: async () => {
              if (handlers.select) return handlers.select();
              return { data: null, error: null };
            },
            single: async () => {
              if (handlers.select) return handlers.select();
              return { data: null, error: null };
            },
          };
        },
        delete() {
          return {
            eq: async () => {
              if (handlers.delete) return handlers.delete();
              return { error: null };
            },
            in: async () => {
              if (handlers.delete) return handlers.delete();
              return { error: null };
            },
          };
        },
        eq: async () => ({ error: null }),
        in: async () => ({ error: null }),
      };
    },
    channel() {
      return { on: () => ({ subscribe: () => ({}) }) };
    },
    removeChannel() {},
  };
}

module.exports = {
  state,
  resetSupabaseMock,
  setAuthGetUser,
  setTableHandlers,
  buildClient,
};



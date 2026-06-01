type Environment = "development" | "test" | "staging" | "production";

interface EnvironmentConfig {
  database: {
    ssl: boolean;
    maxConnections: number;
    idleTimeout: number;
  };
}

const configurations: Record<Environment, EnvironmentConfig> = {
  development: {
    database: {
      ssl: false,
      maxConnections: 10,
      idleTimeout: 30,
    },
  },
  test: {
    database: {
      ssl: false,
      maxConnections: 5,
      idleTimeout: 10,
    },
  },
  staging: {
    database: {
      ssl: true,
      maxConnections: 20,
      idleTimeout: 60,
    },
  },
  production: {
    database: {
      ssl: true,
      maxConnections: 50,
      idleTimeout: 120,
    },
  },
};

export function getConfig(): EnvironmentConfig {
  const env = (process.env.NODE_ENV || "development") as Environment;
  return configurations[env] || configurations.development;
}
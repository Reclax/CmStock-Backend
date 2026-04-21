const revokedTokens = new Map();

const cleanupExpired = () => {
  const now = Date.now();
  for (const [token, expiry] of revokedTokens.entries()) {
    if (expiry <= now) {
      revokedTokens.delete(token);
    }
  }
};

export const tokenBlacklistService = {
  revoke(token, expSeconds) {
    if (!token || !expSeconds) {
      return;
    }

    const expiryMs = expSeconds * 1000;
    revokedTokens.set(token, expiryMs);
    cleanupExpired();
  },

  isRevoked(token) {
    cleanupExpired();
    if (!token) {
      return false;
    }

    const expiry = revokedTokens.get(token);
    if (!expiry) {
      return false;
    }

    if (expiry <= Date.now()) {
      revokedTokens.delete(token);
      return false;
    }

    return true;
  },
};

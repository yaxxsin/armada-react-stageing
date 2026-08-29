import { query } from '../db.ts';

function actionFromMethod(method) {
  switch (method) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

export function auditLog(entityType) {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
      const duration = Date.now() - startTime;
      const userId = req.user?.id ?? null;
      const entityId = req.params?.id ? parseInt(req.params.id, 10) : null;
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        null;

      const action = actionFromMethod(req.method);
      let details = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
      if (req.validated) {
        const sanitized = { ...req.validated };
        if (sanitized.password) sanitized.password = '***';
        if (sanitized.password_hash) sanitized.password_hash = '***';
        details += ` payload=${JSON.stringify(sanitized)}`;
      }

      query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, action, entityType, entityId, details, ip]
      ).catch(() => {
        /* audit logging should never break the request */
      });

      return originalEnd(...args);
    };

    next();
  };
}
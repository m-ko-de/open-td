import request from 'supertest';
import express from 'express';
import { TelemetryRouter } from '../TelemetryRouter';
import { describe, it, expect } from 'vitest';

describe('TelemetryRouter', () => {
  it('should save and list error reports for an authenticated user', async () => {
    const app = express();
    app.use(express.json());
    // Mock simple auth middleware that puts user into req
    app.use((req, _res, next) => {
      (req as any).user = { userId: 'testuser' };
      next();
    });

    const router = new TelemetryRouter('memory');
    app.use('/telemetry', router.router);

    const report = { message: 'Test error', stack: 'stack' };
    const saveResp = await request(app).post('/telemetry/report').send({ report });
    expect(saveResp.status).toBe(200);
    expect(saveResp.body.success).toBe(true);

    const listResp = await request(app).get('/telemetry/errors');
    expect(listResp.status).toBe(200);
    expect(listResp.body.success).toBe(true);
    expect(Array.isArray(listResp.body.reports)).toBe(true);
    expect(listResp.body.reports.length).toBeGreaterThan(0);
    expect(listResp.body.reports[0].message).toBe('Test error');
  });
});

import request from 'supertest';
import { app } from '../index';

describe('GET /health', () => {
  it('returns ok status with db connection and timestamp', async () => {
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns db: connected when database is reachable', async () => {
    const res = await request(app).get('/health');
    expect(res.body.db).toBe('connected');
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});

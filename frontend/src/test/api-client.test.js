import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import api from '../api/api';

// Exercise the Axios interceptors directly and stub the adapter to avoid network calls.
describe('configured API client', () => {
  beforeEach(() => {
    // Start each case with empty browser storage and Axios defaults.
    localStorage.clear();
    api.defaults.adapter = axios.defaults.adapter;
  });

  it('uses the configured local base URL, JSON headers, cookies, and optional bearer token', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:8000/');
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers['content-type']).toBe('application/json');
    const attachToken = api.interceptors.request.handlers[0].fulfilled;
    const noTokenConfig = attachToken({ headers: {} });
    expect(noTokenConfig.headers.Authorization).toBeUndefined();
    localStorage.setItem(ACCESS_TOKEN, 'current-access');
    expect(attachToken({ headers: {} }).headers.Authorization).toBe('Bearer current-access');
  });

  it('passes successful responses through and does not refresh authentication requests', async () => {
    const responseHandler = api.interceptors.response.handlers[0];
    const response = { status: 200, data: { ok: true } };
    expect(responseHandler.fulfilled(response)).toBe(response);
    const authError = { config: { url: '/api/token/', headers: {} }, response: { status: 401 } };
    await expect(responseHandler.rejected(authError)).rejects.toBe(authError);
  });

  it('refreshes an expired access token and retries the original request once', async () => {
    localStorage.setItem(REFRESH_TOKEN, 'refresh-token');
    const postRefresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access: 'new-access' } });
    // The adapter returns one expired-token response, then a successful retry.
    let requests = 0;
    api.defaults.adapter = async (config) => {
      requests += 1;
      if (requests === 1) {
        const error = new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, null, { status: 401, data: {} });
        throw error;
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };
    const result = await api.get('/vehicle_api/vehicles/');
    expect(result.data).toEqual({ ok: true });
    expect(requests).toBe(2);
    expect(postRefresh).toHaveBeenCalledWith('http://localhost:8000/api/token/refresh/', { refresh: 'refresh-token' });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('new-access');
    postRefresh.mockRestore();
  });
});

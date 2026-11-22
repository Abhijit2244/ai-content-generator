import { env } from '../../../config/env.js';
import {
  IAiServiceClient,
  AiGenerateInput,
  AiGenerateOutput,
  AiRefineInput,
  AiRefineOutput,
  AiVariationsInput,
  AiVariationsOutput,
} from '../domain/generation.js';
import { AiProviderError } from '../../../shared/errors/app-error.js';

export class HttpAiServiceClient implements IAiServiceClient {
  private readonly baseUrl: string;
  private readonly serviceToken: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = env.AI_SERVICE_URL,
    serviceToken = env.AI_SERVICE_TOKEN,
    timeoutMs = 60000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.serviceToken = serviceToken;
    this.timeoutMs = timeoutMs;
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, unknown>,
    requestId?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.serviceToken}`,
          ...(requestId ? { 'x-request-id': requestId } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMessage = `AI service failed with status ${response.status}`;
        let errorCode = 'AI_PROVIDER_ERROR';
        try {
          const errorJson = (await response.json()) as { error?: { message?: string; code?: string } };
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
          if (errorJson.error?.code) {
            errorCode = errorJson.error.code;
          }
        } catch {
          // fallback to status code message
        }
        throw new AiProviderError(errorMessage, errorCode);
      }

      const data = (await response.json()) as T;
      return data;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof AiProviderError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new AiProviderError(
          'Content generation timed out from AI service. Please try again.',
          'AI_PROVIDER_TIMEOUT'
        );
      }

      const message = err instanceof Error ? err.message : 'Unknown AI connection failure';
      throw new AiProviderError(
        `Failed to reach AI service: ${message}`,
        'AI_SERVICE_UNAVAILABLE'
      );
    }
  }

  async generate(input: AiGenerateInput, requestId?: string): Promise<AiGenerateOutput> {
    return this.request<AiGenerateOutput>('/internal/v1/generate', input as unknown as Record<string, unknown>, requestId);
  }

  async refine(input: AiRefineInput, requestId?: string): Promise<AiRefineOutput> {
    return this.request<AiRefineOutput>('/internal/v1/refine', input as unknown as Record<string, unknown>, requestId);
  }

  async createVariations(
    input: AiVariationsInput,
    requestId?: string
  ): Promise<AiVariationsOutput> {
    return this.request<AiVariationsOutput>('/internal/v1/variations', input as unknown as Record<string, unknown>, requestId);
  }
}

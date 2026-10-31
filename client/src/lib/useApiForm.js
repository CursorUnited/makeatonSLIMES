import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * react-hook-form wired to a zod schema, with a `submitApi` helper that maps
 * a rejected ApiError's `fields` onto the right inputs and re-throws anything
 * else (so the caller's catch can toast it).
 */
export function useApiForm(schema, options) {
  const form = useForm({ resolver: zodResolver(schema), mode: 'onBlur', ...options });

  async function submitApi(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err?.fields) {
        for (const [path, message] of Object.entries(err.fields)) {
          form.setError(path, { type: 'server', message });
        }
      }
      throw err;
    }
  }

  return { ...form, submitApi };
}

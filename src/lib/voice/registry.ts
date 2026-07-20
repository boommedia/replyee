import type { VoiceProvider, VoiceProviderName } from './types'
import { retellProvider } from './retell'

// Single source of truth: provider name -> adapter instance.
// To add a voice vendor (or swap Retell out entirely), change ONLY this map.
// Nothing above this layer — routes, jobs, future UI — imports an adapter file.
const REGISTRY: Partial<Record<VoiceProviderName, VoiceProvider>> = {
  retell: retellProvider,
  // vapi, bland, twilio_self_hosted — write an adapter, add it here, done.
}

/** The provider used when a caller doesn't name one (e.g. new agent creation). */
export const DEFAULT_VOICE_PROVIDER: VoiceProviderName =
  (process.env.VOICE_PROVIDER as VoiceProviderName) || 'retell'

export function getProvider(name: VoiceProviderName): VoiceProvider {
  const p = REGISTRY[name]
  if (!p) throw new Error(`No voice provider registered for "${name}"`)
  return p
}

/** Providers that have an adapter AND working credentials right now. */
export function liveProviders(): VoiceProviderName[] {
  return (Object.keys(REGISTRY) as VoiceProviderName[]).filter((n) => REGISTRY[n]?.isConfigured())
}

/** All providers we have any adapter for (configured or not). */
export function knownProviders(): VoiceProviderName[] {
  return Object.keys(REGISTRY) as VoiceProviderName[]
}

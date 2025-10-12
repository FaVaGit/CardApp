// Central fabric shim to avoid Rollup warning about missing named export "fabric".
// Usage: import fabric from './fabricShim';
// It normalizes both ESM build (namespace) and UMD default export patterns.
// We avoid static import to suppress Rollup named export warning.
// Consumers can either default import (async) or await loadFabric().
let cached = null;
export async function loadFabric() {
	if (cached) return cached;
	const mod = await import('fabric');
	cached = mod.fabric || mod.default || mod; // normalize
	return cached;
}
// Synchronous fallback (may remain undefined until first loadFabric call)
export default cached;

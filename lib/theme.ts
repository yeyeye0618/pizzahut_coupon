export type Theme = 'dark' | 'light' | 'system'

export const THEME_STORAGE_KEY = 'theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system'
}

/**
 * Runs inline in <head> before first paint so a stored light choice never
 * flashes dark. Kept tiny and dependency-free; it is shipped as a string.
 */
export const THEME_INIT_SCRIPT = `(function(){var t='dark';try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');if(s==='light'||s==='system')t=s}catch(e){}document.documentElement.dataset.theme=t})()`

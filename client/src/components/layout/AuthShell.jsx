import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../ui/Logo.jsx';
import { config } from '../../config.js';
import * as auth from '../../services/auth.js';
import { useAuth } from '../../store/authStore.js';

let googleScriptPromise;
function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-google-identity]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('Google nu a putut fi inițializat.')), { once: true });
    script.addEventListener('error', () => reject(new Error('Nu s-a putut încărca autentificarea Google.')), { once: true });
    if (window.google?.accounts?.id) resolve(window.google.accounts.id);
  }).catch((error) => { googleScriptPromise = null; throw error; });
  return googleScriptPromise;
}

// Formularul rămâne în centrul paginii, fără panoul de prezentare lateral.
export default function AuthShell({ children }) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-fm-page px-4 py-10">
      <main className="relative w-full max-w-md">
        <div className="mx-auto w-full max-w-sm text-center">
          <Link to="/" aria-label="FairMatch — pagina principală" className="mx-auto mb-7 inline-flex"><LogoMark className="h-12 w-12 text-fm-ink" /></Link>
          {children}
        </div>
      </main>
    </div>
  );
}

export const GoogleButton = ({ className = '', role = 'FREELANCER', mode = 'login', disabled = false, onSuccess }) => {
  const googleAuth = useAuth((state) => state.googleAuth);
  const buttonHost = useRef(null);
  const successRef = useRef(onSuccess);
  const roleRef = useRef(role);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  successRef.current = onSuccess;
  roleRef.current = role;

  useEffect(() => {
    if (disabled) {
      setReady(false);
      if (buttonHost.current) buttonHost.current.innerHTML = '';
      return undefined;
    }
    let active = true;
    let identity;
    let resizeObserver;
    setReady(false);
    setError('');

    const renderGoogleButton = (nonce) => {
      if (!active || !identity || !buttonHost.current) return;
      const host = buttonHost.current;
      // Google gestionează copiii acestui container; React îl păstrează gol în JSX.
      host.innerHTML = '';
      identity.initialize({
        client_id: config.googleClientId,
        nonce,
        // FedCM: browserul afișează singur selectorul de cont, fără window.open,
        // deci nu mai depinde de blocarea popup-urilor (Chrome/Edge). Celelalte
        // browsere revin automat la fereastra popup.
        use_fedcm_for_button: true,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }) => {
          if (!active) return;
          setError('');
          setLoading(true);
          try {
            if (!credential) throw new Error('Google nu a returnat credentialul contului.');
            const user = await googleAuth({ credential, nonce, role: roleRef.current, intent: mode === 'register' ? 'register' : 'login' });
            await successRef.current?.(user);
          } catch (authError) {
            if (active) {
              setError(authError.message || 'Autentificarea cu Google a eșuat. Încearcă din nou.');
              // Provocarea are valabilitate limitată și se consumă la autentificare.
              // Reîmprospătăm butonul ca următoarea încercare să folosească una nouă.
              try {
                const nextChallenge = await auth.googleChallenge();
                if (active) renderGoogleButton(nextChallenge.nonce);
              } catch { /* eroarea inițială rămâne vizibilă */ }
            }
          } finally {
            if (active) setLoading(false);
          }
        },
        error_callback: () => {
          if (active) setError('Fereastra Google nu s-a deschis. Permite ferestrele popup pentru acest site și încearcă din nou.');
        },
      });
      identity.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'register' ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.max(200, Math.floor(host.getBoundingClientRect().width)),
        locale: 'ro',
      });
      setReady(true);
    };

    async function initialize() {
      try {
        if (!config.googleClientId) throw new Error('Lipsește VITE_GOOGLE_CLIENT_ID din client/.env.');
        const [{ nonce }, googleIdentity] = await Promise.all([auth.googleChallenge(), loadGoogleIdentity()]);
        if (!active) return;
        identity = googleIdentity;
        renderGoogleButton(nonce);
        if (typeof ResizeObserver !== 'undefined' && buttonHost.current) {
          resizeObserver = new ResizeObserver(() => {
            const host = buttonHost.current;
            if (!active || !identity || !host) return;
            // Google își desenează butonul într-un iframe; îl redesenăm numai la
            // schimbarea lățimii containerului pentru a rămâne responsive.
            const width = Math.floor(host.getBoundingClientRect().width);
            if (width > 0) {
              host.innerHTML = '';
              identity.renderButton(host, {
                type: 'standard', theme: 'outline', size: 'large',
                text: mode === 'register' ? 'signup_with' : 'continue_with',
                shape: 'rectangular', logo_alignment: 'left', width, locale: 'ro',
              });
            }
          });
          resizeObserver.observe(buttonHost.current);
        }
      } catch (initError) {
        if (active) setError(initError.message || 'Nu s-a putut încărca autentificarea Google.');
      }
    }

    initialize();
    return () => {
      active = false;
      resizeObserver?.disconnect();
      if (buttonHost.current) buttonHost.current.innerHTML = '';
    };
  }, [disabled, googleAuth, mode]);

  return (
    <div className={className}>
      {disabled ? (
        <button type="button" disabled className="flex min-h-12 w-full items-center justify-center border border-fm-graphite/15 bg-white px-4 py-3 text-sm font-semibold text-fm-ink opacity-60" aria-describedby="google-register-terms-hint">Continuă cu Google</button>
      ) : (
        <>
          <div ref={buttonHost} className="min-h-12 w-full" aria-label={mode === 'register' ? 'Înregistrare cu Google' : 'Autentificare cu Google'} />
          {!ready && <p role="status" className="mt-2 text-sm text-fm-slate/60">{loading ? 'Se conectează…' : 'Se încarcă Google…'}</p>}
        </>
      )}
      {disabled && <p id="google-register-terms-hint" className="mt-2 text-left text-xs text-fm-slate/60">Acceptă termenii și politica de confidențialitate pentru a continua cu Google.</p>}
      {error && <p role="alert" className="mt-2 text-left text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export const Divider = () => (
  <div className="my-6 flex items-center gap-4 text-xs text-fm-slate/50"><span className="h-px flex-1 bg-fm-graphite/10" /> sau <span className="h-px flex-1 bg-fm-graphite/10" /></div>
);
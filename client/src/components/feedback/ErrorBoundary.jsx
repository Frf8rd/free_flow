import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-fm-ink">Ceva nu a mers</h1>
          <p className="mt-2 text-sm text-fm-slate/70">A apărut o eroare neașteptată. Reîncarcă pagina; dacă se repetă, scrie-ne.</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} className="mt-5 rounded-md bg-fm-ink px-5 py-2.5 text-sm font-semibold text-white">Reîncarcă</button>
        </div>
      </div>
    );
  }
}

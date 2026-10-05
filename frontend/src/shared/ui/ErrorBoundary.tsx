import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { failed: boolean };

/** Evita que un error de render deje toda la aplicación en blanco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error de interfaz", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="empty-state" role="alert">
        <strong>No se pudo mostrar esta pantalla</strong>
        <p>Ocurrió un problema inesperado. Tus datos guardados no se modificaron.</p>
        <button className="button" onClick={() => this.setState({ failed: false })}>
          Reintentar
        </button>
      </section>
    );
  }
}

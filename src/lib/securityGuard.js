/**
 * Security Guard & Anti-Inspection Module
 * Proteção no frontend contra inspeção de código, atalhos de DevTools,
 * cópia não autorizada e clique direito.
 */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  // 1. Desativar menu de contexto (botão direito do mouse)
  document.addEventListener('contextmenu', (e) => {
    // Permitir botão direito apenas em inputs e textareas se necessário
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    e.preventDefault();
  }, { capture: true });

  // 2. Bloquear atalhos de teclado comuns de inspeção e cópia de código
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // F12 (DevTools)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I ou Cmd+Option+I (Inspecionar elemento)
    if (modifier && (e.shiftKey || e.altKey) && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+J ou Cmd+Option+J (Abrir Console)
    if (modifier && (e.shiftKey || e.altKey) && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+C ou Cmd+Option+C (Inspecionar elemento / picker)
    if (modifier && (e.shiftKey || e.altKey) && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U ou Cmd+Option+U (Exibir código fonte da página)
    if (modifier && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S ou Cmd+S (Salvar página / código HTML)
    if (modifier && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+P ou Cmd+P (Imprimir página)
    if (modifier && (e.key === 'P' || e.key === 'p' || e.keyCode === 80)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 3. Limpar e ofuscar consoles de depuração em produção
  if (import.meta.env.PROD) {
    try {
      const noop = () => {};
      window.console.log = noop;
      window.console.debug = noop;
      window.console.info = noop;
      window.console.dir = noop;
      window.console.table = noop;
    } catch {}
  }
}

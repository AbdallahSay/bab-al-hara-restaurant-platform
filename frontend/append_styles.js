const fs = require('fs');

const cssToAppend = `
@import 'sweetalert2/dist/sweetalert2.min.css';

/* SweetAlert2 Overrides for Bab Al Hara Design Tokens */
.swal2-popup {
  font-family: var(--font-family) !important;
  background: var(--color-surface) !important;
  color: var(--color-ink) !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-subtle) !important;
}

.swal2-title {
  color: var(--color-ink) !important;
}

.swal2-html-container {
  color: var(--color-ink-muted) !important;
}

.swal2-icon.swal2-success {
  border-color: var(--color-success) !important;
  color: var(--color-success) !important;
}
.swal2-icon.swal2-success [class^='swal2-success-line'] {
  background-color: var(--color-success) !important;
}
.swal2-icon.swal2-success .swal2-success-ring {
  border-color: var(--color-success-soft) !important;
}

@media (prefers-reduced-motion: reduce) {
  .swal2-popup,
  .swal2-noanimation {
    animation: none !important;
    transition: none !important;
  }
  .swal2-icon {
    animation: none !important;
  }
}
`;

fs.appendFileSync('src/styles.scss', cssToAppend, 'utf8');
console.log('Appended styles successfully.');

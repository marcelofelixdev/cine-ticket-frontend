import styles from './Logo.module.css'

/** Rolo de filme com furos vazados (funciona sobre qualquer fundo) e o nome em DM Serif Display. */
const ROLO =
  'M2 22a20 20 0 1 0 40 0a20 20 0 1 0-40 0Z' +
  'M18 22a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z' +
  'M17.5 10.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z' +
  'M28.5 18.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z' +
  'M24.3 31.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z' +
  'M10.7 31.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z' +
  'M6.5 18.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={className ? `${styles.logo} ${className}` : styles.logo}>
      <svg viewBox="0 0 44 44" aria-hidden="true" className={styles.rolo}>
        <path d={ROLO} fillRule="evenodd" />
      </svg>
      CineTicket
    </span>
  )
}

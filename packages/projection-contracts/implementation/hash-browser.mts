import {digest} from 'ohash/crypto'
export const sha256=(value: string): string=>Array.from(atob(digest(value).replaceAll('-','+').replaceAll('_','/')+'='),
  c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('')

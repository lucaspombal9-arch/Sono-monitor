/* ================================================================
   storage.js
   localStorage wrapper that mirrors the window.storage API used
   in the Claude artifact version, with full error handling.
================================================================ */

const PREFIX = 'elitesleep_';

export function sGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[storage] sGet failed for key:', key, err);
    return null;
  }
}

export function sSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    // QuotaExceededError or SecurityError
    console.warn('[storage] sSet failed for key:', key, err);
    return false;
  }
}

export function sDel(key) {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch (err) {
    console.warn('[storage] sDel failed for key:', key, err);
    return false;
  }
}

export function sDelAll() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    return true;
  } catch (err) {
    console.warn('[storage] sDelAll failed:', err);
    return false;
  }
}
